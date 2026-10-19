<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Grantastic prototype keeps all state in browser localStorage (src/lib/store.tsx); eligibility is pure rule data in src/lib/evaluate.ts with tests — why: prototype first, backend later.
- AI calls (draft starter, funder-page extraction) run in createServerFn in src/lib/ai.functions.ts via Lovable AI Gateway; the model never sets eligibility (extracted requirements default to "Check") — why: responsible-AI spec 05.
