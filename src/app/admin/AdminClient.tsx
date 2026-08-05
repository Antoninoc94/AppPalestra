"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, UserPlus, Trash2, RotateCcw, Users, Loader2, Eye, EyeOff,
  Upload, Download, CheckCircle2, Copy, Check
} from "lucide-react";
import Link from "next/link";
import { formatShortDate } from "@/lib/utils";

type User = {
  id: string;
  username: string;
  role: string;
  createdAt: Date | string;
  _count: { programs: number; sessions: number };
};

export function AdminClient({ users: initial, currentUserId }: { users: User[]; currentUserId: string }) {
  const router = useRouter();
  const [users, setUsers] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"USER" | "ADMIN">("USER");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [resetInfo, setResetInfo] = useState<{ userId: string; tempPassword: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ updated: number; notFound: number; total: number } | null>(null);
  const [importError, setImportError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading("create");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername, password: newPassword, role: newRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers((u) => [...u, { ...data, _count: { programs: 0, sessions: 0 } }]);
        setNewUsername("");
        setNewPassword("");
        setNewRole("USER");
        setShowForm(false);
      } else {
        setError(data.error ?? "Errore nella creazione utente");
      }
    } finally {
      setLoading(null);
    }
  }

  async function deleteUser(userId: string) {
    setLoading(`delete-${userId}`);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        setUsers((u) => u.filter((x) => x.id !== userId));
        setDeleteConfirm(null);
      }
    } finally {
      setLoading(null);
    }
  }

  async function resetPassword(userId: string) {
    setLoading(`reset-${userId}`);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      const data = await res.json();
      if (res.ok) {
        setResetInfo({ userId, tempPassword: data.tempPassword });
      }
    } finally {
      setLoading(null);
    }
  }

  function copyPassword(password: string) {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function importCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    setImportError("");
    try {
      const text = await file.text();
      const res = await fetch("/api/exercises/import", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: text,
      });
      const data = await res.json();
      if (res.ok) setImportResult(data);
      else setImportError(data.error ?? "Errore importazione");
    } catch {
      setImportError("Errore di rete");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }

  return (
    <div className="px-4 py-6 space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <Link href="/profile">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold flex-1">Pannello Admin</h1>
        <Button size="sm" className="gap-2" onClick={() => setShowForm(!showForm)}>
          <UserPlus className="h-4 w-4" />
          Nuovo
        </Button>
      </div>

      {/* Sezione esercizi */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="font-semibold text-sm">Gestione esercizi</p>
          <div className="flex gap-2">
            <a href="/api/exercises/export" download>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Esporta CSV
              </Button>
            </a>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={importing}
              onClick={() => fileInputRef.current?.click()}
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {importing ? "Importando..." : "Importa CSV"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={importCsv}
              disabled={importing}
            />
          </div>
          <p className="text-[11px] text-zinc-500">
            Il CSV deve avere le colonne: <span className="font-mono text-zinc-400">Nome inglese</span> (obbligatoria),{" "}
            <span className="font-mono text-zinc-400">Nome italiano</span>,{" "}
            <span className="font-mono text-zinc-400">Descrizione</span>.
          </p>
          {importResult && (
            <div className="flex items-start gap-2 rounded-lg bg-green-500/10 border border-green-500/20 p-3">
              <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
              <p className="text-sm text-green-300">
                Importazione completata: <strong>{importResult.updated}</strong> aggiornati,{" "}
                {importResult.notFound} non trovati su {importResult.total} righe.
              </p>
            </div>
          )}
          {importError && <p className="text-sm text-red-400">{importError}</p>}
        </CardContent>
      </Card>

      {/* Create user form */}
      {showForm && (
        <Card className="border-orange-500/20">
          <CardContent className="p-4">
            <form onSubmit={createUser} className="space-y-3">
              <p className="font-medium text-sm">Crea nuovo utente</p>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400">Username</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400">Password iniziale</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 pr-10 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400">Ruolo</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as "USER" | "ADMIN")}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="USER">Utente</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" size="sm" className="flex-1" disabled={loading === "create"}>
                  {loading === "create" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crea utente"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
                  Annulla
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Reset notification */}
      {resetInfo && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-4 space-y-2">
            <p className="text-sm font-medium text-green-400">Password reimpostata</p>
            <p className="text-xs text-zinc-400">
              Comunica questa password temporanea all&apos;utente — non verrà mostrata di nuovo.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-lg bg-zinc-800 px-3 py-2 font-mono text-sm text-white">
                {resetInfo.tempPassword}
              </div>
              <Button
                size="icon"
                variant="outline"
                className="h-9 w-9 shrink-0"
                onClick={() => copyPassword(resetInfo.tempPassword)}
                title="Copia password"
              >
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button size="sm" variant="outline" onClick={() => setResetInfo(null)} className="w-full">
              Ho salvato la password
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Users list */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-400 flex items-center gap-2">
          <Users className="h-4 w-4" />
          {users.length} utenti registrati
        </h2>
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{user.username}</p>
                    {user.id === currentUserId && (
                      <Badge variant="outline" className="text-xs">tu</Badge>
                    )}
                    <Badge variant={user.role === "ADMIN" ? "default" : "secondary"} className="text-xs">
                      {user.role === "ADMIN" ? "Admin" : "Utente"}
                    </Badge>
                  </div>
                  <p className="text-zinc-500 text-xs mt-1">
                    Iscritto il {formatShortDate(user.createdAt)} ·{" "}
                    {user._count.programs} schede · {user._count.sessions} sessioni
                  </p>
                </div>

                {user.id !== currentUserId && (
                  <div className="flex gap-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-zinc-400 hover:text-orange-400"
                      onClick={() => resetPassword(user.id)}
                      disabled={loading !== null}
                      title="Reimposta password"
                    >
                      {loading === `reset-${user.id}`
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <RotateCcw className="h-4 w-4" />}
                    </Button>
                    {deleteConfirm === user.id ? (
                      <div className="flex gap-1">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteUser(user.id)}
                          disabled={loading !== null}
                          className="h-8 text-xs"
                        >
                          {loading === `delete-${user.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Elimina"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm(null)}
                          className="h-8 text-xs"
                        >
                          No
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-400 hover:text-red-400"
                        onClick={() => setDeleteConfirm(user.id)}
                        title="Elimina utente"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
