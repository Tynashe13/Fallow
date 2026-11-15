/** The fact ledger contract. Every number the UI shows is a row here, or is
 *  computed in derive.ts from rows named in its `from` list. */

export type Status = "checked" | "unverified" | "assumed" | "ours";
export type SiteId = "overberg" | "swartland";
export type Scope = SiteId | "both" | "global";

export type Group =
  | "site" | "rain" | "air" | "wetness" | "soil" | "topsoil" | "terrain"
  | "outlines" | "sun" | "rule" | "r1" | "r3" | "trial" | "scale"
  | "resolution" | "licence" | "app";

export interface LedgerRow {
  id: string;
  label: string;
  scope: Scope;
  group: Group;
  /** A number, a 12-month or 3-column series, a sourced phrase, or null when no figure exists. */
  value: number | readonly number[] | string | null;
  /** Lower and upper bound when the value is a sourced range. */
  range?: readonly [number, number];
  unit: string;
  /** Decimal places used when the value is printed. */
  dp: number;
  source: string;
  url: string | null;
  page: string | null;
  isNasa: boolean;
  resolution: string;
  period: string;
  status: Status;
  confidence: string;
  /** Date the value was retrieved or last checked, ISO. */
  date: string;
  caveat: string;
  /** What a person would do to raise this row's status. */
  remedy: string;
}

export const STATUS_LABEL: Record<Status, string> = {
  checked: "checked",
  unverified: "unverified",
  assumed: "assumed, no source found",
  ours: "our threshold, not from a source",
};

export const STATUS_MEANING: Record<Status, string> = {
  checked: "A source was opened and read, or the value was re-fetched from the source and matched.",
  unverified: "A source is named, but we have not opened it or not confirmed it for this site.",
  assumed: "No source found. Not used in any score.",
  ours: "A cut-off we chose. It is a parameter, not a finding.",
};
