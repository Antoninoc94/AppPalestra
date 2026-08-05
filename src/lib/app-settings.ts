import { prisma } from "@/lib/prisma";
import { cache } from "react";

export interface AppSettings {
  appName: string;
  primaryColor: string;
  logoBase64: string | null;
  faviconBase64: string | null;
}

const DEFAULTS: AppSettings = {
  appName: "App Palestra",
  primaryColor: "#f97316",
  logoBase64: null,
  faviconBase64: null,
};

export const getAppSettings = cache(async (): Promise<AppSettings> => {
  try {
    const s = await prisma.appSettings.findUnique({ where: { id: "singleton" } });
    if (!s) return DEFAULTS;
    return {
      appName: s.appName || DEFAULTS.appName,
      primaryColor: isValidHex(s.primaryColor) ? s.primaryColor : DEFAULTS.primaryColor,
      logoBase64: s.logoBase64 ?? null,
      faviconBase64: s.faviconBase64 ?? null,
    };
  } catch {
    return DEFAULTS;
  }
});

export function isValidHex(color: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(color);
}

export function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

export function buildPrimaryColorCss(hex: string): string {
  if (!isValidHex(hex) || hex === "#f97316") return "";
  const rgb = hexToRgb(hex);
  return `
:root{--app-primary:${hex};--app-primary-rgb:${rgb}}
.bg-orange-500{background-color:var(--app-primary)!important}
.bg-orange-400{background-color:color-mix(in srgb,var(--app-primary),white 20%)!important}
.bg-orange-600{background-color:color-mix(in srgb,var(--app-primary),black 15%)!important}
.bg-orange-700{background-color:color-mix(in srgb,var(--app-primary),black 30%)!important}
.bg-orange-500\\/5{background-color:rgba(${rgb},.05)!important}
.bg-orange-500\\/10{background-color:rgba(${rgb},.1)!important}
.bg-orange-500\\/15{background-color:rgba(${rgb},.15)!important}
.bg-orange-500\\/20{background-color:rgba(${rgb},.2)!important}
.bg-orange-500\\/30{background-color:rgba(${rgb},.3)!important}
.bg-orange-500\\/80{background-color:rgba(${rgb},.8)!important}
.bg-orange-400\\/60{background-color:rgba(${rgb},.6)!important}
.text-orange-500{color:var(--app-primary)!important}
.text-orange-400{color:color-mix(in srgb,var(--app-primary),white 15%)!important}
.text-orange-300{color:color-mix(in srgb,var(--app-primary),white 40%)!important}
.text-orange-100{color:color-mix(in srgb,var(--app-primary),white 75%)!important}
.text-orange-400\\/60{color:rgba(${rgb},.6)!important}
.text-orange-300\\/50{color:rgba(${rgb},.5)!important}
.text-orange-300\\/60{color:rgba(${rgb},.6)!important}
.text-orange-300\\/70{color:rgba(${rgb},.7)!important}
.text-orange-500\\/50{color:rgba(${rgb},.5)!important}
.border-orange-500{border-color:var(--app-primary)!important}
.border-orange-400{border-color:color-mix(in srgb,var(--app-primary),white 20%)!important}
.border-orange-500\\/20{border-color:rgba(${rgb},.2)!important}
.border-orange-500\\/30{border-color:rgba(${rgb},.3)!important}
.border-orange-500\\/50{border-color:rgba(${rgb},.5)!important}
.from-orange-500{--tw-gradient-from:var(--app-primary)!important}
.to-orange-700{--tw-gradient-to:color-mix(in srgb,var(--app-primary),black 30%)!important}
.shadow-orange-900\\/30{--tw-shadow-color:rgba(${rgb},.3)!important}
.focus\\:border-orange-500:focus{border-color:var(--app-primary)!important}
.hover\\:border-orange-500\\/40:hover{border-color:rgba(${rgb},.4)!important}
.hover\\:text-orange-300:hover{color:color-mix(in srgb,var(--app-primary),white 40%)!important}
.hover\\:text-orange-400:hover{color:color-mix(in srgb,var(--app-primary),white 15%)!important}
.ring-orange-500{--tw-ring-color:var(--app-primary)!important}
`.trim();
}
