import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownContent } from "@/components/MarkdownContent";
import { prisma } from "@/lib/prisma";
import { StartSessionButton } from "./StartSessionButton";

export default async function ParticipantWelcomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const exercise = await prisma.exercise.findFirst({
    where: { slug, isPublished: true },
  });
  if (!exercise) notFound();

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">{exercise.name}</h1>
      <p className="mt-2 text-sm text-neutral-500">
        {exercise.type === "closed" && "Closed card sort — categories are provided for you."}
        {exercise.type === "open" && "Open card sort — you will create your own categories."}
        {exercise.type === "hybrid" && "Hybrid card sort — some categories are provided; you can add more."}
      </p>
      <div className="mt-8">
        <MarkdownContent content={exercise.welcomeContent} />
      </div>
      <div className="mt-10 flex flex-wrap gap-4">
        <StartSessionButton slug={slug} />
        <Link href="/" className="rounded-md border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-600">
          Cancel
        </Link>
      </div>
    </div>
  );
}
