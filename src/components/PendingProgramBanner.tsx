"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookmarkPlus, X } from "lucide-react";

const doneKey = (userId: string) => `apppalestra-done-${userId}`;

interface DoneRecord {
  exercises: Array<{ exerciseId: string; name: string; sets: Array<{ done: boolean }> }>;
  completedSets: number;
  duration: number;
  at: number;
}

export function PendingProgramBanner({ userId }: { userId: string }) {
  const router = useRouter();
  const [record, setRecord] = useState<DoneRecord | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(doneKey(userId));
      if (!raw) return;
      const rec: DoneRecord = JSON.parse(raw);
      if (rec.at && Date.now() - rec.at < 24 * 60 * 60 * 1000 && rec.exercises?.length > 0) {
        setRecord(rec);
      } else {
        localStorage.removeItem(doneKey(userId));
      }
    } catch {}
  }, [userId]);

  function dismiss(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try { localStorage.removeItem(doneKey(userId)); } catch {}
    setRecord(null);
  }

  if (!record) return null;

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-500/10 p-2 shrink-0">
            <BookmarkPlus className="h-4 w-4 text-indigo-400" />
          </div>
          <div>
            <p className="font-semibold text-sm text-indigo-100">Crea scheda dall&apos;ultimo allenamento</p>
            <p className="text-indigo-300/60 text-xs mt-0.5">
              {record.exercises.length} esercizi · {record.completedSets} serie
            </p>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="text-indigo-400/50 hover:text-indigo-300 shrink-0 p-0.5 transition-colors"
          aria-label="Chiudi"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <button
        onClick={() => router.push("/workout?createProgram=1")}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-500 py-2.5 text-sm font-semibold text-white active:opacity-80 transition-opacity"
      >
        <BookmarkPlus className="h-4 w-4" />
        Crea scheda
      </button>
    </div>
  );
}
