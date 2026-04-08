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
import type { ExerciseType } from "@prisma/client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const POOL_ID = "POOL";

type CardDto = { id: string; label: string; description: string | null };
type PresetDto = { id: string; label: string; description: string | null };

type PoolItem = { uid: string; cardId: string };

type ColumnModel = {
  droppableId: string;
  kind: "preset" | "participant";
  presetId?: string;
  clientKey: string;
  title: string;
  description: string | null;
  items: PoolItem[];
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildColumns(
  exerciseType: ExerciseType,
  presets: PresetDto[],
): ColumnModel[] {
  if (exerciseType === "open") return [];
  return presets.map((p) => ({
    droppableId: `p:${p.id}`,
    kind: "preset" as const,
    presetId: p.id,
    clientKey: "",
    title: p.label,
    description: p.description,
    items: [],
  }));
}

function initialPool(cards: CardDto[], randomize: boolean): PoolItem[] {
  const ordered = randomize ? shuffle(cards) : cards;
  return ordered.map((c) => ({ uid: `pool-${c.id}`, cardId: c.id }));
}

function findItemLocation(
  pool: PoolItem[],
  columns: ColumnModel[],
  uid: string,
): { area: "pool"; index: number } | { area: "column"; colIndex: number; index: number } | null {
  const pi = pool.findIndex((x) => x.uid === uid);
  if (pi !== -1) return { area: "pool", index: pi };
  for (let ci = 0; ci < columns.length; ci++) {
    const ii = columns[ci].items.findIndex((x) => x.uid === uid);
    if (ii !== -1) return { area: "column", colIndex: ci, index: ii };
  }
  return null;
}

export function SortBoard({
  slug,
  exerciseType,
  randomizeCards,
  requireAllSorted,
  allowDuplicatePlacements,
  allowCardComments,
  cards,
  presets,
}: {
  slug: string;
  exerciseType: ExerciseType;
  randomizeCards: boolean;
  requireAllSorted: boolean;
  allowDuplicatePlacements: boolean;
  allowCardComments: boolean;
  cards: CardDto[];
  presets: PresetDto[];
}) {
  const router = useRouter();
  const cardsById = useMemo(() => new Map(cards.map((c) => [c.id, c] as const)), [cards]);

  const [pool, setPool] = useState<PoolItem[]>(() => initialPool(cards, randomizeCards));
  const [columns, setColumns] = useState<ColumnModel[]>(() => buildColumns(exerciseType, presets));
  const [comments, setComments] = useState<Record<string, string>>({});
  const [activeUid, setActiveUid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const activeCard = activeUid
    ? (() => {
        const loc = findItemLocation(pool, columns, activeUid);
        if (!loc) return null;
        const item =
          loc.area === "pool" ? pool[loc.index] : columns[loc.colIndex].items[loc.index];
        return cardsById.get(item.cardId) ?? null;
      })()
    : null;

  function addParticipantColumn() {
    const key = crypto.randomUUID();
    setColumns((prev) => [
      ...prev,
      {
        droppableId: `n:${key}`,
        kind: "participant",
        clientKey: key,
        title: "New category",
        description: null,
        items: [],
      },
    ]);
  }

  function updateColumnTitle(droppableId: string, title: string) {
    setColumns((prev) => prev.map((c) => (c.droppableId === droppableId ? { ...c, title } : c)));
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveUid(null);
    if (!over) return;
    const uid = String(active.id);
    const overId = String(over.id);
    const loc = findItemLocation(pool, columns, uid);
    if (!loc) return;

    const item =
      loc.area === "pool" ? pool[loc.index] : columns[loc.colIndex].items[loc.index];

    let targetDroppable: string | null = null;
    if (overId === POOL_ID) targetDroppable = POOL_ID;
    else if (columns.some((c) => c.droppableId === overId)) targetDroppable = overId;
    else {
      const col = columns.find((c) => c.items.some((i) => i.uid === overId));
      if (col) targetDroppable = col.droppableId;
    }
    if (!targetDroppable) return;

    if (targetDroppable === POOL_ID) {
      if (allowDuplicatePlacements) return;
      if (loc.area === "pool") return;
      setColumns((cols) =>
        cols.map((c, i) =>
          i === loc.colIndex
            ? { ...c, items: c.items.filter((x) => x.uid !== uid) }
            : c,
        ),
      );
      setPool((p) => [...p, { uid, cardId: item.cardId }]);
      return;
    }

    const targetColIndex = columns.findIndex((c) => c.droppableId === targetDroppable);
    if (targetColIndex === -1) return;

    if (loc.area === "pool") {
      if (allowDuplicatePlacements) {
        const copyUid = crypto.randomUUID();
        setColumns((cols) =>
          cols.map((c, i) =>
            i === targetColIndex ? { ...c, items: [...c.items, { uid: copyUid, cardId: item.cardId }] } : c,
          ),
        );
        return;
      }
      setPool((p) => p.filter((x) => x.uid !== uid));
      setColumns((cols) =>
        cols.map((c, i) =>
          i === targetColIndex ? { ...c, items: [...c.items, { uid, cardId: item.cardId }] } : c,
        ),
      );
      return;
    }

    if (loc.area === "column") {
      if (loc.colIndex === targetColIndex) return;
      if (!allowDuplicatePlacements) {
        setColumns((cols) =>
          cols.map((c, i) => {
            if (i === loc.colIndex) return { ...c, items: c.items.filter((x) => x.uid !== uid) };
            if (i === targetColIndex) return { ...c, items: [...c.items, { uid, cardId: item.cardId }] };
            return c;
          }),
        );
        return;
      }
      setColumns((cols) =>
        cols.map((c, i) => {
          if (i === loc.colIndex) return { ...c, items: c.items.filter((x) => x.uid !== uid) };
          if (i === targetColIndex) return { ...c, items: [...c.items, { uid, cardId: item.cardId }] };
          return c;
        }),
      );
    }
  }

  async function handleSubmit() {
    setError(null);
    const placements: {
      cardId: string;
      presetId?: string | null;
      participantCategoryKey?: string | null;
      comment?: string | null;
    }[] = [];

    if (exerciseType === "open" && columns.length === 0) {
      setError("Add at least one category before submitting.");
      return;
    }

    for (const col of columns) {
      for (const it of col.items) {
        placements.push({
          cardId: it.cardId,
          presetId: col.kind === "preset" ? col.presetId ?? null : null,
          participantCategoryKey: col.kind === "participant" ? col.clientKey : null,
          comment: allowCardComments ? (comments[it.uid]?.trim() || null) : null,
        });
      }
    }

    const cardIds = new Set(cards.map((c) => c.id));
    if (requireAllSorted) {
      for (const id of cardIds) {
        if (!placements.some((p) => p.cardId === id)) {
          setError("Please sort every card before submitting.");
          return;
        }
      }
      if (!allowDuplicatePlacements) {
        const seen = new Set<string>();
        for (const p of placements) {
          if (seen.has(p.cardId)) {
            setError("Remove duplicate placements or enable duplicates in study settings.");
            return;
          }
          seen.add(p.cardId);
        }
      }
    }

    const participantCategories = columns
      .filter((c) => c.kind === "participant")
      .map((c, i) => ({
        clientKey: c.clientKey,
        label: c.title.trim() || "Untitled",
        description: c.description,
        sortOrder: i,
      }));

    setSubmitting(true);
    const res = await fetch(`/api/s/${encodeURIComponent(slug)}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantCategories, placements }),
    });
    setSubmitting(false);
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Submit failed.");
      return;
    }
    router.push(`/s/${slug}/complete`);
  }

  const canAddColumn = exerciseType === "open" || exerciseType === "hybrid";

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={({ active }) => setActiveUid(String(active.id))}
      onDragCancel={() => setActiveUid(null)}
      onDragEnd={handleDragEnd}
    >
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-6 md:flex-row md:items-stretch md:gap-4">
          <section className="w-full md:w-72 md:shrink-0">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">Cards</h2>
            <PoolDroppable>
              {pool.length === 0 ? (
                <p className="text-sm text-neutral-500">
                  {allowDuplicatePlacements
                    ? "All card types are listed here; drag copies into categories."
                    : "All cards are sorted — you can drag back here to re-sort."}
                </p>
              ) : null}
              {pool.map((it) => (
                <DraggableChip
                  key={it.uid}
                  uid={it.uid}
                  layout="column"
                  label={cardsById.get(it.cardId)?.label ?? ""}
                  description={cardsById.get(it.cardId)?.description ?? null}
                />
              ))}
            </PoolDroppable>
          </section>

          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Categories</h2>
              {canAddColumn ? (
                <button
                  type="button"
                  onClick={addParticipantColumn}
                  className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-900"
                >
                  Add category
                </button>
              ) : null}
            </div>

            <div className="flex flex-nowrap gap-4 overflow-x-auto pb-4">
              {columns.map((col) => (
                <ColumnPanel
                  key={col.droppableId}
                  col={col}
                  cardsById={cardsById}
                  allowCardComments={allowCardComments}
                  comments={comments}
                  setComments={setComments}
                  onTitleChange={(t) => updateColumnTitle(col.droppableId, t)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-neutral-200 pt-6 dark:border-neutral-800">
          <p className="mr-auto text-xs text-neutral-500">
            {requireAllSorted ? "All cards must be placed in a category." : "You can submit with cards left in the pool."}
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
      </div>
      <DragOverlay>
        {activeCard ? (
          <div className="max-w-xs rounded-lg border border-neutral-200 bg-white p-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
            <p className="font-medium">{activeCard.label}</p>
            {activeCard.description ? (
              <p className="mt-1 text-xs text-neutral-500">{activeCard.description}</p>
            ) : null}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function PoolDroppable({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: POOL_ID });
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[120px] max-h-[min(70vh,calc(100vh-14rem))] flex-col gap-2 overflow-y-auto rounded-xl border border-dashed border-neutral-300 bg-white p-3 dark:border-neutral-600 dark:bg-neutral-900 ${
        isOver ? "ring-2 ring-neutral-400 ring-offset-2" : ""
      }`}
    >
      {children}
    </div>
  );
}

function DraggableChip({
  uid,
  label,
  description,
  layout = "default",
}: {
  uid: string;
  label: string;
  description: string | null;
  layout?: "default" | "column";
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: uid });
  const style = transform
    ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)` }
    : undefined;
  const widthClass = layout === "column" ? "w-full max-w-none" : "max-w-[220px]";
  return (
    <button
      type="button"
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`${widthClass} cursor-grab rounded-lg border border-neutral-200 bg-white px-3 py-2 text-left text-sm shadow-sm active:cursor-grabbing dark:border-neutral-700 dark:bg-neutral-900 ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <span className="font-medium">{label}</span>
      {description ? <p className="mt-0.5 text-xs text-neutral-500">{description}</p> : null}
    </button>
  );
}

