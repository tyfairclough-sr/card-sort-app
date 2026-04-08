import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { MarkdownContent } from "@/components/MarkdownContent";
import { prisma } from "@/lib/prisma";

export default async function MonopolyCompletePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const exercise = await prisma.monopolyExercise.findFirst({
    where: { slug, isPublished: true },
  });
  if (!exercise) notFound();

  const jar = await cookies();
  const sessionId = jar.get(`mv_${exercise.id}`)?.value;
  if (!sessionId) {
    redirect(`/m/${slug}`);
  }

  const session = await prisma.monopolyParticipantSession.findFirst({
    where: { id: sessionId, exerciseId: exercise.id },
  });
  if (!session?.completedAt) {
    redirect(`/m/${slug}/allocate`);
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Thank you</h1>
      <div className="mt-6">
        <MarkdownContent content={exercise.completionContent} />
      </div>
      <p className="mt-8 text-sm text-neutral-500">You can close this window.</p>
      <Link href="/" className="mt-4 inline-block text-sm text-neutral-600 underline dark:text-neutral-400">
        Home
      </Link>
    </div>
  );
}
