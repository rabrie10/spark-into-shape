import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { draftApplication } from "@/lib/ai.functions";
import { useStore } from "@/lib/store";
import { deadlineState, evaluateGrant, formatDate, type Grant, type Profile } from "@/lib/evaluate";
import { labelFor } from "@/lib/profile";
import { Card, DeadlineChip, EvidenceRow, ThirdPartyChip, VerdictChip, btn, btnGhost } from "@/components/grant-ui";

export const Route = createFileRoute("/grants/$slug")({
  head: () => ({
    meta: [
      { title: "Funding source checks · Grantastic" },
      { name: "description", content: "Eligibility checks with evidence, a preparation checklist and a human verification step." },
      { property: "og:title", content: "Funding source checks · Grantastic" },
      { property: "og:description", content: "Every check shows what the funder’s page says." },
    ],
  }),
  component: Detail,
});

const STATEMENTS = [
  "I opened the funder’s own page and the deadline and conditions are current.",
  "I resolved or accepted every item marked as a condition or a check.",
  "I will submit through the funder’s official channel myself.",
];

function templateDraft(p: Profile, g: Grant) {
  const name = p.name || "[organisation name]";
  return `About us
${name} is a ${p.scope ? labelFor("scope", p.scope).toLowerCase() : "[local or national]"} organisation working in ${p.focus ? labelFor("focus", p.focus).toLowerCase() : "[field of work]"}, based in ${p.location ? labelFor("location", p.location) : "[location]"}.

Why this fits the funder’s aim
The funder supports ${g.aim}. Our work connects to this through [describe the activity in one or two sentences].

What we will do
[Activities, who takes part, and when.]

What will change
[Expected results for the people you serve. Add numbers only if you can document them.]`;
}

