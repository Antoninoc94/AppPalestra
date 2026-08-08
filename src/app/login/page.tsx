import fs from "fs";
import path from "path";
import { getAppSettings } from "@/lib/app-settings";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const settings = await getAppSettings();

  let defaultLogoSvg: string | null = null;
  if (!settings.logoBase64) {
    try {
      const raw = fs.readFileSync(
        path.join(process.cwd(), "public", "logo.svg"),
        "utf-8"
      );
      // Inject width/height so the inline SVG sizes correctly
      defaultLogoSvg = raw.replace("<svg ", '<svg width="260" height="55" ');
    } catch {
      // logo.svg not found, will fall back to text
    }
  }

  return (
    <LoginForm
      appName={settings.appName}
      logoBase64={settings.logoBase64}
      defaultLogoSvg={defaultLogoSvg}
    />
  );
}
