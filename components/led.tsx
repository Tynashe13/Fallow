/**
 * Provenance wrappers. A number may only reach the screen through one of
 * these, so scripts/check-numbers.mjs can prove each one has a ledger row.
 *   <N id>      prints a ledger value
 *   <Led ids>   wraps text quoted from ledger rows
 *   <Calc from> wraps a figure computed from the named rows
 *   <Struct>    wraps a structural number (a count of plates, an event year)
 */
import type { ReactNode } from "react";
import { get, STATUS_LABEL, type Status } from "@/lib/ledger";

export function fmt(id: string, i?: number): string {
  const r = get(id);
  let v: number | string | null;
  if (Array.isArray(r.value)) {
    const item: number | undefined = i === undefined ? undefined : r.value[i];
    if (item === undefined) throw new Error(`Ledger: row "${id}" is a series; index ${String(i)} is not in it`);
    v = item;
  } else {
    v = r.value as number | string | null;
  }
  if (v === null) return "No figure";
  if (typeof v === "number") return v.toFixed(r.dp);
  return String(v);
}

export function N({ id, i, className }: { id: string; i?: number; className?: string }) {
  // data-n marks an exact ledger value; the number check compares the text with the ledger.
  return <span data-led={id} data-n={i ?? ""} className={className}>{fmt(id, i)}</span>;
}

export function Led({ ids, children, className }: { ids: string | string[]; children: ReactNode; className?: string }) {
  const list = Array.isArray(ids) ? ids : [ids];
  list.forEach(get); // build error if a row is missing
  return <span data-led={list.join(" ")} className={className}>{children}</span>;
}

export function Calc({ from, children, className }: { from: string[]; children: ReactNode; className?: string }) {
  from.forEach(get);
  return <span data-calc={from.join(" ")} className={className}>{children}</span>;
}

export function Struct({ why, children, className }: { why: string; children: ReactNode; className?: string }) {
  return <span data-struct={why} className={className}>{children}</span>;
}

export function Tag({ status }: { status: Status }) {
  return <span className={`tag tag-${status}`}>{STATUS_LABEL[status]}</span>;
}

/** Status tag for a ledger row, looked up so it can never drift from the ledger. */
export function RowTag({ id }: { id: string }) {
  return <Tag status={get(id).status} />;
}
