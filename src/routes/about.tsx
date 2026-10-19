import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/grant-ui";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "How Grantastic works" },
      { name: "description", content: "What Grantastic automates, what it does not, and what can go wrong." },
      { property: "og:title", content: "How Grantastic works" },
      { property: "og:description", content: "AI assists. People verify, decide, and submit." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <article className="max-w-[70ch]">
      <h1 className="text-3xl">What Grantastic does and doesn’t do</h1>
      <p className="mt-3">Grantastic helps you find funding that may fit your organisation and shows why. It reads funders’ public pages, compares them with your answers, and helps you prepare.</p>
      <Card className="mt-6 flex flex-col gap-4 p-5">
        <p><strong>What is automated.</strong> Reading a funder’s page into a checklist of facts, and drafting a starting text. Both are marked, sourced, and reviewed by a person before use.</p>
        <p><strong>What is not.</strong> Eligibility checks and ranking follow written rules you can inspect. Grantastic never submits anything for you.</p>
        <p><strong>What can go wrong.</strong> Funders change their rules and dates. Pages can be unclear or out of date. A check marked “Met” means your answers match what the page says, not that the funder will accept you. Before you apply, open the funder’s own page and confirm.</p>
      </Card>
      <p className="mt-6 text-sm text-muted">This prototype keeps your answers in this browser only. Funding data was read from funders’ pages on 19 October 2026.</p>
    </article>
  );
}
