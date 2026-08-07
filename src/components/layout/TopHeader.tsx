"use client";

import Image from "next/image";

interface TopHeaderProps {
  logoBase64?: string | null;
  appName?: string;
}

export function TopHeader({ logoBase64, appName }: TopHeaderProps) {
  const name = appName || "Gym App";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800/60 bg-zinc-950/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-lg items-center gap-2.5 px-4 h-12">
        {logoBase64 ? (
          <Image
            src={logoBase64}
            alt={name}
            width={28}
            height={28}
            className="rounded-md object-contain flex-shrink-0"
            unoptimized
          />
        ) : null}
        <span className="text-sm font-semibold text-zinc-100 tracking-tight truncate">
          {name}
        </span>
      </div>
    </header>
  );
}
