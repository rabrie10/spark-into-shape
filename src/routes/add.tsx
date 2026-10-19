import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Grant } from "@/lib/evaluate";
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

type Field = { key: string; label: string; value: string; excerpt: string };

function sampleExtraction(url: string): Field[] {
  return [
    { key: "title", label: "Title", value: "", excerpt: "" },
    { key: "funder", label: "Funder", value: new URL(url).hostname, excerpt: "Taken from the page address." },
    { key: "aim", label: "Stated aim", value: "", excerpt: "" },
    { key: "amount_text", label: "Amount", value: "", excerpt: "" },
    { key: "deadline", label: "Deadline", value: "", excerpt: "" },
    { key: "eligibility", label: "Eligibility items (one per line)", value: "", excerpt: "" },
  ];
}

function AddPage() {
  const { addGrant, log } = useStore();
  const nav = useNavigate();
  const [url, setUrl] = useState("");
  const [err, setErr] = useState("");
  const [fields, setFields] = useState<Field[] | null>(null);

  const start = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const u = new URL(url);
      if (u.protocol !== "https:") throw new Error();
      setErr("");
      setFields(sampleExtraction(url));
    } catch {
      setErr("This is not a valid web address. Paste the full address, starting with https://.");
    }
  };

  const approve = () => {
    const f = Object.fromEntries(fields!.map((x) => [x.key, x.value.trim()]));
    const slug = "added-" + Date.now();
    const today = new Date().toISOString().slice(0, 10);
    const g: Grant = {
      slug,
      title: f.title || "Untitled funding source",
      funder: f.funder || "Not stated",
      source_url: url,
      source_type: "official",
      aim: f.aim || "not stated",
      amount_text: f.amount_text || "Not stated",
      documents_text: "Not stated",
      deadline: { kind: "closed", text: f.deadline ? `${f.deadline} (entered by you; confirm on the page)` : "Not stated" },
      retrieved_on: today,
      requirements: (f.eligibility || "").split("\n").filter(Boolean).map((t) => ({
        text: t,
        evidence_excerpt: "Added during review. Confirm the wording on the funder’s page.",
        rule: [{ out: ["unknown", "Check this against your organisation."] }],
      })),
    };
    addGrant(g);
    log("extraction_reviewed", `approved: ${g.title}`);
    nav({ to: "/grants/$slug", params: { slug } });
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl">Add a funder page</h1>
      <p className="mt-2 text-muted">Paste the address of a funder’s page. You review every fact before it enters your shortlist.</p>
      <form onSubmit={start} className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1 text-sm font-medium">
          Funder page address
          <input className="min-h-11 rounded-lg border border-line bg-surface px-3 text-base font-normal" value={url} onChange={(e) => setUrl(e.target.value)} />
        </label>
        <button className={btn}>Read the page</button>
      </form>
      {err && <p role="alert" className="mt-2 text-notmet-fg">{err}</p>}

      {fields && (
        <Card className="mt-6 p-5">
          <h2 className="text-xl">Review the facts</h2>
          <p className="mt-1 rounded-lg bg-unk-bg p-3 text-sm text-unk-fg">
            Prototype: automatic reading of the page is not connected yet. Fill in each fact from the page yourself. Leave a field empty if the page says nothing, and it will show as “Not stated”. Every eligibility item starts as “Check”.
          </p>
          <div className="mt-4 flex flex-col gap-4">
            {fields.map((f, i) => (
              <label key={f.key} className="flex flex-col gap-1 text-sm font-medium">
                {f.label}
                {f.key === "eligibility" ? (
                  <textarea rows={4} className="rounded-lg border border-line bg-surface p-3 text-base font-normal" value={f.value} onChange={(e) => setFields(fields.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                ) : (
                  <input className="min-h-11 rounded-lg border border-line bg-surface px-3 text-base font-normal" value={f.value} onChange={(e) => setFields(fields.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                )}
                <span className="font-normal text-muted">{f.value ? f.excerpt || "Entered by you." : "Not stated"}</span>
              </label>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button className={btn} onClick={approve}>Approve and add to shortlist</button>
            <button className={btnGhost} onClick={() => { log("extraction_reviewed", `rejected: ${url}`); setFields(null); setUrl(""); }}>Reject</button>
          </div>
        </Card>
      )}
    </div>
  );
}
