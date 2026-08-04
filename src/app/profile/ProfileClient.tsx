"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Lock, LogOut, Shield, Loader2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export function ProfileClient({ username, role }: { username: string; role: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

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
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage({ type: "error", text: data.error ?? "Errore durante il cambio password" });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 py-6 space-y-6 pb-24">
      <h1 className="text-xl font-bold">Profilo</h1>

      {/* User info */}
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="rounded-full bg-orange-500/10 p-3">
            <User className="h-6 w-6 text-orange-400" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">{username}</p>
            <Badge variant={role === "ADMIN" ? "default" : "secondary"} className="mt-1 text-xs">
              {role === "ADMIN" ? "Admin" : "Utente"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Admin panel link */}
      {role === "ADMIN" && (
        <Link href="/admin">
          <Card className="border-orange-500/20 active:bg-zinc-800 transition-colors">
            <CardContent className="p-4 flex items-center gap-3">
              <Shield className="h-5 w-5 text-orange-400" />
              <div>
                <p className="font-medium">Pannello Admin</p>
                <p className="text-zinc-500 text-xs">Gestisci utenti e account</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Change password */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-zinc-300 flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Cambia password
        </h2>
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Password attuale</label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2.5 pr-10 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                  <button type="button" onClick={() => setShowCurrentPass(!showCurrentPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                    {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Nuova password</label>
                <div className="relative">
                  <input
                    type={showNewPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2.5 pr-10 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                  <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                    {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Conferma nuova password</label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2.5 pr-10 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                  <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                    {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {message && (
                <p className={`text-sm ${message.type === "success" ? "text-green-400" : "text-red-400"}`}>
                  {message.text}
                </p>
              )}

              <Button type="submit" size="sm" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aggiorna password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Logout */}
      <Button
        variant="outline"
        className="w-full gap-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 border-red-900/30"
        onClick={async () => { await signOut({ redirect: false }); window.location.href = "/login"; }}
      >
        <LogOut className="h-4 w-4" />
        Esci
      </Button>
    </div>
  );
}
