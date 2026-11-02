import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";

async function assertAdmin(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (!data) throw new Error("Forbidden: admin role required");
}

async function getAdminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const contentSchema = z.object({
  id: z.string().uuid().optional(),
  categoryId: z.string().uuid(),
  titleEn: z.string().min(1).max(120),
  titleSw: z.string().min(1).max(120),
  bodyEn: z.string().min(1).max(2000),
  bodySw: z.string().min(1).max(2000),
  status: z.enum(["draft", "reviewed", "published"]),
  sortOrder: z.number().int().min(0).max(999),
});

export const adminSaveContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => contentSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const admin = await getAdminClient();
    const row = {
      category_id: data.categoryId,
      title_en: data.titleEn,
      title_sw: data.titleSw,
      body_en: data.bodyEn,
      body_sw: data.bodySw,
      status: data.status,
      sort_order: data.sortOrder,
      updated_at: new Date().toISOString(),
    };
    const res = data.id
      ? await admin.from("health_content").update(row).eq("id", data.id).select().single()
      : await admin.from("health_content").insert(row).select().single();
    if (res.error) throw new Error(res.error.message);
    return { id: res.data.id as string };
  });

export const adminDeleteContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const admin = await getAdminClient();
    const res = await admin.from("health_content").delete().eq("id", data.id);
    if (res.error) throw new Error(res.error.message);
    return { ok: true };
  });

export const adminListContent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const admin = await getAdminClient();
    const [cats, content] = await Promise.all([
      admin.from("health_categories").select("*").order("sort_order"),
      admin
        .from("health_content")
        .select("*")
        .order("sort_order"),
    ]);
    if (cats.error) throw new Error(cats.error.message);
    if (content.error) throw new Error(content.error.message);
    return {
      categories: cats.data as Array<{
        id: string;
        slug: string;
        name_en: string;
        name_sw: string;
        sort_order: number;
      }>,
      content: content.data as Array<{
        id: string;
        category_id: string;
        title_en: string;
        title_sw: string;
        body_en: string;
        body_sw: string;
        status: string;
        sort_order: number;
      }>,
    };
  });

const providerSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(160),
  county: z.string().min(1).max(80),
  location: z.string().min(1).max(160),
  services: z.string().min(1).max(400),
  phone: z.string().min(5).max(32),
  sortOrder: z.number().int().min(0).max(999),
});

export const adminSaveProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => providerSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const admin = await getAdminClient();
    const row = {
      name: data.name,
      county: data.county,
      location: data.location,
      services: data.services,
      phone: data.phone,
      sort_order: data.sortOrder,
    };
    const res = data.id
      ? await admin.from("healthcare_providers").update(row).eq("id", data.id).select().single()
      : await admin.from("healthcare_providers").insert(row).select().single();
    if (res.error) throw new Error(res.error.message);
    return { id: res.data.id as string };
  });

export const adminDeleteProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const admin = await getAdminClient();
    const res = await admin.from("healthcare_providers").delete().eq("id", data.id);
    if (res.error) throw new Error(res.error.message);
    return { ok: true };
  });

export const adminListProviders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const admin = await getAdminClient();
    const res = await admin
      .from("healthcare_providers")
      .select("*")
      .order("sort_order");
    if (res.error) throw new Error(res.error.message);
    return {
      providers: res.data as Array<{
        id: string;
        name: string;
        county: string;
        location: string;
        services: string;
        phone: string;
        sort_order: number;
      }>,
    };
  });

export const adminListReminders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const admin = await getAdminClient();
    const res = await admin
      .from("reminders")
      .select("id, reminder_type, due_date, status, created_at, ussd_user:ussd_users(phone_number)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (res.error) throw new Error(res.error.message);
    return {
      reminders: res.data as Array<{
        id: string;
        reminder_type: string;
        due_date: string | null;
        status: string;
        created_at: string;
        ussd_user: { phone_number: string } | null;
      }>,
    };
  });

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const admin = await getAdminClient();
    const res = await admin
      .from("ussd_users")
      .select("id, phone_number, language, consent_given, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (res.error) throw new Error(res.error.message);
    return {
      users: res.data as Array<{
        id: string;
        phone_number: string;
        language: string;
        consent_given: boolean;
        created_at: string;
      }>,
    };
  });

export const adminGetStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const admin = await getAdminClient();
    const [users, sessions, reminders, published, providers] = await Promise.all([
      admin.from("ussd_users").select("id", { count: "exact", head: true }),
      admin.from("ussd_sessions").select("id", { count: "exact", head: true }),
      admin.from("reminders").select("id", { count: "exact", head: true }).eq("status", "pending"),
      admin.from("health_content").select("id", { count: "exact", head: true }).eq("status", "published"),
      admin.from("healthcare_providers").select("id", { count: "exact", head: true }),
    ]);
    return {
      users: users.count ?? 0,
      sessions: sessions.count ?? 0,
      pendingReminders: reminders.count ?? 0,
      publishedContent: published.count ?? 0,
      providers: providers.count ?? 0,
    };
  });

/**
 * One-time bootstrap: when no staff roles exist yet, the first signed-in
 * user may claim the admin role.
 */
export const adminBootstrap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await getAdminClient();
    const { count } = await admin
      .from("user_roles")
      .select("id", { count: "exact", head: true });
    if ((count ?? 0) === 0) {
      await admin
        .from("user_roles")
        .insert({ user_id: context.userId, role: "admin" });
      return { isAdmin: true, claimed: true };
    }
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: !!data, claimed: false };
  });

export const adminIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: !!data };
  });

const generateSchema = z.object({
  categoryId: z.string().uuid(),
  source: z.string().min(3).max(6000),
});

/**
 * Drafts bilingual USSD content with Lovable AI from a topic or pasted
 * source text. Returns a suggestion only — nothing is saved until staff
 * calls adminSaveContent.
 */
export const adminGenerateContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => generateSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const admin = await getAdminClient();
    const cat = await admin
      .from("health_categories")
      .select("name_en")
      .eq("id", data.categoryId)
      .single();
    if (cat.error) throw new Error("Topic not found");
    const request = getRequest();
    const { generateUssdContent } = await import("@/lib/ai/generate.server");
    return generateUssdContent(request, {
      source: data.source,
      categoryName: (cat.data as { name_en: string }).name_en,
    });
  });

/** Full gateway callback URL for the signed-in admin's configuration. */
export const adminGetGatewayInfo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const key = process.env["USSD_CALLBACK_KEY"];
    if (!key) throw new Error("USSD_CALLBACK_KEY not configured");
    return {
      callbackPath: `/api/public/ussd/${key}`,
      provider: "Africa's Talking",
    };
  });
