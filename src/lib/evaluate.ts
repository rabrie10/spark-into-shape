export type Status = "met" | "not_met" | "conditional" | "unknown";
export type Verdict = "likely" | "check" | "conditional" | "notfit";
export type Profile = Record<string, string>;
export type RuleStep = { if?: Record<string, string | string[]>; out: [Status, string] };
export type Requirement = {
  text: string;
  evidence_excerpt: string;
  source_url?: string;
  source_label?: string;
  rule: RuleStep[];
};
export type Deadline =
  | { kind: "fixed"; iso: string; inferred: boolean; text: string }
  | { kind: "recurring"; rules: [number, number][]; text: string }
  | { kind: "closed"; text: string };
export type Grant = {
  slug: string;
  title: string;
  funder: string;
  source_url: string;
  source_type: "official" | "aggregator";
  aim: string;
  amount_text: string;
  documents_text: string;
  deadline: Deadline;
  retrieved_on: string;
  requirements: Requirement[];
};
export type Result = { status: Status; reason: string };

export function evaluateRequirement(profile: Profile, rule: RuleStep[]): Result {
  for (const step of rule) {
    if (!step.if) return { status: step.out[0], reason: step.out[1] };
    const ok = Object.entries(step.if).every(([k, v]) => {
      const val = profile[k];
      if (val === undefined || val === "") return false;
      return Array.isArray(v) ? v.includes(val) : v === val;
    });
    if (ok) return { status: step.out[0], reason: step.out[1] };
  }
  return { status: "unknown", reason: "Your profile does not answer this yet." };
}

export function verdictOf(results: Result[]): Verdict {
  if (results.some((r) => r.status === "not_met")) return "notfit";
  if (results.some((r) => r.status === "conditional")) return "conditional";
  if (results.some((r) => r.status === "unknown")) return "check";
  return "likely";
}

export function evaluateGrant(profile: Profile, requirements: Requirement[]) {
  const results = requirements.map((r) => evaluateRequirement(profile, r.rule));
  return { results, verdict: verdictOf(results) };
}

export type DeadlineState = { state: "open" | "closed" | "expected"; label: string; date?: Date };

const fmt = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function utcDay(d: Date) {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function deadlineState(deadline: Deadline, today: Date): DeadlineState {
  const t = utcDay(today);
  if (deadline.kind === "closed") return { state: "closed", label: "Closed for 2026" };
  if (deadline.kind === "fixed") {
    const d = new Date(deadline.iso + "T00:00:00Z");
    if (d.getTime() < t)
      return { state: "closed", label: deadline.inferred ? "Appears closed" : "Closed", date: d };
    const days = Math.round((d.getTime() - t) / 86400000);
    return { state: "open", label: `Open, ${days} days left`, date: d };
  }
  const y = today.getUTCFullYear();
  const candidates = [y, y + 1]
    .flatMap((yr) => deadline.rules.map(([m, day]) => new Date(Date.UTC(yr, m - 1, day))))
    .filter((d) => d.getTime() > t)
    .sort((a, b) => a.getTime() - b.getTime());
  const next = candidates[0];
  return { state: "expected", label: `Next round expected ${fmt(next)}`, date: next };
}

export const verdictOrder: Verdict[] = ["likely", "check", "conditional", "notfit"];

export function groupOf(verdict: Verdict, ds: DeadlineState) {
  if (verdict === "notfit") return "notfit" as const;
  return ds.state === "open" ? ("open" as const) : ("watch" as const);
}

export function formatDate(iso: string) {
  return fmt(new Date(iso.length === 10 ? iso + "T00:00:00Z" : iso));
}
