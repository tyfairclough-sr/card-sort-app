import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownContent } from "@/components/MarkdownContent";
import { prisma } from "@/lib/prisma";
import { StartMonopolySessionButton } from "./StartMonopolySessionButton";

export default async function MonopolyWelcomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const exercise = await prisma.monopolyExercise.findFirst({
    where: { slug, isPublished: true },
  });
  if (!exercise) notFound();

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">{exercise.name}</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Monopoly value test — place each bill on the cards that matter most to you.
      </p>
      <div className="mt-8">
        <MarkdownContent content={exercise.welcomeContent} />
      </div>
      <div className="mt-10 flex flex-wrap gap-4">
        <StartMonopolySessionButton slug={slug} />
        <Link href="/" className="rounded-md border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-600">
          Cancel
        </Link>
      </div>
    </div>
  );
}
