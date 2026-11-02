# AfyaCare — task roadmap

## Done
- Lovable Cloud backend + email/password staff sign-in enabled
- Database migration applied: roles, users, sessions, bilingual content, providers, reminders, consent + seed data (sample phone numbers — must be replaced with verified facility contacts before launch)
- USSD menu engine (EN/SW, back navigation, reminders opt-in, facility finder)
- Gateway callback endpoint `/api/public/ussd/<key>` (key-protected, CON/END)
- Admin server functions + `/dashboard` (content, facilities, reminders, users, gateway setup card)
- `/auth` staff sign-in/sign-up; first account claims admin

## Open
- [ ] Replace remaining sample facility phone numbers with verified contacts (user will send more; Nasira Ac Facility added in Busia 2026-11-02 with 0768 236 831)
- [ ] User asked for a `ussdcallback` Supabase Edge Function — blocked: new Edge Functions are not allowed on this stack; instead confirm the existing `/api/public/ussd/<key>` route covers the requested spec (five topics, CON/END, validation, secrets) and provide the public URL

## Done (2026-10-31)
- [x] Landing page + interactive USSD simulator with dial flow (*335#), design system, root head/fonts/Toaster/auth listener
- [x] Server functions moved from src/server/ to src/lib/*.functions.ts (import protection blocked src/server/ in client bundles)
- [x] Simulator verified in browser: dial, English + Kiswahili menus, facility finder — no console errors
