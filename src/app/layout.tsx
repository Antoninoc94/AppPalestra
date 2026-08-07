import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/layout/BottomNav";
import { TopHeader } from "@/components/layout/TopHeader";
import { auth } from "@/auth";
import { getAppSettings, buildPrimaryColorCss } from "@/lib/app-settings";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export async function generateMetadata(): Promise<Metadata> {
  const s = await getAppSettings();
  return {
    title: s.appName,
    description: "Il tuo tracker personale per la palestra",
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: s.appName,
      startupImage: "/apple-icon.png",
    },
    ...(s.faviconBase64
      ? { icons: { icon: s.faviconBase64, apple: s.faviconBase64 } }
      : { icons: { icon: "/favicon.svg", apple: "/apple-icon.png" } }),
  };
}

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  interactiveWidget: "resizes-content",
  viewportFit: "cover",
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
        <link rel="icon" href={settings.faviconBase64 ?? "/favicon.svg"} />
        <link rel="apple-touch-icon" href={settings.faviconBase64 ?? "/apple-icon.png"} />
      </head>
      <body className="min-h-full bg-zinc-950 text-zinc-100 antialiased">
        {isLoggedIn && <TopHeader logoBase64={settings.logoBase64} appName={settings.appName} />}
        <main className={`mx-auto max-w-lg min-h-screen pb-main ${isLoggedIn ? "pt-12" : ""}`}>
          {children}
        </main>
        {isLoggedIn && <BottomNav />}
      </body>
    </html>
  );
}
