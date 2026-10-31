# AfyaCare — task roadmap

## Done
- Lovable Cloud backend + email/password staff sign-in enabled
- Database migration applied: roles, users, sessions, bilingual content, providers, reminders, consent + seed data (sample phone numbers — must be replaced with verified facility contacts before launch)
- USSD menu engine (EN/SW, back navigation, reminders opt-in, facility finder)
- Gateway callback endpoint `/api/public/ussd/<key>` (key-protected, CON/END)
- Admin server functions + `/dashboard` (content, facilities, reminders, users, gateway setup card)
- `/auth` staff sign-in/sign-up; first account claims admin

## Open
- [ ] Fix any remaining typecheck errors (build OK at 2026-10-30T09:12:21Z — re-verify after next edits)
- [ ] Landing page (`src/routes/index.tsx`) — hero, how-it-works, interactive USSD simulator (uses `simulateUssd` server fn, already written)
- [ ] Design system in `src/styles.css` (green/cream health palette, Sora + Manrope fonts via link in `__root.tsx`)
- [ ] `src/routes/__root.tsx` — real title/description, mount sonner `<Toaster />`, `onAuthStateChange` subscriber
- [ ] Engine unit tests `src/test/ussd-engine.test.ts` (bilingual, back nav, invalid input, reminder action, draft exclusion)
- [ ] End-to-end verification: sign up first admin, dashboard CRUD, simulator flows, callback route via curl
- [ ] `AGENTS.md` — record technical decisions (stateless USSD path engine, callback key secret, bootstrap admin rule)
- [ ] Simulator: accept dialing the service code (*335#) — user dialled *335# in the demo on 2026-10-31; show it as the dialed code and map it to the language screen
