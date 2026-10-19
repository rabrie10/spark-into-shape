import { createOpenAI } from "@ai-sdk/openai";
import { Output, streamText, NoObjectGeneratedError } from "ai";
import type { z } from "zod";

const MODEL = "openai/gpt-6-astra";

function provider() {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured for this app yet.");
  return createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });
}

const providerOptions = {
  openai: {
    store: false,
    forceReasoning: true,
    reasoningEffort: "low",
    include: ["reasoning.encrypted_content"],
  },
};

export async function callText(system: string, user: string) {
  const result = streamText({
    model: provider().responses(MODEL),
    system,
    messages: [{ role: "user", content: user }],
    maxRetries: 0,
    providerOptions,
  });
  return await result.text;
}

export async function callObject<T>(system: string, user: string, schema: z.ZodType<T>): Promise<T | null> {
  const result = streamText({
    model: provider().responses(MODEL),
    system,
    messages: [{ role: "user", content: user }],
    maxRetries: 0,
    output: Output.object({ schema }),
    providerOptions,
  });
  try {
    return (await result.output) as T;
  } catch (e) {
    if (NoObjectGeneratedError.isInstance(e)) return null;
    throw e;
  }
}
