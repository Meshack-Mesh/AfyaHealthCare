/**
 * AfyaCare USSD menu engine.
 *
 * Stateless: Africa's Talking (and most USSD gateways) send the full input
 * path of the session (e.g. "1*1*2*0") with every callback, so the engine
 * walks the segments and renders the screen for the final state. "0" always
 * means "back" on a sub-screen and "exit" on the main menu.
 *
 * Screen depth:
 *  0 language select -> 1 consent -> 2 main menu
 *  3 category menu -> 4 content item
 *  5 facility counties -> 6 county facilities -> 7 facility detail
 *  8 reminders menu -> 9 reminder confirmation
 */

export type Lang = "en" | "sw";
export type ReminderType = "immunization" | "clinic_visit";

export interface UssdCategory {
  slug: string;
  nameEn: string;
  nameSw: string;
  sortOrder: number;
}

export interface UssdContentItem {
  id: string;
  categorySlug: string;
  titleEn: string;
  titleSw: string;
  bodyEn: string;
  bodySw: string;
  status: string;
  sortOrder: number;
}

export interface UssdProvider {
  id: string;
  name: string;
  county: string;
  location: string;
  services: string;
  phone: string;
}

export interface UssdData {
  categories: UssdCategory[];
  content: UssdContentItem[];
  providers: UssdProvider[];
}

export interface UssdAction {
  type: "create_reminder";
  reminderType: ReminderType;
}

export interface UssdScreen {
  kind: "CON" | "END";
  text: string;
  action?: UssdAction;
}

const labels = {
  en: {
    consent:
      "AfyaCare stores your phone number to improve this service. We never share it.\n1. Accept & continue\n2. No, exit",
    main:
      "Welcome to AfyaCare\n1. Reproductive health\n2. Nutrition\n3. Breastfeeding\n4. Immunization\n5. Chronic disease\n6. Find a facility\n7. SMS reminders\n0. Exit",
    back: "0. Back",
    noContent: "No information available yet.",
    chooseCounty: "Find a health facility\nChoose your county:",
    facilitiesIn: "Facilities in {county}:",
    services: "Services",
    phone: "Phone",
    reminders: "SMS Reminders\n1. Immunization reminders\n2. Clinic visit reminders\n0. Back",
    reminderConfirm:
      "We will send {type} SMS reminders to this number.\n1. Confirm\n0. Back",
    reminderSaved: "Thank you! You will receive {type} SMS reminders. Dial again any time.",
    exit: "Thank you for using AfyaCare. Goodbye!",
    consentExit: "No problem. Your number was not stored. Goodbye!",
    invalid: "Invalid selection. Please dial again.",
    immunization: "immunization",
    clinicVisit: "clinic visit",
  },
  sw: {
    consent:
      "AfyaCare huhifadhi namba yako ya simu kuboresha huduma hii. Hatuishi nayo na mtu mwingine.\n1. Kubali na endelea\n2. Hapana, toka",
    main:
      "Karibu AfyaCare\n1. Afya ya uzazi\n2. Lishe\n3. Kunyonyesha\n4. Chanjo\n5. Magonjwa ya kudumu\n6. Tafuta kituo cha afya\n7. Vikumbusho vya SMS\n0. Toka",
    back: "0. Nyuma",
    noContent: "Hakuna taarifa kwa sasa.",
    chooseCounty: "Tafuta kituo cha afya\nChagua kaunti yako:",
    facilitiesIn: "Vituo vya afya {county}:",
    services: "Huduma",
    phone: "Simu",
    reminders: "Vikumbusho vya SMS\n1. Vikumbusho vya chanjo\n2. Vikumbusho vya kliniki\n0. Nyuma",
    reminderConfirm:
      "Tutakutumia vikumbusho vya {type} kwa namba hii.\n1. Thibitisha\n0. Nyuma",
    reminderSaved: "Asante! Tutakutumia vikumbusho vya {type}. Piga tena wakati wowote.",
    exit: "Asante kwa kutumia AfyaCare. Kwaheri!",
    consentExit: "Hakuna shida. Namba yako haijahifadhiwa. Kwaheri!",
    invalid: "Uteuzi si sahihi. Tafadhali piga tena.",
    immunization: "chanjo",
    clinicVisit: "kliniki",
  },
} as const;

