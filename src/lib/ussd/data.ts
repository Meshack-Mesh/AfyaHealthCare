/**
 * Server-side data loader for the USSD engine.
 * Uses the publishable key client: only published content and the public
 * provider directory are read — the same rows the anon RLS policies expose.
 */
import { createClient } from "@supabase/supabase-js";
import type { UssdData } from "./engine";

function makePublicClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Missing Supabase server environment");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      // Opaque sb_ keys are not JWTs: send apikey only.
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

interface CategoryRow {
  id: string;
  slug: string;
  name_en: string;
  name_sw: string;
  sort_order: number;
}

interface ContentRow {
  id: string;
  title_en: string;
  title_sw: string;
  body_en: string;
  body_sw: string;
  status: string;
  sort_order: number;
  category_id: string;
}

interface ProviderRow {
  id: string;
  name: string;
  county: string;
  location: string;
  services: string;
  phone: string;
}

export async function loadUssdData(): Promise<UssdData> {
  const supabase = makePublicClient();

  const [catsRes, contentRes, providersRes] = await Promise.all([
    supabase.from("health_categories").select("id, slug, name_en, name_sw, sort_order"),
    supabase
      .from("health_content")
      .select("id, title_en, title_sw, body_en, body_sw, status, sort_order, category_id")
      .eq("status", "published"),
    supabase.from("healthcare_providers").select("id, name, county, location, services, phone"),
  ]);

  if (catsRes.error || contentRes.error || providersRes.error) {
    throw new Error("Failed to load USSD content");
  }

  const categories = (catsRes.data as CategoryRow[]).map((c) => ({
    id: c.id,
    slug: c.slug,
    nameEn: c.name_en,
    nameSw: c.name_sw,
    sortOrder: c.sort_order,
  }));

  const content = (contentRes.data as ContentRow[]).map((c) => ({
    id: c.id,
    categorySlug: categories.find((cat) => cat.id === c.category_id)?.slug ?? "",
    titleEn: c.title_en,
    titleSw: c.title_sw,
    bodyEn: c.body_en,
    bodySw: c.body_sw,
    status: c.status,
    sortOrder: c.sort_order,
  }));

  const providers = (providersRes.data as ProviderRow[]).map((p) => ({
    id: p.id,
    name: p.name,
    county: p.county,
    location: p.location,
    services: p.services,
    phone: p.phone,
  }));

  return { categories, content, providers };
}
