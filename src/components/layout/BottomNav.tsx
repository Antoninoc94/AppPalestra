"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, ClipboardList, BarChart2, Library, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/workout", icon: Dumbbell, label: "Allena" },
  { href: "/programs", icon: ClipboardList, label: "Schede" },
  { href: "/exercises", icon: Library, label: "Esercizi" },
  { href: "/progress", icon: BarChart2, label: "Progressi" },
  { href: "/profile", icon: UserCircle, label: "Profilo" },
];

interface BottomNavProps {
  logoBase64?: string | null;
  appName?: string;
}

export function BottomNav({ logoBase64, appName }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-sm">
      {/* Branding strip — visibile solo se è impostato un logo */}
      {logoBase64 && (
        <div className="flex items-center justify-center gap-2 pt-1.5 pb-0">
          <Image
            src={logoBase64}
            alt={appName ?? "Logo"}
            width={20}
            height={20}
            className="rounded-sm object-contain"
            unoptimized
          />
          {appName && appName !== "App Palestra" && (
            <span className="text-[10px] font-semibold text-zinc-400 tracking-wide">{appName}</span>
          )}
        </div>
      )}
      <div className="mx-auto flex max-w-lg items-center justify-around px-1 py-1 pb-safe">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-medium transition-all",
                isActive
                  ? "text-orange-400 bg-orange-500/10"
                  : "text-zinc-500 hover:text-zinc-300 active:bg-zinc-800/50"
              )}
            >
              <Icon
                className={cn("h-5 w-5 transition-all", isActive && "scale-110")}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
