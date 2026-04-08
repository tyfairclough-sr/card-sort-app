import { FiatDenomination } from "@prisma/client";

/** Display order and API payload order (highest first). */
export const FIAT_DENOMINATION_ORDER: FiatDenomination[] = [
  FiatDenomination.ONE_HUNDRED,
  FiatDenomination.FIFTY,
  FiatDenomination.TWENTY,
  FiatDenomination.TEN,
  FiatDenomination.FIVE,
  FiatDenomination.ONE,
];

const LABELS: Record<FiatDenomination, string> = {
  [FiatDenomination.ONE_HUNDRED]: "100",
  [FiatDenomination.FIFTY]: "50",
  [FiatDenomination.TWENTY]: "20",
  [FiatDenomination.TEN]: "10",
  [FiatDenomination.FIVE]: "5",
  [FiatDenomination.ONE]: "1",
};

export function fiatDenominationLabel(d: FiatDenomination): string {
  return LABELS[d];
}

/** Public URL for the bill artwork (under `/public/monopoly-bills/`). */
const BILL_SRC: Record<FiatDenomination, string> = {
  [FiatDenomination.ONE_HUNDRED]: "/monopoly-bills/100.png",
  [FiatDenomination.FIFTY]: "/monopoly-bills/50.png",
  [FiatDenomination.TWENTY]: "/monopoly-bills/20.png",
  [FiatDenomination.TEN]: "/monopoly-bills/10.png",
  [FiatDenomination.FIVE]: "/monopoly-bills/5.png",
  [FiatDenomination.ONE]: "/monopoly-bills/1.png",
};

export function fiatDenominationBillSrc(d: FiatDenomination): string {
  return BILL_SRC[d];
}
