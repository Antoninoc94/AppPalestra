export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAppSettings } from "@/lib/app-settings";
import { AdminClient } from "./AdminClient";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const [users, settings] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        _count: { select: { programs: true, sessions: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    getAppSettings(),
  ]);

  return <AdminClient users={users} currentUserId={session.user.id} initialSettings={settings} />;
}
