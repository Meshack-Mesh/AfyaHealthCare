/**
 * Server-only helper that calls the Lovable AI Gateway to draft bilingual
 * USSD health content. Never import from client code or route files.
 */
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, Output, NoObjectGeneratedError, type ModelMessage } from "ai";
import { z } from "zod";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
} from "./run-id";

export const generatedContentSchema = z.object({
  titleEn: z.string(),
  titleSw: z.string(),
  bodyEn: z.string(),
  bodySw: z.string(),
});

const SYSTEM_INSTRUCTIONS = `You draft patient-education content for AfyaCare, a USSD health self-care service in Kenya (dial *384*52621#). Content is read on a basic phone over USSD or SMS, so it must be short and plain.

Rules:
- Write simple, plain language that any adult can understand. Short sentences. No markdown, no emojis, no headings.
- Title: at most 60 characters, in both languages.
- Body: 2 to 5 short sentences, 120 to 480 characters, in both languages.
- The Kiswahili must be natural Kenyan standard Swahili, not a word-for-word translation.
- If the input is a topic, write general self-care guidance for it. If the input is source text, base the content faithfully on that text.
- Where relevant, include when to seek urgent care at a health facility.
- Never diagnose, never give medicine dosages, never name specific brands.
- Return only the requested fields.`;

export interface GeneratedUssdContent {
  titleEn: string;
  titleSw: string;
  bodyEn: string;
  bodySw: string;
}

function clamp(value: string, max: number) {
  return value.trim().slice(0, max);
}

export async function generateUssdContent(
  request: Request,
  input: { source: string; categoryName: string },
): Promise<GeneratedUssdContent> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) {
    throw new Error("AI is not configured on the server (missing API key).");
  }

  const runIdFetch = createLovableAiGatewayRunIdFetch(
    getLovableAiGatewayRunId(request),
  );
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  const messages: ModelMessage[] = [
    {
      role: "user",
      content: `Health topic area: ${input.categoryName}\n\nTopic or source text:\n${input.source}`,
    },
  ];

  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    instructions: SYSTEM_INSTRUCTIONS,
    messages,
    abortSignal: request.signal,
    maxRetries: 0,
    output: Output.object({ schema: generatedContentSchema }),
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "medium",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  try {
    const output = await result.output;
    return {
      titleEn: clamp(output.titleEn, 120),
      titleSw: clamp(output.titleSw, 120),
      bodyEn: clamp(output.bodyEn, 2000),
      bodySw: clamp(output.bodySw, 2000),
    };
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      throw new Error(
        "The model could not format the content correctly. Try rephrasing the topic or source text.",
      );
    }
    throw error;
  }
}