function Detail() {
  const { slug } = Route.useParams();
  const { grants, profile, applications, updateApp, log } = useStore();
  const g = grants.find((x) => x.slug === slug);
  const [ticks, setTicks] = useState([false, false, false]);
  const [copied, setCopied] = useState("");
  const draftFn = useServerFn(draftApplication);
  const [drafting, setDrafting] = useState(false);
  const [draftErr, setDraftErr] = useState(false);

  if (!g)
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl">We could not find this funding source</h1>
        <p className="mt-2 text-muted">It may have been removed. Go back to the shortlist to pick another.</p>
        <Link to="/" className="mt-4 inline-block font-semibold text-navy underline">Open the shortlist</Link>
      </div>
    );

  const { results, verdict } = evaluateGrant(profile, g.requirements);
  const ds = deadlineState(g.deadline, new Date());
  const app = applications[g.slug] ?? { checklist: {}, status: "draft" as const };
  const todo = g.requirements
    .map((r, i) => ({ r, res: results[i]!, id: `req-${i}` }))
    .filter((x) => x.res.status === "conditional" || x.res.status === "unknown");
  const items = [...todo.map((t) => ({ id: t.id, text: `${t.r.text}: ${t.res.reason}` })), { id: "docs", text: "Read what documents the funder requires" }];

  const makeDraft = async () => {
    setDrafting(true);
    setDraftErr(false);
    try {
      const clean = Object.fromEntries(Object.entries(profile).filter(([, v]) => typeof v === "string")) as Record<string, string>;
      const r = await draftFn({ data: { slug: g.slug, profile: clean, aim: g.aim } });
      if (r.ok) { updateApp(g.slug, { draft_text: r.text }); log("draft_generated", g.title); }
      else setDraftErr(true);
    } catch {
      setDraftErr(true);
    } finally {
      setDrafting(false);
    }
  };

  const confirm = () => {
    const at = new Date().toISOString();
    updateApp(g.slug, { status: "verified", verified_at: at, match_snapshot: { verdict, results, profile, deadline: ds.label } });
    log("verified", g.title);
    setTicks([false, false, false]);
  };

  return (
    <article className="max-w-3xl">
      <Link to="/" className="text-sm text-navy underline">← Back to the shortlist</Link>
      <h1 className="mt-3 text-3xl">{g.title}</h1>
      <p className="text-muted">{g.funder}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <VerdictChip verdict={verdict} />
        <DeadlineChip ds={ds} />
        {g.source_type === "aggregator" && <ThirdPartyChip />}
      </div>

      <Card className="mt-5 p-5">
        <dl className="grid gap-3 sm:grid-cols-[9rem_1fr]">
          <dt className="font-semibold">Deadline</dt><dd>{g.deadline.text}</dd>
          <dt className="font-semibold">Amount</dt><dd>{g.amount_text}</dd>
          <dt className="font-semibold">Documents</dt><dd>{g.documents_text}</dd>
          <dt className="font-semibold">Source</dt>
          <dd>
            <a href={g.source_url} target="_blank" rel="noreferrer" className="break-all text-navy underline">{g.source_url}</a>
            <br /><span className="text-sm text-muted">{g.source_type === "official" ? "Official funder page" : "Third-party source"} · read {formatDate(g.retrieved_on)}</span>
          </dd>
        </dl>
      </Card>

      <h2 className="mt-8 text-xl">Eligibility checks</h2>
      <Card className="mt-3 px-5">
        <ul>
          {g.requirements.map((r, i) => (
            <EvidenceRow key={i} req={r} result={results[i]!} fallbackUrl={g.source_url} retrieved={g.retrieved_on} />
          ))}
        </ul>
      </Card>

      {verdict === "notfit" ? (
        <p className="mt-6 rounded-[14px] border border-line bg-surface p-4">
          This source is not a fit for your current profile. If an answer has changed, update your profile and the checks will update.
        </p>
      ) : (
        <>
          {ds.state === "closed" && (
            <p className="mt-6 rounded-[14px] bg-cond-bg p-4 text-cond-fg">This round is closed. Use the checklist to prepare for the next one.</p>
          )}
          <h2 className="mt-8 text-xl">Before you apply</h2>
          <Card className="mt-3 p-5">
            <ul className="flex flex-col gap-3">
              {items.map((it) => (
                <li key={it.id}>
                  <label className="flex min-h-11 items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 size-5 accent-[var(--navy)]"
                      checked={!!app.checklist[it.id]}
                      onChange={(e) => updateApp(g.slug, { checklist: { ...app.checklist, [it.id]: e.target.checked } })}
                    />
                    <span>{it.text}</span>
                  </label>
                </li>
              ))}
            </ul>
          </Card>

          <details className="mt-6 rounded-[14px] border border-line bg-surface p-5">
            <summary className="font-semibold">Draft a starting text</summary>
            <p className="mt-2 text-sm text-muted">
              Built only from your profile and the funder’s stated aim. Bracketed parts are facts we do not have yet. Edit before you use it.
            </p>
            {app.draft_text === undefined ? (
              <div className="mt-3">
                <button className={btn} disabled={drafting} onClick={makeDraft}>{drafting ? "Writing a starting text…" : "Draft a starting text with AI"}</button>
                <div role="status" aria-live="polite" className="sr-only">{drafting ? "Writing a starting text." : ""}</div>
                {draftErr && (
                  <div role="alert" className="mt-3 rounded-lg bg-notmet-bg p-3 text-notmet-fg">
                    We could not generate a draft. Your profile is saved. Try again in a moment.{" "}
                    <button className="font-semibold underline" onClick={() => { updateApp(g.slug, { draft_text: templateDraft(profile, g) }); log("draft_generated", `${g.title} (template)`); setDraftErr(false); }}>Use the basic template instead</button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <label className="mt-3 block text-sm font-medium" htmlFor="draft">Starting text</label>
                <textarea
                  id="draft"
                  rows={14}
                  className="mt-1 w-full rounded-lg border border-line bg-surface p-3"
                  value={app.draft_text}
                  onChange={(e) => updateApp(g.slug, { draft_text: e.target.value })}
                />
                <div className="mt-2 flex items-center gap-3">
                  <button className={btnGhost} onClick={async () => { await navigator.clipboard.writeText(app.draft_text ?? ""); setCopied("Copied"); setTimeout(() => setCopied(""), 1500); }}>Copy text</button>
                  <button className={btnGhost} onClick={() => updateApp(g.slug, { draft_text: undefined })}>Start over</button>
                  <span role="status" aria-live="polite" className="text-sm text-teal">{copied}</span>
                </div>
              </>
            )}
          </details>

          <h2 className="mt-8 text-xl">Your decision</h2>
          <Card className="mt-3 p-5">
            {app.status === "verified" ? (
              <div role="status">
                <p className="font-semibold">You verified this on {new Date(app.verified_at!).toLocaleString("en-GB")}.</p>
                <p className="mt-1">Submit through the funder’s own page. Grantastic never submits for you.</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <a className={btn} href={g.source_url} target="_blank" rel="noreferrer">Open the funder’s page</a>
                  <button className={btnGhost} onClick={() => { updateApp(g.slug, { status: "draft", verified_at: undefined }); log("verification_reopened", g.title); }}>Reopen the checks</button>
                </div>
              </div>
            ) : (
              <fieldset>
                <legend className="mb-3">Tick all three to confirm.</legend>
                {STATEMENTS.map((s, i) => (
                  <label key={i} className="flex min-h-11 items-start gap-3 py-1">
                    <input type="checkbox" className="mt-1 size-5 accent-[var(--navy)]" checked={ticks[i]} onChange={(e) => setTicks(ticks.map((t, j) => (j === i ? e.target.checked : t)))} />
                    <span>{s}</span>
                  </label>
                ))}
                <button className={`${btn} mt-4`} disabled={!ticks.every(Boolean)} onClick={confirm}>Confirm I have verified this</button>
              </fieldset>
            )}
          </Card>
        </>
      )}
    </article>
  );
}
