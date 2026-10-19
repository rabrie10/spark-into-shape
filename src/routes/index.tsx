import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { EXAMPLES, FIELDS } from "@/lib/profile";
import { deadlineState, evaluateGrant, groupOf, verdictOrder, type Profile } from "@/lib/evaluate";
import { Card, DeadlineChip, EmptyState, ThirdPartyChip, VerdictChip, btnGhost } from "@/components/grant-ui";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Your funding shortlist · Grantastic" },
      { name: "description", content: "Describe your nonprofit once and see which funding sources fit, with evidence for every check." },
      { property: "og:title", content: "Your funding shortlist · Grantastic" },
      { property: "og:description", content: "See which funding sources fit your nonprofit, and why." },
    ],
  }),
  component: Workspace,
});

function ProfilePanel() {
  const { profile, setProfile, reset } = useStore();
  const [draft, setDraft] = useState<Profile>(profile);
  const [saved, setSaved] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => setDraft(profile), [profile]);

  const commit = (next: Profile, prev: Profile) => {
    setDraft(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const changed = Object.keys(next).filter((k) => next[k] !== prev[k]);
      setProfile(next, changed);
      setSaved("Saved");
      setTimeout(() => setSaved(""), 1800);
    }, 500);
  };

  return (
    <Card className="p-5">
      <h2 className="text-lg">Your organisation</h2>
      <p className="mt-1 text-sm text-muted">Try an example</p>
      <div className="mt-2 flex flex-col gap-2">
        {EXAMPLES.map((e) => (
          <button key={e.label} className={`${btnGhost} justify-start text-left text-sm`} onClick={() => commit({ ...e.facts }, draft)}>
            {e.label}
          </button>
        ))}
      </div>
      <form className="mt-5 flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Organisation name
          <input
            className="min-h-11 rounded-lg border border-line bg-surface px-3 text-base font-normal"
            value={draft.name ?? ""}
            onChange={(e) => commit({ ...draft, name: e.target.value }, draft)}
          />
        </label>
        {FIELDS.map((f) => (
          <label key={f.key} className="flex flex-col gap-1 text-sm font-medium">
            {f.label}
            <select
              className="min-h-11 rounded-lg border border-line bg-surface px-3 text-base font-normal"
              value={draft[f.key] ?? ""}
              onChange={(e) => commit({ ...draft, [f.key]: e.target.value }, draft)}
            >
              <option value="">Not answered</option>
              {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        ))}
      </form>
      <div className="mt-4 flex items-center justify-between">
        <p role="status" aria-live="polite" className="text-sm font-medium text-teal">{saved}</p>
        <button className="text-sm text-muted underline" onClick={reset}>Reset demo</button>
      </div>
    </Card>
  );
}

function Workspace() {
  const { grants, profile, applications, audit } = useStore();
  const today = new Date();
  const rows = useMemo(
    () =>
      grants.map((g) => {
        const ev = evaluateGrant(profile, g.requirements);
        const ds = deadlineState(g.deadline, today);
        return { g, ...ev, ds, group: groupOf(ev.verdict, ds) };
      }).sort((a, b) => verdictOrder.indexOf(a.verdict) - verdictOrder.indexOf(b.verdict)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [grants, profile],
  );
  const groups = [
    { id: "open", title: "Open now" },
    { id: "watch", title: "Watch for the next round" },
    { id: "notfit", title: "Not a fit" },
  ] as const;
  const count = (id: string) => rows.filter((r) => r.group === id).length;

  return (
    <div className="grid gap-6 min-[900px]:grid-cols-[320px_1fr]">
      <aside><ProfilePanel /></aside>
      <section aria-labelledby="sl">
        <h1 id="sl" className="text-2xl">Your shortlist</h1>
        <p role="status" aria-live="polite" className="mt-1 text-muted">
          {rows.length} sources checked. {count("open")} open now, {count("watch")} to watch, {count("notfit")} not a fit.
        </p>
        {groups.map((gr) => {
          const items = rows.filter((r) => r.group === gr.id);
          return (
            <div key={gr.id} className="mt-6">
              <h2 className="mb-3 text-lg">{gr.title} <span className="font-sans text-base font-normal text-muted">({items.length})</span></h2>
              {items.length === 0 && gr.id === "open" && (
                <EmptyState>None of the sources in this set has a confirmed open round today.</EmptyState>
              )}
              {items.length === 0 && gr.id !== "open" && <p className="text-muted">Nothing here for your current profile.</p>}
              <ul className="flex flex-col gap-3">
                {items.map(({ g, results, verdict, ds }) => {
                  const n = (s: string) => results.filter((r) => r.status === s).length;
                  const blocking = results.find((r) => r.status === "not_met");
                  const app = applications[g.slug];
                  return (
                    <li key={g.slug}>
                      <Link to="/grants/$slug" params={{ slug: g.slug }} className="block rounded-[14px] border border-line bg-surface p-4 hover:border-navy">
                        <h3 className="text-base">{g.title}</h3>
                        <p className="text-sm text-muted">{g.funder}</p>
                        <p className="mt-2 text-sm">
                          {blocking ? blocking.reason : `${n("met")} met, ${n("unknown")} to check, ${n("conditional")} conditions.`}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <VerdictChip verdict={verdict} />
                          <DeadlineChip ds={ds} />
                          {g.source_type === "aggregator" && <ThirdPartyChip />}
                          {app?.status === "verified" && <span className="rounded-full bg-sky px-2.5 py-0.5 text-sm">Verified by you</span>}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
        <details className="mt-8 rounded-[14px] border border-line bg-surface p-4">
          <summary className="font-semibold">Activity log ({audit.length})</summary>
          {audit.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No activity yet. Changes to your profile and verifications appear here.</p>
          ) : (
            <ul className="mt-2 text-sm">
              {audit.slice(0, 30).map((a, i) => (
                <li key={i} className="border-t border-line py-1.5">
                  <span className="text-muted">{new Date(a.at).toLocaleString("en-GB")}</span> · <strong>{a.type}</strong> · {a.detail}
                </li>
              ))}
            </ul>
          )}
        </details>
      </section>
    </div>
  );
}
