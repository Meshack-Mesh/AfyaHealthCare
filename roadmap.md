# AfyaCare — task roadmap

## Done (2026-11-03)
- [x] Locked public reads of health_content to published items only (drafts staff-only); RLS migration fix applied live
- [x] Publish requested — app goes live at https://afyacareussd.lovable.app; USSD callback URL becomes reachable there
- [x] Confirmed gateway callback and simulator run the same menu engine (`runUssd`), so the live service answers the full AfyaCare menu


## Done
- Lovable Cloud backend + email/password staff sign-in enabled
- Database migration applied: roles, users, sessions, bilingual content, providers, reminders, consent + seed data (sample phone numbers — must be replaced with verified facility contacts before launch)
- USSD menu engine (EN/SW, back navigation, reminders opt-in, facility finder)
- Gateway callback endpoint `/api/public/ussd/<key>` (key-protected, CON/END)
- Admin server functions + `/dashboard` (content, facilities, reminders, users, gateway setup card)
- `/auth` staff sign-in/sign-up; first account claims admin

## Open
- [ ] Staff editor: allow creating, editing, and removing topics, health articles, and facility details without relying on pre-populated seed rows.
- [ ] Patient reminders: let callers choose bilingual reminder preferences and dates, then deliver scheduled SMS after Africa's Talking credentials and delivery details are configured.
- [ ] Email sending: no sender domain configured yet — setup dialog shown 2026-11-03; once the user completes it, scaffold the six auth email templates (sign-up confirmation included)
- [ ] Africa's Talking 401 fix (2026-11-05): the configured callback URL points at the preview host (`id-preview--…lovable.app`), which requires sign-in and returns 401. The published endpoint works (tested 200 with real key). User must edit the callback URL in Africa's Talking to `https://afyacareussd.lovable.app` + the same `/api/public/ussd/<key>` path shown on the staff dashboard. Endpoint also ignores `serviceCode`, so trial code `*384*52621#` works without changes.
- [ ] Replace remaining sample facility phone numbers with verified contacts — user will send them (Nasira Ac Facility, Busia, added 2026-11-02 with +254 768 236 831)
- [x] User's `ussdcallback` Edge Function request resolved: new Edge Functions are not possible on this stack; the existing `/api/public/ussd/<key>` route already implements the full requested spec (sessionId/serviceCode/phoneNumber/text, CON/END, five topics, invalid-input handling, no Supabase login needed, key stored in Lovable Cloud secrets). Public URL host: `https://project--18d6b6da-9509-4c38-9c05-f437f73b6d80.lovable.app`; the key suffix is on the staff dashboard
- [x] AI content generator shipped and verified end-to-end in the dashboard (2026-11-02): topic/source → bilingual EN/SW draft → save as draft

## Done (2026-11-02)
- [x] AI content generator: `adminGenerateContent` + `src/lib/ai/generate.server.ts` + dashboard "Generate with AI" dialog; gateway call verified live and full UI flow verified signed-in (draft saved, no console errors)
- [x] Nasira Ac Facility added to the facility finder (Busia, +254 768 236 831)
- [x] Test sign-up/verification data cleaned up (draft deleted, test admin role removed so the first real account claims admin)

## Done (2026-10-31)
- [x] Landing page + interactive USSD simulator with dial flow (*384*52621#), design system, root head/fonts/Toaster/auth listener
- [x] Server functions moved from src/server/ to src/lib/*.functions.ts (import protection blocked src/server/ in client bundles)
- [x] Simulator verified in browser: dial, English + Kiswahili menus, facility finder — no console errors
