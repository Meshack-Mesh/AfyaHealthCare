import { createFileRoute } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "crypto";
import { z } from "zod";
import { runUssd } from "@/lib/ussd/engine";
import { loadUssdData } from "@/lib/ussd/data";

/**
 * USSD gateway callback (Africa's Talking and compatible gateways).
 *
 * The callback key in the URL path is the shared secret the gateway's
 * configured callback URL must carry. Africa's Talking sends the session
 * fields as x-www-form-urlencoded; the response must be plain text starting
 * with CON (continue) or END (terminate).
 *
 * Session path layout: <language>*<consent>*<menu navigation...>
 */

const payloadSchema = z.object({
  sessionId: z.string().min(1).max(80),
  serviceCode: z.string().min(1).max(40),
  phoneNumber: z.string().regex(/^\+?[0-9]{9,15}$/),
  text: z.string().max(120).optional().default(""),
});

function keyMatches(provided: string, secret: string): boolean {
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(secret).digest();
  return timingSafeEqual(a, b);
}

async function persistSession(sessionId: string, phone: string, state: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("ussd_sessions").upsert(
    {
      id: sessionId,
      phone_number: phone,
      state,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
}

async function ensureUser(phone: string, lang: "en" | "sw", consent: boolean) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: existing } = await supabaseAdmin
    .from("ussd_users")
    .select("id, consent_given")
    .eq("phone_number", phone)
    .maybeSingle();

  if (existing) {
    if (consent && !existing.consent_given) {
      await supabaseAdmin
        .from("ussd_users")
        .update({ consent_given: true, language: lang })
        .eq("id", existing.id);
      await supabaseAdmin
        .from("consent_records")
        .insert({ ussd_user_id: existing.id, purpose: "ussd_service" });
    }
    return existing.id as string;
  }

  const { data: created, error } = await supabaseAdmin
    .from("ussd_users")
    .insert({ phone_number: phone, language: lang, consent_given: consent })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  if (consent) {
    await supabaseAdmin
      .from("consent_records")
      .insert({ ussd_user_id: created.id, purpose: "ussd_service" });
  }
  return created.id as string;
}

export const Route = createFileRoute("/api/public/ussd/$callbackKey")({
  server: {
    handlers: {
      GET: async () =>
        new Response("AfyaCare USSD endpoint is running", {
          status: 200,
          headers: { "content-type": "text/plain" },
        }),

      POST: async ({ request, params }) => {
        const secret = process.env["USSD_CALLBACK_KEY"];
        if (!secret || !keyMatches(params.callbackKey, secret)) {
          return new Response("Forbidden", { status: 403 });
        }

        const contentType = request.headers.get("content-type") ?? "";
        let raw: Record<string, string>;
        if (contentType.includes("application/json")) {
          raw = (await request.json()) as Record<string, string>;
        } else {
          const form = await request.formData();
          raw = Object.fromEntries(
            [...form.entries()].map(([k, v]) => [k, String(v)]),
          );
        }

        const parsed = payloadSchema.safeParse(raw);
        if (!parsed.success) {
          return new Response("END Invalid session payload", { status: 200 });
        }
        const { sessionId, phoneNumber, text } = parsed.data;
        const segments = text.split("*").filter((s) => s !== "");

        let screen;
        try {
          const data = await loadUssdData();
          screen = runUssd(data, text);

          // Log the session (best effort; never break the user's session).
          await persistSession(
            sessionId,
            phoneNumber,
            `${screen.kind}:${segments.length} steps`,
          ).catch(() => undefined);

          // Consent accepted: segments = [language, "1"].
          if (segments.length === 2 && segments[1] === "1") {
            const lang = segments[0] === "2" ? "sw" : "en";
            await ensureUser(phoneNumber, lang, true).catch(() => undefined);
          }

          // Reminder opt-in confirmed.
          if (screen.action?.type === "create_reminder") {
            const lang = segments[0] === "2" ? "sw" : "en";
            const userId = await ensureUser(phoneNumber, lang, true);
            const { supabaseAdmin } = await import(
              "@/integrations/supabase/client.server"
            );
            await supabaseAdmin.from("reminders").insert({
              ussd_user_id: userId,
              reminder_type: screen.action.reminderType,
            });
          }
        } catch (err) {
          console.error("USSD callback error", err);
          return new Response(
            "END Sorry, the service is temporarily unavailable. Please try again.",
            { status: 200 },
          );
        }

        return new Response(`${screen.kind} ${screen.text}`, {
          status: 200,
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      },
    },
  },
});
