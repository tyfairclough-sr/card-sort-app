import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

export async function POST(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ip = clientIp(_request);
  const limited = rateLimit(`m-session:${ip}`);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const exercise = await prisma.monopolyExercise.findFirst({
    where: { slug, isPublished: true },
  });
  if (!exercise) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await prisma.monopolyParticipantSession.create({
    data: { exerciseId: exercise.id },
  });

  const jar = await cookies();
  jar.set(`mv_${exercise.id}`, session.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
    secure: process.env.NODE_ENV === "production",
  });

  return NextResponse.json({ ok: true, sessionId: session.id });
}
