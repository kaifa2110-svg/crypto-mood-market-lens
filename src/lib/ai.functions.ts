import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  context: z.string().max(12000),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) }))
    .min(1)
    .max(20),
});

export const askPulser = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const { generateChatCompletion, GatewayError, RateLimitError, PaymentRequiredError } = await import(
      "@lovable.dev/ai-gateway"
    );
    try {
      const res = await generateChatCompletion({
        model: "openai/gpt-6.1-sol",
        messages: [
          {
            role: "system",
            content:
              "You are Crypto Pulser, a concise crypto market analyst inside the Crypto Mood Market Lens dashboard. Answer using ONLY the market data below. Quote money in the user's selected currency exactly as given. Reply in plain text with no markdown (no asterisks or # headings). Keep answers short (under 180 words), use '• ' bullets when helpful, and add a one-line 'not financial advice' note when giving opinions.\n\nMARKET DATA:\n" +
              data.context,
          },
          ...data.messages,
        ],
      });
      const text = res.choices[0]?.message?.content;
      return { ok: true as const, text: typeof text === "string" && text ? text : "I couldn't come up with an answer." };
    } catch (e) {
      console.error("askPulser failed", e);
      if (e instanceof RateLimitError) return { ok: false as const, error: "Too many questions right now — try again in a minute." };
      if (e instanceof PaymentRequiredError) return { ok: false as const, error: "AI credits have run out for this app." };
      if (e instanceof GatewayError) return { ok: false as const, error: "The AI assistant is unavailable right now." };
      return { ok: false as const, error: "Something went wrong. Please try again." };
    }
  });
