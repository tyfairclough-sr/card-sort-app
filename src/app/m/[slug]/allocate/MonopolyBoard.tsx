"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { FiatDenomination } from "@prisma/client";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FIAT_DENOMINATION_ORDER,
  fiatDenominationBillSrc,
  fiatDenominationLabel,
} from "@/lib/monopoly-denomination";

const BANK_ID = "BANK";

type CardDto = { id: string; label: string; description: string | null };

function initialAllocations(): Record<FiatDenomination, string | null> {
  return {
    [FiatDenomination.ONE_HUNDRED]: null,
    [FiatDenomination.FIFTY]: null,
    [FiatDenomination.TWENTY]: null,
    [FiatDenomination.TEN]: null,
    [FiatDenomination.FIVE]: null,
    [FiatDenomination.ONE]: null,
  };
}

function BillChip({
  denomination,
  disabled,
}: {
  denomination: FiatDenomination;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: denomination,
    disabled,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  const label = fiatDenominationLabel(denomination);
  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      aria-label={`${label} Cosmic Credits bill`}
      className={`inline-flex items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 p-0.5 shadow-sm ring-1 ring-black/5 dark:border-neutral-600 dark:bg-neutral-800 dark:ring-white/10 ${
        isDragging ? "opacity-40" : ""
      } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-grab active:cursor-grabbing"}`}
      {...listeners}
      {...attributes}
    >
      <Image
        src={fiatDenominationBillSrc(denomination)}
        alt=""
        width={180}
        height={80}
        draggable={false}
        className="pointer-events-none h-10 w-auto max-w-[7rem] select-none object-contain sm:h-11 sm:max-w-[8rem]"
      />
    </button>
  );
}

function BankZone({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: BANK_ID });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[4.5rem] rounded-lg border-2 border-dashed p-3 transition-colors ${
        isOver ? "border-amber-500 bg-amber-50 dark:bg-amber-950/40" : "border-neutral-300 dark:border-neutral-600"
      }`}
    >
      <p className="mb-2 text-xs font-medium text-neutral-500">Bills to place (drag onto a card)</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function CardZone({
  cardId,
  title,
  description,
  bills,
  allowCardComments,
  comment,
  onCommentChange,
}: {
  cardId: string;
  title: string;
  description: string | null;
  bills: FiatDenomination[];
  allowCardComments: boolean;
  comment: string;
  onCommentChange: (v: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `c:${cardId}` });
  const showComment = allowCardComments && bills.length > 0;

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-2 rounded-lg border bg-white p-4 shadow-sm dark:bg-neutral-900 ${
        isOver ? "border-emerald-500 ring-2 ring-emerald-500/30" : "border-neutral-200 dark:border-neutral-700"
      }`}
    >
      <div>
        <h3 className="font-medium">{title}</h3>
        {description ? <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{description}</p> : null}
      </div>
      <div className="flex min-h-[2.75rem] flex-wrap gap-2">
        {bills.length === 0 ? (
          <span className="self-center text-xs text-neutral-400">Drop bills here</span>
        ) : (
          bills.map((d) => <BillChip key={d} denomination={d} />)
        )}
      </div>
      {showComment ? (
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-neutral-500">Comment (optional)</span>
          <textarea
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            rows={2}
            className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-600 dark:bg-neutral-950"
          />
        </label>
      ) : null}
    </div>
  );
}

