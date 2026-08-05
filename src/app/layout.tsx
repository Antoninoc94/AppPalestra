import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/layout/BottomNav";
import { auth } from "@/auth";
import { getAppSettings, buildPrimaryColorCss } from "@/lib/app-settings";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export async function generateMetadata(): Promise<Metadata> {
  const s = await getAppSettings();
  return {
    title: s.appName,
    description: "Il tuo tracker personale per la palestra",
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: s.appName,
    },
    ...(s.faviconBase64
      ? { icons: { icon: s.faviconBase64, apple: s.faviconBase64 } }
      : { icons: { icon: "/icon-192.png", apple: "/apple-icon.png" } }),
  };
}

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  interactiveWidget: "resizes-content",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [session, settings] = await Promise.all([auth(), getAppSettings()]);
  const isLoggedIn = !!session?.user;
  const colorCss = buildPrimaryColorCss(settings.primaryColor);

  return (
    <html lang="it" className={`${geist.variable} h-full`}>
      <head>
        {colorCss && (
          <style dangerouslySetInnerHTML={{ __html: colorCss }} />
        )}
        {settings.faviconBase64 && (
          <link rel="icon" href={settings.faviconBase64} />
        )}
      </head>
      <body className="min-h-full bg-zinc-950 text-zinc-100 antialiased">
        <main className="mx-auto max-w-lg min-h-screen pb-24">
          {children}
        </main>
        {isLoggedIn && <BottomNav logoBase64={settings.logoBase64} appName={settings.appName} />}
      </body>
    </html>
  );
}
