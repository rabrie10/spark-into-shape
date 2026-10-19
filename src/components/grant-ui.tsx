import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { formatDate, type DeadlineState, type Requirement, type Result, type Status, type Verdict } from "@/lib/evaluate";

const STATUS: Record<Status, { label: string; sym: string; cls: string }> = {
  met: { label: "Met", sym: "✓", cls: "bg-met-bg text-met-fg" },
  not_met: { label: "Not met", sym: "✕", cls: "bg-notmet-bg text-notmet-fg" },
  conditional: { label: "Condition", sym: "◐", cls: "bg-cond-bg text-cond-fg" },
  unknown: { label: "Check", sym: "?", cls: "bg-unk-bg text-unk-fg" },
};
const VERDICT: Record<Verdict, { label: string; status: Status }> = {
  likely: { label: "Looks eligible", status: "met" },
  check: { label: "Needs checks", status: "unknown" },
  conditional: { label: "Possible with conditions", status: "conditional" },
  notfit: { label: "Not a fit", status: "not_met" },
};
export const verdictLabel = (v: Verdict) => VERDICT[v].label;

export function Wordmark() {
  return (
    <span className="font-display text-2xl font-extrabold text-navy">
      grantastic<span className="text-amber">.</span>
    </span>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex min-w-[6.5rem] items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold ${s.cls}`}>
      <span aria-hidden="true">{s.sym}</span>
      {s.label}
    </span>
  );
}

function Pill({ cls, children }: { cls: string; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-medium ${cls}`}>{children}</span>;
}

export function VerdictChip({ verdict }: { verdict: Verdict }) {
  const v = VERDICT[verdict];
  const s = STATUS[v.status];
  return (
    <Pill cls={s.cls}>
      <span aria-hidden="true">{s.sym}</span>
      {v.label}
    </Pill>
  );
}

export function DeadlineChip({ ds }: { ds: DeadlineState }) {
  const cls =
    ds.state === "open" ? "bg-met-bg text-met-fg" : ds.state === "closed" ? "bg-notmet-bg text-notmet-fg" : "bg-sky text-text";
  const sym = ds.state === "open" ? "●" : ds.state === "closed" ? "■" : "○";
  return (
    <Pill cls={cls}>
      <span aria-hidden="true">{sym}</span>
      {ds.label}
    </Pill>
  );
}

export function ThirdPartyChip() {
  return <Pill cls="border border-amber bg-surface text-text">Third-party source</Pill>;
}

export function EvidenceRow({ req, result, fallbackUrl, retrieved }: { req: Requirement; result: Result; fallbackUrl: string; retrieved: string }) {
  return (
    <li className="grid gap-3 border-t border-line py-4 first:border-t-0 sm:grid-cols-[7.5rem_1fr]">
      <div><StatusBadge status={result.status} /></div>
      <div className="min-w-0">
        <p className="font-semibold">{req.text}</p>
        <p className="mt-1">{result.reason}</p>
        <div className="mt-2 border-l-2 border-line pl-3 text-sm text-muted">
          <p>
            <span className="font-semibold text-text">What the source says: </span>
            {req.evidence_excerpt}
          </p>
          <p className="mt-1">
            <a className="text-navy underline underline-offset-2" href={req.source_url ?? fallbackUrl} target="_blank" rel="noreferrer">
              {req.source_label ?? "Open the source"}
            </a>{" "}
            · read {formatDate(retrieved)}
          </p>
        </div>
      </div>
    </li>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[14px] border border-dashed border-line bg-surface p-5 text-muted">
      {children}{" "}
      <Link to="/add" className="font-semibold text-navy underline underline-offset-2">Add a funder page</Link>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[14px] border border-line bg-surface ${className}`}>{children}</div>;
}

export const btn =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-navy px-4 py-2 font-semibold text-ivory disabled:cursor-not-allowed disabled:opacity-50";
export const btnGhost =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-surface px-4 py-2 font-semibold text-text";
