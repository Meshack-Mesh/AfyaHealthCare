import { createServerFn } from "@tanstack/react-start";
import { runUssd } from "@/lib/ussd/engine";
import { loadUssdData } from "@/lib/ussd/data";

/**
 * Public, unauthenticated server function powering the on-page USSD
 * simulator. Read-only: it loads published content through the public
 * client and never writes sessions, users or reminders.
 */
export const simulateUssd = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const parsed = input as { text?: string };
    const text = typeof parsed?.text === "string" ? parsed.text : "";
    if (text.split("*").length > 12) throw new Error("Session too long");
    return { text: text.replace(/[^0-9*]/g, "") };
  })
  .handler(async ({ data }) => {
    const ussdData = await loadUssdData();
    return runUssd(ussdData, data.text);
  });
