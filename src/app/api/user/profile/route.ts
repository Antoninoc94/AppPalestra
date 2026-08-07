import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { firstName, lastName, trainingDays } = await req.json();

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      firstName: firstName?.trim() || null,
      lastName: lastName?.trim() || null,
      trainingDays: Array.isArray(trainingDays) ? trainingDays : [],
    },
    select: { firstName: true, lastName: true, trainingDays: true },
  });

  return NextResponse.json(user);
}
