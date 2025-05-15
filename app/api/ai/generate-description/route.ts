import { generatePeddlerDescription as generateDescFromAIService } from "@/lib/ai/gemini"; // Renamed to avoid confusion
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { peddlerName, peddlerType } = await request.json();

        if (!peddlerName || !peddlerType) {
            return NextResponse.json(
                { error: "Missing peddlerName or peddlerType" },
                { status: 400 }
            );
        }

        // Call the original function from lib/ai/gemini.ts
        // The API key is accessed securely on the server-side here
        const description = await generateDescFromAIService(
            peddlerName,
            peddlerType
        );

        return NextResponse.json({ description });
    } catch (error: any) {
        console.error("Error in /api/ai/generate-description:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate description" },
            { status: 500 }
        );
    }
} 