export function MonopolyBoard({
  slug,
  requireAllFiatSpent,
  allowMultipleDenominationsPerCard,
  allowCardComments,
  cards,
}: {
  slug: string;
  requireAllFiatSpent: boolean;
  allowMultipleDenominationsPerCard: boolean;
  allowCardComments: boolean;
  cards: CardDto[];
}) {
  const router = useRouter();
  const [allocation, setAllocation] = useState(initialAllocations);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [activeDenom, setActiveDenom] = useState<FiatDenomination | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const bankBills = useMemo(
    () => FIAT_DENOMINATION_ORDER.filter((d) => allocation[d] === null),
    [allocation],
  );

  const billsOnCard = useMemo(() => {
    const m = new Map<string, FiatDenomination[]>();
    for (const c of cards) m.set(c.id, []);
    for (const d of FIAT_DENOMINATION_ORDER) {
      const cid = allocation[d];
      if (cid) m.get(cid)?.push(d);
    }
    return m;
  }, [allocation, cards]);

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveDenom(null);
    if (!over) return;
    const denom = active.id as FiatDenomination;
    const overId = String(over.id);

    let target: "BANK" | string | null = null;
    if (overId === BANK_ID) target = "BANK";
    else if (overId.startsWith("c:")) target = overId.slice(2);

    if (!target) return;

    setAllocation((prev) => {
      const next = { ...prev };
      if (target === "BANK") {
        next[denom] = null;
        return next;
      }
      if (!allowMultipleDenominationsPerCard) {
        for (const x of FIAT_DENOMINATION_ORDER) {
          if (x !== denom && next[x] === target) {
            next[x] = null;
          }
        }
      }
      next[denom] = target;
      return next;
    });
  }

  async function handleSubmit() {
    setError(null);
    const allocations: { denomination: FiatDenomination; cardId: string }[] = [];
    for (const d of FIAT_DENOMINATION_ORDER) {
      const cid = allocation[d];
      if (cid) allocations.push({ denomination: d, cardId: cid });
    }

    if (requireAllFiatSpent) {
      if (allocations.length !== FIAT_DENOMINATION_ORDER.length) {
        setError("Place all six bills (100, 50, 20, 10, 5, 1) before submitting.");
        return;
      }
    }

    if (!allowMultipleDenominationsPerCard) {
      const seen = new Set<string>();
      for (const a of allocations) {
        if (seen.has(a.cardId)) {
          setError("Only one bill per card is allowed — move a bill or change study settings.");
          return;
        }
        seen.add(a.cardId);
      }
    }

    const commentPayload: Record<string, string> = {};
    if (allowCardComments) {
      for (const c of cards) {
        const bills = billsOnCard.get(c.id) ?? [];
        if (bills.length === 0) continue;
        const t = (comments[c.id] ?? "").trim();
        if (t) commentPayload[c.id] = t;
      }
    }

    setSubmitting(true);
    const res = await fetch(`/api/m/${encodeURIComponent(slug)}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        allocations: allocations.map((a) => ({
          denomination: a.denomination,
          cardId: a.cardId,
        })),
        comments: Object.keys(commentPayload).length ? commentPayload : undefined,
      }),
    });
    setSubmitting(false);
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Submit failed.");
      return;
    }
    router.push(`/m/${slug}/complete`);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={({ active }) => setActiveDenom(active.id as FiatDenomination)}
      onDragCancel={() => setActiveDenom(null)}
      onDragEnd={handleDragEnd}
    >
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <BankZone>
          {bankBills.map((d) => (
            <BillChip key={d} denomination={d} />
          ))}
        </BankZone>

        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((c) => (
            <CardZone
              key={c.id}
              cardId={c.id}
              title={c.label}
              description={c.description}
              bills={billsOnCard.get(c.id) ?? []}
              allowCardComments={allowCardComments}
              comment={comments[c.id] ?? ""}
              onCommentChange={(v) => setComments((prev) => ({ ...prev, [c.id]: v }))}
            />
          ))}
        </div>

        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
        <p className="text-xs text-neutral-500">
          {requireAllFiatSpent
            ? "All six bills must be placed on cards before you can submit."
            : "Submit when you are ready — you can leave bills in the bank if the study allows it."}
        </p>
        <button
          type="button"
          disabled={submitting}
          onClick={() => void handleSubmit()}
          className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60 dark:bg-neutral-100 dark:text-neutral-900"
        >
          {submitting ? "Submitting…" : "Submit"}
        </button>
      </div>

      <DragOverlay>
        {activeDenom ? (
          <span className="inline-flex items-center justify-center rounded-md border border-neutral-200 bg-neutral-50 p-0.5 shadow-lg ring-2 ring-black/10 dark:border-neutral-600 dark:bg-neutral-800 dark:ring-white/20">
            <Image
              src={fiatDenominationBillSrc(activeDenom)}
              alt=""
              width={180}
              height={80}
              draggable={false}
              className="pointer-events-none h-10 w-auto max-w-[7rem] select-none object-contain sm:h-11 sm:max-w-[8rem]"
            />
          </span>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