interface WalkState {
  lang: Lang | null;
  depth: number;
  categoryIdx: number | null;
  contentIdx: number | null;
  countyIdx: number | null;
  providerIdx: number | null;
  reminderType: ReminderType | null;
}

function publishedContent(data: UssdData, catSlug: string): UssdContentItem[] {
  return data.content
    .filter((c) => c.categorySlug === catSlug && c.status === "published")
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function categoryOf(data: UssdData, idx: number): UssdCategory | undefined {
  const sorted = [...data.categories].sort((a, b) => a.sortOrder - b.sortOrder);
  return sorted[idx];
}

function countiesOf(data: UssdData): string[] {
  return [...new Set(data.providers.map((p) => p.county))].sort();
}

function t(lang: Lang, key: keyof (typeof labels)["en"], vars?: Record<string, string>): string {
  let out: string = labels[lang][key];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, v);
  }
  return out;
}

function reminderTypeLabel(lang: Lang, type: ReminderType): string {
  return type === "immunization" ? t(lang, "immunization") : t(lang, "clinicVisit");
}

function invalid(lang: Lang | null): UssdScreen {
  return { kind: "END", text: t(lang ?? "en", "invalid") };
}

/** Render the screen for the given walk state. */
function render(data: UssdData, s: WalkState): UssdScreen {
  const lang = s.lang;
  if (lang === null) {
    return { kind: "CON", text: "AfyaCare Health Service\n1. English\n2. Kiswahili" };
  }

  switch (s.depth) {
    case 1:
      return { kind: "CON", text: t(lang, "consent") };

    case 2:
      return { kind: "CON", text: t(lang, "main") };

    case 3: {
      const cat = categoryOf(data, s.categoryIdx ?? -1);
      if (!cat) return invalid(lang);
      const name = lang === "en" ? cat.nameEn : cat.nameSw;
      const items = publishedContent(data, cat.slug);
      if (items.length === 0) {
        return { kind: "CON", text: `${name}\n\n${t(lang, "noContent")}\n\n${t(lang, "back")}` };
      }
      const lines = items.map(
        (c, i) => `${i + 1}. ${lang === "en" ? c.titleEn : c.titleSw}`,
      );
      return { kind: "CON", text: `${name}\n${lines.join("\n")}\n${t(lang, "back")}` };
    }

    case 4: {
      const cat = categoryOf(data, s.categoryIdx ?? -1);
      const items = cat ? publishedContent(data, cat.slug) : [];
      const item = items[s.contentIdx ?? -1];
      if (!cat || !item) return invalid(lang);
      const title = lang === "en" ? item.titleEn : item.titleSw;
      const body = lang === "en" ? item.bodyEn : item.bodySw;
      return { kind: "CON", text: `${title}\n\n${body}\n\n${t(lang, "back")}` };
    }

    case 5: {
      const counties = countiesOf(data);
      if (counties.length === 0) return { kind: "CON", text: `${t(lang, "noContent")}\n\n${t(lang, "back")}` };
      const lines = counties.map((c, i) => `${i + 1}. ${c}`);
      return { kind: "CON", text: `${t(lang, "chooseCounty")}\n${lines.join("\n")}\n${t(lang, "back")}` };
    }

    case 6: {
      const counties = countiesOf(data);
      const county = counties[s.countyIdx ?? -1];
      if (!county) return invalid(lang);
      const list = data.providers
        .filter((p) => p.county === county)
        .sort((a, b) => a.name.localeCompare(b.name));
      const lines = list.map((p, i) => `${i + 1}. ${p.name}`);
      return {
        kind: "CON",
        text: `${t(lang, "facilitiesIn", { county })}\n${lines.join("\n")}\n${t(lang, "back")}`,
      };
    }

    case 7: {
      const counties = countiesOf(data);
      const county = counties[s.countyIdx ?? -1];
      const list = county
        ? data.providers.filter((p) => p.county === county).sort((a, b) => a.name.localeCompare(b.name))
        : [];
      const provider = list[s.providerIdx ?? -1];
      if (!provider) return invalid(lang);
      return {
        kind: "CON",
        text: `${provider.name}\n${provider.location}\n${t(lang, "services")}: ${provider.services}\n${t(lang, "phone")}: ${provider.phone}\n\n${t(lang, "back")}`,
      };
    }

    case 8:
      return { kind: "CON", text: t(lang, "reminders") };

    case 9: {
      if (!s.reminderType) return invalid(lang);
      return {
        kind: "CON",
        text: t(lang, "reminderConfirm", { type: reminderTypeLabel(lang, s.reminderType) }),
      };
    }

    default:
      return invalid(lang);
  }
}

