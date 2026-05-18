import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import crypto from "crypto";

// Simple in-memory cache for development. In production, use Redis/DB.
const requestCache = new Map<string, { result: unknown; timestamp: number }>();
const CACHE_TTL_MS = 3600000; // 1 hour

function hashRequest(prompt: string): string {
    return crypto.createHash("md5").update(prompt).digest("hex");
}

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

async function executeWithRetry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Stop retrying if quota exceeded
            if (isGeminiQuotaError(error)) {
                throw error;
            }

            // Exponential backoff: 1s, 2s, 4s
            if (attempt < maxAttempts) {
                const delayMs = Math.pow(2, attempt - 1) * 1000;
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }

    throw lastError;
}

export async function generateGeminiJson<T>(
    prompt: string,
    schema: z.ZodType<T>,
): Promise<T> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error("GEMINI_API_KEY belum diatur di environment.");
    }

    // Check cache first
    const cacheKey = hashRequest(prompt);
    const cached = requestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.result as T;
    }

    const google = createGoogleGenerativeAI({ apiKey });

    const { object } = await executeWithRetry(async () => {
        return generateObject({
            model: google("gemini-2.5-flash"),
            prompt,
            schema,
            temperature: 0.2,
        });
    });

    // Cache successful result
    requestCache.set(cacheKey, { result: object, timestamp: Date.now() });

    return object;
}
