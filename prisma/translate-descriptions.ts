/**
 * Traduce le descrizioni degli esercizi in italiano usando l'API di Claude.
 * Richiede: ANTHROPIC_API_KEY=sk-ant-... nell'environment.
 * Esegui con:
 *   ANTHROPIC_API_KEY=sk-ant-... npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/translate-descriptions.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as https from "https";
import * as http from "http";
import type { IncomingMessage } from "http";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error("❌ ANTHROPIC_API_KEY non impostata.");
  process.exit(1);
}

const BATCH_SIZE = 15;
const MODEL = "claude-haiku-4-5-20251001";

function postJson(url: string, body: unknown, headers: Record<string, string>): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const parsed = new URL(url);
    const options: https.RequestOptions = {
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname + parsed.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
        ...headers,
      },
    };

    // Supporto proxy opzionale
    const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy;
    const makeRequest = (opts: https.RequestOptions, data: string) => {
      const req = https.request(opts, (res: IncomingMessage) => {
        let raw = "";
        res.on("data", (c: Buffer) => { raw += c.toString(); });
        res.on("end", () => {
          try { resolve(JSON.parse(raw)); }
          catch (e) { reject(new Error(`Parse error: ${raw.slice(0, 200)}`)); }
        });
      });
      req.on("error", reject);
      req.write(data);
      req.end();
    };

    if (proxyUrl) {
      const proxy = new URL(proxyUrl);
      const connectOpts: http.RequestOptions = {
        hostname: proxy.hostname,
        port: parseInt(proxy.port) || 8080,
        method: "CONNECT",
        path: `${parsed.hostname}:443`,
      };
      const connectReq = http.request(connectOpts);
      connectReq.on("connect", (_res, socket) => {
        const tlsOpts = { ...options, socket, hostname: parsed.hostname };
        // @ts-ignore – dynamic TLS over proxy socket
        const tlsReq = https.request(tlsOpts, (res: IncomingMessage) => {
          let raw = "";
          res.on("data", (c: Buffer) => { raw += c.toString(); });
          res.on("end", () => {
            try { resolve(JSON.parse(raw)); }
            catch (e) { reject(new Error(`Parse error: ${raw.slice(0, 200)}`)); }
          });
        });
        tlsReq.on("error", reject);
        tlsReq.write(payload);
        tlsReq.end();
      });
      connectReq.on("error", reject);
      connectReq.end();
    } else {
      makeRequest(options, payload);
    }
  });
}

async function translateBatch(items: { id: string; name: string; description: string }[]): Promise<Map<string, string>> {
  const numbered = items.map((item, i) =>
    `[${i + 1}] ESERCIZIO: ${item.name}\nISTRUZIONI:\n${item.description}`
  ).join("\n\n---\n\n");

  const prompt = `Sei un personal trainer italiano esperto. Traduci in italiano le seguenti istruzioni di esercizi ginnici.

REGOLE:
- Mantieni i numeri di passo (1. 2. 3. ecc.)
- Usa terminologia fitness italiana standard
- Tono diretto e chiaro
- Rispondi SOLO con le traduzioni numerate nel formato: [N] seguito dalle istruzioni tradotte
- Non aggiungere nient'altro

${numbered}`;

  const response = await postJson(
    "https://api.anthropic.com/v1/messages",
    {
      model: MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    },
    {
      "x-api-key": API_KEY!,
      "anthropic-version": "2023-06-01",
    }
  ) as { content: Array<{ type: string; text: string }>; error?: { message: string } };

  if (!response.content) {
    throw new Error(`API error: ${JSON.stringify(response)}`);
  }

  const text = response.content.find((b) => b.type === "text")?.text ?? "";

  // Estrai le traduzioni per indice [1], [2], ...
  const result = new Map<string, string>();
  const sections = text.split(/\n\n---\n\n|\[(\d+)\]/g);

  // Parser più robusto: cerca blocchi [N] ... fino al prossimo [N]
  const regex = /\[(\d+)\]([\s\S]*?)(?=\[\d+\]|$)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const idx = parseInt(match[1]) - 1;
    if (idx >= 0 && idx < items.length) {
      result.set(items[idx].id, match[2].trim());
    }
  }

  return result;
}

async function main() {
  const exercises = await prisma.exercise.findMany({
    where: { isCustom: false, description: { not: null } },
    select: { id: true, name: true, description: true },
  });

  // Filtra quelli già tradotti (stima: se non contiene articoli inglesi comuni)
  const toTranslate = exercises.filter((ex) => {
    const d = ex.description!;
    return /\b(the|your|you|and|to|a|an|of|in|with|on|at|by)\b/i.test(d);
  });

  console.log(`📚 Esercizi con descrizione: ${exercises.length}`);
  console.log(`🔄 Da tradurre (ancora in inglese): ${toTranslate.length}`);

  let translated = 0;
  let errors = 0;

  for (let i = 0; i < toTranslate.length; i += BATCH_SIZE) {
    const batch = toTranslate.slice(i, i + BATCH_SIZE).map((ex) => ({
      id: ex.id,
      name: ex.name,
      description: ex.description!,
    }));

    try {
      const translations = await translateBatch(batch);

      for (const [id, descIt] of translations) {
        if (descIt.trim().length > 20) {
          await prisma.exercise.update({ where: { id }, data: { description: descIt } });
          translated++;
        }
      }

      process.stdout.write(`   ${translated}/${toTranslate.length} tradotti...\r`);

      // Rate limit: pausa tra i batch
      if (i + BATCH_SIZE < toTranslate.length) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    } catch (err) {
      console.error(`\n⚠️  Errore batch ${Math.floor(i / BATCH_SIZE) + 1}:`, err);
      errors++;
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  console.log(`\n✅ Traduzione completata:`);
  console.log(`   Tradotti:  ${translated}`);
  console.log(`   Errori:    ${errors}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
