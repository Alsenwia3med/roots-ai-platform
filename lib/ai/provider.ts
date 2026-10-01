import { AI_CONFIG } from "./config";
import { parseNarrative } from "./schema";
import type { GovernedNarrative, NarrativeProjection } from "./schema";

export interface AiProvider {
  complete(input: NarrativeProjection, signal: AbortSignal): Promise<unknown>;
}

/** Server-only OpenAI adapter. The key is read from the runtime secret, never configuration. */
export function createOpenAIProvider(apiKey = process.env.OPENAI_API_KEY): AiProvider | undefined {
  if (!apiKey) return undefined;
  return {
    async complete(input, signal) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        signal,
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: AI_CONFIG.DEFAULT_MODEL,
          temperature: AI_CONFIG.temperature,
          max_tokens: AI_CONFIG.max_tokens,
          store: AI_CONFIG.store,
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: JSON.stringify(input) }],
        }),
      });
      if (!response.ok) throw new Error(`AI provider returned ${response.status}`);
      const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const content = payload.choices?.[0]?.message?.content;
      if (!content) throw new Error("AI provider returned no content");
      return JSON.parse(content);
    },
  };
}

export async function callProvider(provider: AiProvider, input: NarrativeProjection): Promise<GovernedNarrative> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_CONFIG.timeoutMs);
  try {
    return parseNarrative(await provider.complete(input, controller.signal));
  } finally {
    clearTimeout(timer);
  }
}
