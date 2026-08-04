"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Dumbbell, ClipboardList, BarChart2, BookOpen, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/workout", icon: Dumbbell, label: "Allena" },
  { href: "/programs", icon: ClipboardList, label: "Schede" },
  { href: "/exercises", icon: BookOpen, label: "Esercizi" },
  { href: "/progress", icon: BarChart2, label: "Progressi" },
  { href: "/profile", icon: UserCircle, label: "Profilo" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-lg items-center justify-around px-1 py-2 pb-safe">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-[48px] flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs font-medium transition-all",
                isActive
                  ? "text-orange-400"
                  : "text-zinc-500 hover:text-zinc-300"
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
