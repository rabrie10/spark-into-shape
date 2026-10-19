import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Grant } from "@/lib/evaluate";
import { extractGrant } from "@/lib/ai.functions";
import { Card, btn, btnGhost } from "@/components/grant-ui";

export const Route = createFileRoute("/add")({
  head: () => ({
    meta: [
      { title: "Add a funder page · Grantastic" },
      { name: "description", content: "Paste a funder’s page, review the extracted facts and approve them before they enter your shortlist." },
      { property: "og:title", content: "Add a funder page · Grantastic" },
      { property: "og:description", content: "Nothing enters the shortlist without a person pressing Approve." },
    ],
  }),
  component: AddPage,
});

type Row = { key: string; label: string; value: string; excerpt: string | null; verified: boolean; touched: boolean; removed?: boolean };

const EXAMPLES = [
  "https://www.oslo.kommune.no/tilskudd-legater-og-stipend/",
  "https://www.imdi.no/tilskudd/",
];

const edit = (set: (l: Row[]) => void, list: Row[], i: number, patch: Partial<Row>) =>
    set(list.map((x, j) => (j === i ? { ...x, ...patch } : x)));

function FieldRow({ r, i, list, set, multiline }: { r: Row; i: number; list: Row[]; set: (l: Row[]) => void; multiline?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${r.removed ? "opacity-50" : ""} ${!r.verified && !r.touched && !r.removed ? "border-cond-fg" : "border-line"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={r.key} className="font-semibold">{r.label}</label>
        <div className="flex items-center gap-2 text-sm">
          {!r.value && !r.removed && <span className="rounded-full bg-unk-bg px-2 py-0.5 text-unk-fg">Not stated</span>}
          {r.value && !r.verified && !r.touched && !r.removed && <span className="rounded-full bg-cond-bg px-2 py-0.5 text-cond-fg"><span aria-hidden="true">! </span>Unverified</span>}
          {r.value && r.verified && !r.touched && <span className="rounded-full bg-met-bg px-2 py-0.5 text-met-fg"><span aria-hidden="true">✓ </span>Found on page</span>}
          {r.touched && <span className="rounded-full bg-sky px-2 py-0.5">Edited by you</span>}
          <button type="button" className="underline" onClick={() => edit(set, list, i, { removed: !r.removed })}>{r.removed ? "Keep" : "Remove"}</button>
        </div>
      </div>
      {!r.removed && (
        <>
          {multiline ? (
            <textarea id={r.key} rows={2} className="mt-2 w-full rounded-lg border border-line bg-surface p-2" value={r.value} onChange={(e) => edit(set, list, i, { value: e.target.value, touched: true })} />
          ) : (
            <input id={r.key} className="mt-2 min-h-11 w-full rounded-lg border border-line bg-surface px-3" value={r.value} onChange={(e) => edit(set, list, i, { value: e.target.value, touched: true })} />
          )}
          {r.excerpt && (
            <p className="mt-2 border-l-2 border-line pl-3 text-sm text-muted"><span className="font-semibold text-text">From the page: </span>“{r.excerpt}”</p>
          )}
          {r.value && !r.verified && !r.touched && <p className="mt-1 text-sm text-cond-fg">We could not find this wording on the page. Edit or remove it before approving.</p>}
        </>
      )}
    </div>
  );
}

function AddPage() {
  const { addGrant, log } = useStore();
  const nav = useNavigate();
  const extract = useServerFn(extractGrant);
  const [url, setUrl] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [elig, setElig] = useState<Row[]>([]);
  const [sourceType, setSourceType] = useState<"official" | "aggregator">("official");
  const [meta, setMeta] = useState<{ iso: string | null; yearStated: boolean; retrieved: string }>({ iso: null, yearStated: true, retrieved: "" });

  const start = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setRows(null);
    try {
      const u = new URL(url.trim());
      if (u.protocol !== "https:") throw new Error();
    } catch {
      setErr("This is not a valid web address. Paste the full address, starting with https://.");
      return;
    }
    setLoading(true);
    try {
      const r = await extract({ data: { url: url.trim() } });
      if (!r.ok) {
        setErr(r.error);
        return;
      }
      const x = r.extraction;
      const mk = (key: string, label: string, f: { value: string | null; excerpt: string | null; status: string }, v: boolean): Row => ({
        key, label, value: f.status === "stated" ? (f.value ?? "") : "", excerpt: f.status === "stated" ? f.excerpt : null, verified: f.status !== "stated" || v, touched: false,
      });
      setRows([
        mk("title", "Title", x.title, r.verified.title),
        mk("funder", "Funder", x.funder, r.verified.funder),
        mk("aim", "Stated aim", x.aim, r.verified.aim),
        mk("amount", "Amount", x.amount, r.verified.amount),
        mk("documents", "Documents", x.documents, r.verified.documents),
        mk("deadline", "Deadline", x.deadline, r.verified.deadline),
      ]);
      setElig(x.eligibility.map((e, i) => ({ key: `e${i}`, label: `Requirement ${i + 1}`, value: e.text, excerpt: e.excerpt, verified: r.verified.eligibility[i] ?? false, touched: false })));
      setSourceType(x.source_type_guess === "aggregator" ? "aggregator" : "official");
      setMeta({ iso: x.deadline.iso, yearStated: x.deadline.year_stated, retrieved: r.retrieved_on });
      log("extraction_run", url.trim());
    } catch {
      setErr("Something interrupted the reading. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const blocked = [...(rows ?? []), ...elig].filter((r) => !r.removed && !r.verified && !r.touched);

  const approve = () => {
    const f = Object.fromEntries((rows ?? []).map((x) => [x.key, x])) as Record<string, Row>;
    const val = (k: string) => f[k]?.value.trim() || "";
    const slug = "added-" + Date.now();
    const deadlineText = val("deadline")
      ? `${val("deadline")}${meta.yearStated ? "" : " The page gives no year."}`
      : "Not stated";
    const g: Grant = {
      slug,
      title: val("title") || "Untitled funding source",
      funder: val("funder") || "Not stated",
      source_url: url.trim(),
      source_type: sourceType,
      aim: val("aim") || "not stated",
      amount_text: val("amount") || "Not stated",
      documents_text: val("documents") || "Not stated",
      deadline: meta.iso && /^\d{4}-\d{2}-\d{2}$/.test(meta.iso) && f["deadline"] && !f["deadline"].touched
        ? { kind: "fixed", iso: meta.iso, inferred: !meta.yearStated, text: deadlineText }
        : { kind: "closed", text: deadlineText + " No confirmed date, so treated as not open." },
      retrieved_on: meta.retrieved,
      requirements: elig.filter((e) => !e.removed && e.value.trim()).map((e) => ({
        text: e.value.trim(),
        evidence_excerpt: e.excerpt ? `“${e.excerpt}”` : "Added during review.",
        rule: [{ out: ["unknown", "Check this requirement against your organisation."] }],
      })),
    };
    addGrant(g);
    log("extraction_reviewed", `approved: ${g.title}`);
    nav({ to: "/grants/$slug", params: { slug } });
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl">Add a funder page</h1>
      <p className="mt-2 text-muted">Paste the address of a funder’s page. AI reads it into facts with supporting quotes. You check every fact before it enters your shortlist.</p>
      <form onSubmit={start} className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1 text-sm font-medium">
          Funder page address
          <input className="min-h-11 rounded-lg border border-line bg-surface px-3 text-base font-normal" value={url} onChange={(e) => setUrl(e.target.value)} inputMode="url" />
        </label>
        <button className={btn} disabled={loading}>{loading ? "Reading the page…" : "Read the page"}</button>
      </form>
      <p className="mt-2 text-sm text-muted">
        For example: {EXAMPLES.map((x, i) => (<span key={x}>{i > 0 && " or "}<button type="button" className="underline" onClick={() => setUrl(x)}>{new URL(x).hostname}</button></span>))}
      </p>
      <div role="status" aria-live="polite" className="sr-only">{loading ? "Reading the page. This can take up to a minute." : ""}</div>
      {loading && <p className="mt-4 text-muted">Reading the page and checking each quote against it. This can take up to a minute.</p>}
      {err && <p role="alert" className="mt-4 rounded-lg bg-notmet-bg p-3 text-notmet-fg">{err}</p>}

      {rows && (
        <Card className="mt-6 p-5">
          <h2 className="text-xl">Review the facts</h2>
          <p className="mt-1 text-sm text-muted">
            Read from <a href={url} target="_blank" rel="noreferrer" className="break-all text-navy underline">{url}</a> on {meta.retrieved}. Every requirement starts as “Check”, so AI never decides whether you qualify.
          </p>
          {!meta.yearStated && rows.find((r) => r.key === "deadline")?.value && (
            <p className="mt-3 rounded-lg bg-cond-bg p-3 text-sm text-cond-fg">The deadline has no year on the page. Confirm it before relying on it.</p>
          )}
          <div className="mt-4 flex flex-col gap-3">
            {rows.map((r, i) => <FieldRow key={r.key} r={r} i={i} list={rows} set={(l) => setRows(l)} multiline={r.key === "aim" || r.key === "documents"} />)}
          </div>
          <h3 className="mt-6 text-lg">Eligibility requirements</h3>
          {elig.length === 0 && <p className="mt-2 text-muted">The page lists no eligibility requirements. Check the funder’s page for them.</p>}
          <div className="mt-3 flex flex-col gap-3">
            {elig.map((r, i) => <FieldRow key={r.key} r={r} i={i} list={elig} set={setElig} multiline />)}
          </div>
          <fieldset className="mt-6">
            <legend className="font-semibold">Who published this page?</legend>
            <div className="mt-2 flex flex-wrap gap-4">
              <label className="flex min-h-11 items-center gap-2"><input type="radio" checked={sourceType === "official"} onChange={() => setSourceType("official")} /> The funder itself</label>
              <label className="flex min-h-11 items-center gap-2"><input type="radio" checked={sourceType === "aggregator"} onChange={() => setSourceType("aggregator")} /> A third party</label>
            </div>
          </fieldset>
          {blocked.length > 0 && <p className="mt-4 text-sm text-cond-fg">{blocked.length} unverified {blocked.length === 1 ? "fact needs" : "facts need"} editing or removing before you can approve.</p>}
          <div className="mt-4 flex flex-wrap gap-3">
            <button className={btn} disabled={blocked.length > 0} onClick={approve}>Approve and add to shortlist</button>
            <button className={btnGhost} onClick={() => { log("extraction_reviewed", `rejected: ${url}`); setRows(null); setElig([]); setUrl(""); }}>Reject</button>
          </div>
        </Card>
      )}
    </div>
  );
}