/** Walk one input segment; returns null to keep walking, or a terminal screen. */
function step(data: UssdData, s: WalkState, seg: string): UssdScreen | null {
  const n = Number(seg);
  const isNum = seg !== "" && Number.isInteger(n);

  switch (s.depth) {
    case 0: // language
      if (seg === "1") { s.lang = "en"; s.depth = 1; return null; }
      if (seg === "2") { s.lang = "sw"; s.depth = 1; return null; }
      return invalid(null);

    case 1: // consent
      if (seg === "1") { s.depth = 2; return null; }
      if (seg === "2") {
        return { kind: "END", text: t(s.lang ?? "en", "consentExit") };
      }
      return invalid(s.lang);

    case 2: { // main menu
      if (!isNum) return invalid(s.lang);
      if (n === 0) return { kind: "END", text: t(s.lang!, "exit") };
      if (n >= 1 && n <= data.categories.length) { s.categoryIdx = n - 1; s.depth = 3; return null; }
      if (n === 6) { s.depth = 5; return null; }
      if (n === 7) { s.depth = 8; return null; }
      return invalid(s.lang);
    }

    case 3: { // category menu
      if (!isNum) return invalid(s.lang);
      if (n === 0) { s.depth = 2; return null; }
      const cat = categoryOf(data, s.categoryIdx ?? -1);
      const count = cat ? publishedContent(data, cat.slug).length : 0;
      if (n >= 1 && n <= count) { s.contentIdx = n - 1; s.depth = 4; return null; }
      return invalid(s.lang);
    }

    case 4: // content item
      if (!isNum) return invalid(s.lang);
      if (n === 0) { s.depth = 3; s.contentIdx = null; return null; }
      return invalid(s.lang);

    case 5: { // counties
      if (!isNum) return invalid(s.lang);
      if (n === 0) { s.depth = 2; return null; }
      if (n >= 1 && n <= countiesOf(data).length) { s.countyIdx = n - 1; s.depth = 6; return null; }
      return invalid(s.lang);
    }

    case 6: { // facilities in county
      if (!isNum) return invalid(s.lang);
      if (n === 0) { s.depth = 5; s.countyIdx = null; return null; }
      const counties = countiesOf(data);
      const county = counties[s.countyIdx ?? -1];
      const count = county ? data.providers.filter((p) => p.county === county).length : 0;
      if (n >= 1 && n <= count) { s.providerIdx = n - 1; s.depth = 7; return null; }
      return invalid(s.lang);
    }

    case 7: // facility detail
      if (!isNum) return invalid(s.lang);
      if (n === 0) { s.depth = 6; s.providerIdx = null; return null; }
      return invalid(s.lang);

    case 8: { // reminders menu
      if (!isNum) return invalid(s.lang);
      if (n === 0) { s.depth = 2; return null; }
      if (n === 1 || n === 2) {
        s.reminderType = n === 1 ? "immunization" : "clinic_visit";
        s.depth = 9;
        return null;
      }
      return invalid(s.lang);
    }

    case 9: { // reminder confirm
      if (!isNum) return invalid(s.lang);
      if (n === 1) {
        return {
          kind: "END",
          text: t(s.lang!, "reminderSaved", { type: reminderTypeLabel(s.lang!, s.reminderType!) }),
          action: { type: "create_reminder", reminderType: s.reminderType! },
        };
      }
      if (n === 0) { s.depth = 8; s.reminderType = null; return null; }
      return invalid(s.lang);
    }

    default:
      return invalid(s.lang);
  }
}

/**
 * Run the USSD session for a full input path.
 * `dryRun` keeps the engine pure (simulator): the action flag is still
 * returned so callers can decide whether to persist it.
 */
export function runUssd(data: UssdData, text: string): UssdScreen {
  const segments = text.split("*").filter((seg) => seg !== "");
  const state: WalkState = {
    lang: null,
    depth: 0,
    categoryIdx: null,
    contentIdx: null,
    countyIdx: null,
    providerIdx: null,
    reminderType: null,
  };

  for (const seg of segments) {
    const terminal = step(data, state, seg);
    if (terminal) return terminal;
  }
  return render(data, state);
}