function ColumnPanel({
  col,
  cardsById,
  allowCardComments,
  comments,
  setComments,
  onTitleChange,
}: {
  col: ColumnModel;
  cardsById: Map<string, CardDto>;
  allowCardComments: boolean;
  comments: Record<string, string>;
  setComments: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onTitleChange: (title: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.droppableId });
  return (
    <div className="w-72 shrink-0 rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="border-b border-neutral-100 p-3 dark:border-neutral-800">
        {col.kind === "participant" ? (
          <input
            value={col.title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="w-full rounded border border-neutral-200 bg-white px-2 py-1 text-sm font-semibold dark:border-neutral-700 dark:bg-neutral-950"
            aria-label="Category name"
          />
        ) : (
          <div>
            <p className="text-sm font-semibold">{col.title}</p>
            {col.description ? <p className="mt-1 text-xs text-neutral-500">{col.description}</p> : null}
          </div>
        )}
      </div>
      <div
        ref={setNodeRef}
        className={`min-h-[200px] space-y-2 p-3 ${isOver ? "bg-neutral-50 dark:bg-neutral-800/50" : ""}`}
      >
        {col.items.length === 0 ? (
          <p className="text-xs text-neutral-400">Drop cards here</p>
        ) : null}
        {col.items.map((it) => {
          const card = cardsById.get(it.cardId);
          return (
            <div key={it.uid} className="space-y-1">
              <DraggableChip uid={it.uid} label={card?.label ?? ""} description={card?.description ?? null} />
              {allowCardComments ? (
                <textarea
                  value={comments[it.uid] ?? ""}
                  onChange={(e) =>
                    setComments((prev) => ({
                      ...prev,
                      [it.uid]: e.target.value,
                    }))
                  }
                  placeholder="Optional comment"
                  rows={2}
                  className="w-full rounded border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-950"
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
