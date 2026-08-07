export const dynamic = "force-dynamic";

import type { MetadataRoute } from "next";
import { getAppSettings } from "@/lib/app-settings";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const s = await getAppSettings();
  const shortName = s.appName.split(" ")[0];

  return {
    name: s.appName,
    short_name: shortName,
    description: "Il tuo tracker personale per la palestra",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: s.primaryColor ?? "#09090b",
    orientation: "portrait-primary",
    categories: ["fitness", "health"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/favicon.svg",  sizes: "any",     type: "image/svg+xml" },
    ],
  };
}
