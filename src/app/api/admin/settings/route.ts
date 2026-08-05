import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isValidHex } from "@/lib/app-settings";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session.user;
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

  const settings = await prisma.appSettings.findUnique({ where: { id: "singleton" } });
  return NextResponse.json(settings ?? {
    appName: "App Palestra",
    primaryColor: "#f97316",
    logoBase64: null,
    faviconBase64: null,
  });
}

export async function PUT(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

  const body = await req.json();
  const { appName, primaryColor, logoBase64, faviconBase64 } = body;

  if (appName !== undefined && (typeof appName !== "string" || !appName.trim())) {
    return NextResponse.json({ error: "Nome app non valido" }, { status: 400 });
  }
  if (primaryColor !== undefined && !isValidHex(primaryColor)) {
    return NextResponse.json({ error: "Colore non valido (hex richiesto)" }, { status: 400 });
  }

  const updated = await prisma.appSettings.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      appName: appName?.trim() ?? "App Palestra",
      primaryColor: primaryColor ?? "#f97316",
      logoBase64: logoBase64 ?? null,
      faviconBase64: faviconBase64 ?? null,
    },
    update: {
      ...(appName !== undefined && { appName: appName.trim() }),
      ...(primaryColor !== undefined && { primaryColor }),
      ...(logoBase64 !== undefined && { logoBase64 }),
      ...(faviconBase64 !== undefined && { faviconBase64 }),
    },
  });

  return NextResponse.json(updated);
}
