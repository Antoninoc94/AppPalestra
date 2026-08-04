export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, ClipboardList, ChevronRight, Dumbbell } from "lucide-react";
import { getGoalLabel, formatShortDate } from "@/lib/utils";
import Link from "next/link";

export default async function ProgramsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const programs = await prisma.program.findMany({
    where: { userId: session.user.id },
    include: {
      days: {
        include: { _count: { select: { exercises: true } } },
        orderBy: { dayNumber: "asc" },
      },
      _count: { select: { sessions: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Le mie Schede</h1>
        <Link href="/programs/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Nuova
          </Button>
        </Link>
      </div>

      {programs.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <ClipboardList className="h-12 w-12 mx-auto text-zinc-600" />
          <p className="text-zinc-400">Nessuna scheda ancora</p>
          <p className="text-zinc-500 text-sm">Crea la tua prima scheda manualmente o generala automaticamente</p>
          <Link href="/programs/new">
            <Button className="gap-2 mt-2">
              <Plus className="h-4 w-4" />
              Crea prima scheda
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {programs.map((program) => (
            <Link key={program.id} href={`/programs/${program.id}`}>
              <Card className="active:bg-zinc-800 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{program.name}</h3>
                        {program.isActive && <Badge variant="success">Attiva</Badge>}
                      </div>
                      {program.description && (
                        <p className="text-zinc-400 text-sm">{program.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-zinc-500 mt-2">
                        <span className="flex items-center gap-1">
                          <ClipboardList className="h-3 w-3" />
                          {program.days.length} giorni
                        </span>
                        <span className="flex items-center gap-1">
                          <Dumbbell className="h-3 w-3" />
                          {program._count.sessions} sessioni
                        </span>
                        <span>{formatShortDate(program.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{getGoalLabel(program.goal)}</Badge>
                      <ChevronRight className="h-4 w-4 text-zinc-600" />
                    </div>
                  </div>

                  {/* Days preview */}
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {program.days.map((day) => (
                      <div
                        key={day.id}
                        className="rounded-lg bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300"
                      >
                        {day.name}
                        <span className="text-zinc-500 ml-1">({day._count.exercises})</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
