import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { MarkdownContent } from "@/components/MarkdownContent";
import { prisma } from "@/lib/prisma";

export default async function CompletePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const exercise = await prisma.exercise.findFirst({
    where: { slug, isPublished: true },
  });
  if (!exercise) notFound();

  const jar = await cookies();
  const sessionId = jar.get(`cs_${exercise.id}`)?.value;
  if (!sessionId) {
    redirect(`/s/${slug}`);
  }

  const session = await prisma.participantSession.findFirst({
    where: { id: sessionId, exerciseId: exercise.id },
  });
  if (!session?.completedAt) {
    redirect(`/s/${slug}/sort`);
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
