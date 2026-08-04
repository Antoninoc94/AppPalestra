import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session.user;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { action, newPassword } = await req.json();

  if (id === admin.id) {
    return NextResponse.json({ error: "Non puoi modificare il tuo account da qui" }, { status: 400 });
  }

  if (action === "reset") {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    const tempSuffix = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const tempPassword = `gym_${tempSuffix}`;
    const hashed = await bcrypt.hash(tempPassword, 12);
    await prisma.user.update({ where: { id }, data: { password: hashed } });
    return NextResponse.json({ tempPassword });
  }

  if (newPassword) {
    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id }, data: { password: hashed } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Azione non valida" }, { status: 400 });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  if (id === admin.id) {
    return NextResponse.json({ error: "Non puoi eliminare il tuo account" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
