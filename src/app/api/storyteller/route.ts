// src/app/api/storyteller/route.ts

import { NextResponse } from "next/server";

const HF_API_KEY = process.env.HF_API_KEY;
if (!HF_API_KEY) {
    console.error("❌ Missing HF_API_KEY env var");
}

const FALLBACK_MODELS = [
    "gemini-2.5-flash",
    "distilgpt2",
    "EleutherAI/gpt-neo-125M",
    "facebook/opt-1.3b",
    "bigscience/bloom-560m",
    "gpt2",
    "mistralai/Mistral-7B-Instruct-v0.3",
    "mistralai/Mistral-Small-24B-Instruct-2501",
    "HuggingFaceH4/zephyr-7b-beta"
];

interface StoryRequest {
    prompt: string;
    maxLength?: number;
    temperature?: number;
}

export async function POST(req: Request) {
    try {
        const contentType = req.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
            return NextResponse.json(
                { error: "Invalid content type. Use application/json." },
                { status: 400 }
            );
        }

        const { prompt, maxLength = 200, temperature = 0.7 }: StoryRequest = await req.json();
        if (!prompt?.trim()) {
            return NextResponse.json({ error: "Missing story prompt" }, { status: 400 });
        }
        if (maxLength < 1 || maxLength > 1000) {
            return NextResponse.json({ error: "maxLength must be between 1 and 1000" }, { status: 400 });
        }
        if (temperature < 0.1 || temperature > 1.0) {
            return NextResponse.json({ error: "temperature must be between 0.1 and 1.0" }, { status: 400 });
        }

        // Try each model in sequence
        for (const modelId of FALLBACK_MODELS) {
            try {
                const apiUrl = `https://api-inference.huggingface.co/models/${modelId}`;
                console.log(`🔄 Attempting model: ${modelId}`);

                const body = {
                    inputs: prompt.trim(),
                    parameters: {
                        max_length: Math.min(maxLength, 500),
                        temperature: Math.max(0.1, Math.min(temperature, 1.0)),
                        top_p: 0.9,
                        do_sample: true,
                        return_full_text: true,
                        repetition_penalty: 1.1
                    },
                    options: {
                        wait_for_model: true
                    }
                };

                const res = await fetch(apiUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${HF_API_KEY}`
                    },
                    body: JSON.stringify(body)
                });

                const text = await res.text();
                console.log(`Model ${modelId} response status: ${res.status}`);
                // If non-ok, skip to next
                if (!res.ok) {
                    console.warn(`Model ${modelId} failed: ${text}`);
                    continue;
                }

                let data: unknown;
                try {
                    data = JSON.parse(text);
                } catch (parseErr) {
                    console.warn(`Model ${modelId} returned non-JSON:`, parseErr, text);
                    continue;
                }
                interface HuggingFaceResponseItem {
                    generated_text?: string;
                    [key: string]: unknown;
                }
                type HuggingFaceResponse = HuggingFaceResponseItem[];

                // Extract story
                const story =
                    Array.isArray(data) && (data as HuggingFaceResponse)[0]?.generated_text
                        ? (data as HuggingFaceResponse)[0].generated_text!
                        : JSON.stringify(data, null, 2);

                console.log(`✅ Model ${modelId} succeeded`);
                return NextResponse.json({ model: modelId, story }, { status: 200 });
            } catch (err) {
                console.warn(`Error while using model ${modelId}:`, err);
                // continue to next model
                continue;
            }
        }

        // If all models failed
        return NextResponse.json({ error: "All fallback models failed. Please try again later." }, { status: 503 });
    } catch (err: unknown) {
        console.error("🔥 Server error:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown server error";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
