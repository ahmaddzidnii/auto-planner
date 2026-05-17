import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";

function normalizeMessage(error: unknown): string {
    return error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
}

export function isGeminiQuotaError(error: unknown): boolean {
    const message = normalizeMessage(error);
    return (
        message.includes("quota") ||
        message.includes("rate limit") ||
        message.includes("resource_exhausted") ||
        message.includes("free_tier")
    );
}

export function shouldUseLocalFallback(error: unknown): boolean {
    if (process.env.FORCE_LOCAL_ESTIMATOR === "true") {
        return true;
    }

    const message = normalizeMessage(error);
    return isGeminiQuotaError(error) || message.includes("gemini_api_key belum diatur");
}

export async function generateGeminiJson<T>(
    prompt: string,
    schema: z.ZodType<T>,
): Promise<T> {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

    if (!apiKey) {
        throw new Error("GEMINI_API_KEY belum diatur di environment.");
    }

    const google = createGoogleGenerativeAI({ apiKey });

    const { object } = await generateObject({
        model: google(model),
        prompt,
        schema,
        temperature: 0.2,
    });

    return object;
}
