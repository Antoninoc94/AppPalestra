"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Lock, LogOut, Shield, Loader2, Eye, EyeOff,
  RotateCcw, AlertTriangle, Trophy, ChevronDown, ChevronUp,
  Dumbbell, Calendar, Flame, Download,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Props {
  username: string;
  role: string;
  totalSessions: number;
  totalSets: number;
  totalDurationSeconds: number;
  memberSince: Date;
  personalRecords: Array<{ name: string; weight: number }>;
}

function formatTotalTime(seconds: number): string {
  if (!seconds || seconds <= 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatMemberSince(date: Date): string {
  return new Date(date).toLocaleDateString("it-IT", { month: "long", year: "numeric" });
}

export function ProfileClient({
  username, role, totalSessions, totalSets,
  totalDurationSeconds, memberSince, personalRecords,
}: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const initials = username?.slice(0, 2).toUpperCase() ?? "??";

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Le nuove password non coincidono" });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "La password deve avere almeno 6 caratteri" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Password aggiornata con successo" });
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
        setShowPasswordForm(false);
      } else {
        setMessage({ type: "error", text: data.error ?? "Errore durante il cambio password" });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    setResetting(true);
    try {
      const res = await fetch("/api/user/reset", { method: "DELETE" });
      if (res.ok) {
        try {
          Object.keys(localStorage)
            .filter((k) => k.startsWith("apppalestra-"))
            .forEach((k) => localStorage.removeItem(k));
        } catch {}
        window.location.href = "/";
      }
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="px-4 py-6 space-y-5 pb-28">

      {/* ── Avatar + info ── */}
      <div className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shrink-0 shadow-lg shadow-orange-900/30">
          <span className="text-white text-xl font-bold">{initials}</span>
        </div>
        <div>
          <p className="font-bold text-lg leading-tight">{username}</p>
          <p className="text-zinc-500 text-sm mt-0.5">
            {role === "ADMIN" ? "👑 Admin" : "Atleta"}
          </p>
          <p className="text-zinc-600 text-xs mt-1">
            Membro da {formatMemberSince(memberSince)}
          </p>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: <Calendar className="h-4 w-4 text-blue-400" />, value: totalSessions, label: "Sessioni" },
          { icon: <Dumbbell className="h-4 w-4 text-purple-400" />, value: totalSets, label: "Serie tot." },
          { icon: <Flame className="h-4 w-4 text-orange-400" />, value: formatTotalTime(totalDurationSeconds), label: "Tempo tot." },
        ].map(({ icon, value, label }) => (
          <div key={label} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3 text-center">
            <div className="flex justify-center mb-1">{icon}</div>
            <p className="text-lg font-bold leading-tight">{value}</p>
            <p className="text-zinc-500 text-[10px] mt-0.5 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Admin link ── */}
      {role === "ADMIN" && (
        <Link href="/admin">
          <div className="flex items-center gap-3 rounded-2xl border border-orange-500/20 bg-orange-500/5 px-4 py-3 hover:bg-orange-500/10 active:bg-orange-500/15 transition-all">
            <Shield className="h-5 w-5 text-orange-400 shrink-0" />
            <div>
              <p className="font-medium text-sm">Pannello Admin</p>
              <p className="text-zinc-500 text-xs">Gestisci utenti e app</p>
            </div>
          </div>
        </Link>
      )}

      {/* ── Personal records ── */}
      {personalRecords.length > 0 && (
        <div className="space-y-2.5">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            <Trophy className="h-3.5 w-3.5 text-yellow-400" />
            Record personali (max peso)
          </h2>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800 overflow-hidden">
            {personalRecords.map(({ name, weight }, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                      i === 0
                        ? "bg-yellow-500/20 text-yellow-400"
                        : i === 1
                        ? "bg-zinc-400/20 text-zinc-300"
                        : i === 2
                        ? "bg-orange-700/20 text-orange-600"
                        : "bg-zinc-800 text-zinc-500"
                    )}
                  >
                    {i + 1}
                  </span>
                  <p className="text-sm font-medium truncate max-w-[180px]">{name}</p>
                </div>
                <p className="text-sm font-bold text-orange-400 shrink-0 ml-2">{weight} kg</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Account settings ── */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <Lock className="h-3.5 w-3.5" />
          Impostazioni account
        </h2>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          <button
            onClick={() => { setShowPasswordForm(!showPasswordForm); setMessage(null); }}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-zinc-800/50 transition-colors"
          >
            <span className="text-sm font-medium">Cambia password</span>
            {showPasswordForm ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
          </button>

          {showPasswordForm && (
            <div className="px-4 pb-4 pt-1 border-t border-zinc-800">
              <form onSubmit={handleChangePassword} className="space-y-3 mt-3">
                {[
                  { label: "Password attuale", value: currentPassword, setter: setCurrentPassword, show: showCurrentPass, toggle: () => setShowCurrentPass(!showCurrentPass) },
                  { label: "Nuova password", value: newPassword, setter: setNewPassword, show: showNewPass, toggle: () => setShowNewPass(!showNewPass) },
                  { label: "Conferma nuova password", value: confirmPassword, setter: setConfirmPassword, show: showConfirmPass, toggle: () => setShowConfirmPass(!showConfirmPass) },
                ].map(({ label, value, setter, show, toggle }) => (
                  <div key={label} className="space-y-1">
                    <label className="text-xs font-medium text-zinc-400">{label}</label>
                    <div className="relative">
                      <input
                        type={show ? "text" : "password"}
                        value={value}
                        onChange={(e) => setter(e.target.value)}
                        className="w-full rounded-xl bg-zinc-800 border border-zinc-700 px-3 py-2.5 pr-10 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        required
                      />
                      <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                ))}

                {message && (
                  <p className={`text-sm ${message.type === "success" ? "text-green-400" : "text-red-400"}`}>
                    {message.text}
                  </p>
                )}

                <Button type="submit" size="sm" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aggiorna password"}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ── Esportazione dati ── */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <Download className="h-3.5 w-3.5" />
          Dati
        </h2>
        <a
          href="/api/sessions/export"
          download
          className="flex items-center gap-2 justify-center rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-medium hover:bg-zinc-800 active:bg-zinc-700 transition-all"
        >
          <Download className="h-4 w-4 text-zinc-400" />
          Esporta allenamenti CSV
        </a>
      </div>

      {/* ── Zona pericolosa ── */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
          Zona pericolosa
        </h2>

        {showResetConfirm ? (
          <div className="rounded-2xl border border-red-900/50 bg-red-950/10 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-red-500/10 p-2 shrink-0 mt-0.5">
                <AlertTriangle className="h-4 w-4 text-red-400" />
              </div>
              <div>
                <p className="font-semibold text-sm">Sei sicuro?</p>
                <p className="text-zinc-400 text-xs mt-1">
                  Verranno eliminati tutti i tuoi allenamenti, schede e sessioni. L&apos;operazione è irreversibile.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="destructive" size="sm" className="flex-1" onClick={handleReset} disabled={resetting}>
                {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sì, resetta tutto"}
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowResetConfirm(false)} disabled={resetting}>
                Annulla
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full flex items-center gap-2 justify-center rounded-2xl border border-red-900/30 bg-zinc-900 px-4 py-3 text-red-400 text-sm font-medium hover:bg-red-900/10 active:bg-red-900/20 transition-all"
          >
            <RotateCcw className="h-4 w-4" />
            Resetta tutti i dati
          </button>
        )}
      </div>

      {/* ── Logout ── */}
      <button
        onClick={async () => { await signOut({ redirect: false }); window.location.href = "/login"; }}
        className="w-full flex items-center gap-2 justify-center rounded-2xl border border-red-900/30 bg-zinc-900 px-4 py-3 text-red-400 text-sm font-medium hover:bg-red-900/10 active:bg-red-900/20 transition-all"
      >
        <LogOut className="h-4 w-4" />
        Esci
      </button>
    </div>
  );
}
