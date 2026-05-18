import { NextResponse } from "next/server";

import { buildBreakdownPrompt } from "@/features/planner/prompts";
import { BreakdownOutputSchema, PlannerInputSchema } from "@/features/planner/schemas";
import { generateGeminiJson } from "@/lib/ai";

export const runtime = "nodejs";

export async function POST(request: Request) {
    try {
        const json = (await request.json()) as unknown;
        const input = PlannerInputSchema.parse(json);

        try {
            const prompt = buildBreakdownPrompt(input);
            const breakdown = await generateGeminiJson(prompt, BreakdownOutputSchema);
            return NextResponse.json(breakdown);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Terjadi kesalahan pada breakdown.";
            return NextResponse.json({ error: message }, { status: 500 });
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Terjadi kesalahan pada breakdown.";
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
