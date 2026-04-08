import { FiatDenomination } from "@prisma/client";
import { z } from "zod";

export const ALL_FIAT_DENOMINATIONS: FiatDenomination[] = [
  FiatDenomination.ONE_HUNDRED,
  FiatDenomination.FIFTY,
  FiatDenomination.TWENTY,
  FiatDenomination.TEN,
  FiatDenomination.FIVE,
  FiatDenomination.ONE,
];

const denominationSchema = z.enum([
  "ONE_HUNDRED",
  "FIFTY",
  "TWENTY",
  "TEN",
  "FIVE",
  "ONE",
]);

const allocationInputSchema = z.object({
  denomination: denominationSchema,
  cardId: z.string().min(1),
});

export const monopolySubmitBodySchema = z.object({
  allocations: z.array(allocationInputSchema),
  comments: z.record(z.string(), z.string()).optional(),
});

export type MonopolySubmitBody = z.infer<typeof monopolySubmitBodySchema>;

const COMMENT_MAX = 2000;

export function validateMonopolySubmit(
  body: MonopolySubmitBody,
  opts: {
    cardIds: Set<string>;
    requireAllFiatSpent: boolean;
    allowMultipleDenominationsPerCard: boolean;
    allowCardComments: boolean;
  },
): { ok: true; allocations: { denomination: FiatDenomination; cardId: string }[]; comments: Map<string, string> } | { ok: false; message: string } {
  const { allocations, comments: commentsRaw } = body;

  const seenDenom = new Set<string>();
  for (const a of allocations) {
    if (seenDenom.has(a.denomination)) {
      return { ok: false, message: "Each denomination can only be used once." };
    }
    seenDenom.add(a.denomination);
    if (!opts.cardIds.has(a.cardId)) {
      return { ok: false, message: "Unknown card." };
    }
  }

  if (opts.requireAllFiatSpent) {
    for (const d of ALL_FIAT_DENOMINATIONS) {
      if (!seenDenom.has(d)) {
        return { ok: false, message: "Place all bills (100, 50, 20, 10, 5, 1) before submitting." };
      }
    }
  }

  if (!opts.allowMultipleDenominationsPerCard) {
    const seenCards = new Set<string>();
    for (const a of allocations) {
      if (seenCards.has(a.cardId)) {
        return { ok: false, message: "Only one bill per card is allowed for this study." };
      }
      seenCards.add(a.cardId);
    }
  }

  const comments = new Map<string, string>();
  if (commentsRaw && Object.keys(commentsRaw).length > 0) {
    if (!opts.allowCardComments) {
      return { ok: false, message: "Comments are disabled for this study." };
    }
    for (const [cardId, text] of Object.entries(commentsRaw)) {
      if (!opts.cardIds.has(cardId)) {
        return { ok: false, message: "Unknown card in comments." };
      }
      const trimmed = text.trim();
      if (trimmed.length > COMMENT_MAX) {
        return { ok: false, message: `Comments must be at most ${COMMENT_MAX} characters.` };
      }
      if (trimmed.length > 0) {
        comments.set(cardId, trimmed);
      }
    }
  }

  const mapped = allocations.map((a) => ({
    denomination: a.denomination as FiatDenomination,
    cardId: a.cardId,
  }));

  return { ok: true, allocations: mapped, comments };
}
