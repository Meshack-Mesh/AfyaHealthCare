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

## AfyaCare architecture decisions

- USSD menu engine (`src/lib/ussd/engine.ts`) is stateless: the gateway sends the full input path (e.g. `2*1*7*1`) each callback, "0" always means back/exit. Keep the simulator on the same engine.
- The gateway callback lives at `/api/public/ussd/$callbackKey`; the URL path segment must equal the `USSD_CALLBACK_KEY` secret (hash-compare). Data writes happen only there; `simulateUssd` is read-only.
- Server functions live in `src/lib/*.functions.ts`, never under `src/server/` (blocked from client bundles by import protection).
- Demo/preview service code is `*335#` (chosen by the user, 2026-10-31).
- Provider phone numbers in the seed data are sample placeholders; replace with verified facility contacts before launch.
- AI content drafts go through `adminGenerateContent` → `src/lib/ai/generate.server.ts` (Lovable AI Gateway `/v1/responses`, model `openai/gpt-6-astra`, structured JSON output). Gateway helpers are `.server.ts` modules, dynamically imported inside handler bodies so they never reach the client bundle. Generation is suggestion-only: nothing saves until staff calls `adminSaveContent`.
