"use client";

import Image from "next/image";

interface TopHeaderProps {
  logoBase64?: string | null;
  appName?: string;
}

export function TopHeader({ logoBase64, appName }: TopHeaderProps) {
  const name = appName || "Gym App";
  const logoSrc = logoBase64 ?? "/logo.svg";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/60 bg-zinc-950/95 backdrop-blur-sm pt-safe-top">
      <div className="mx-auto flex max-w-lg items-center px-4 h-12">
        <Image
          src={logoSrc}
          alt={name}
          width={320}
          height={48}
          className="h-9 w-auto object-contain"
          unoptimized
        />
      </div>
    </header>
  );
}
