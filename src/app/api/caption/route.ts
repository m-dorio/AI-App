// src/app/api/caption/route.ts

import { NextResponse } from 'next/server';

const HF_API_KEY = process.env.HF_API_KEY!;

// Free models for image captioning (in order of reliability)
const CAPTION_MODELS = [
    'nlpconnect/vit-gpt2-image-captioning',
    'Salesforce/blip-image-captioning-base',
    'Salesforce/blip-image-captioning-large',
    'microsoft/git-base-coco',
    'microsoft/git-large-coco',
    'Salesforce/blip2-flan-t5-base',
    'Salesforce/blip2-flan-t5-xl',
    'ydshieh/vit-gpt2-coco-en',
    'flax-community/vit-gpt2-coco',
    'IDEA-Research/grounded-sam',
    'openflamingo/OpenFlamingo-9B',
    'liuhaotian/llava-v1.5-7b',
    'gpt2',
];


export async function POST(req: Request) {
    try {
        const contentType = req.headers.get('content-type') || '';

        if (!contentType.includes('multipart/form-data')) {
            return NextResponse.json(
                { error: 'Invalid content type. Expected multipart/form-data' },
                { status: 400 }
            );
        }

        const formData = await req.formData();
        const image = formData.get('image') as File;

        if (!image) {
            return NextResponse.json(
                { error: 'Missing image file' },
                { status: 400 }
            );
        }

        // Validate file is an image
        if (!image.type.startsWith('image/')) {
            return NextResponse.json(
                { error: 'Invalid file type. Please upload an image' },
                { status: 400 }
            );
        }

        const imageBuffer = await image.arrayBuffer();

        // Try each model until one succeeds
        for (let i = 0; i < CAPTION_MODELS.length; i++) {
            const model = CAPTION_MODELS[i];
            console.log(`[Attempt ${i + 1}/${CAPTION_MODELS.length}] Trying model: ${model}`);

            const result = await generateCaptionWithModel(model, imageBuffer);

            if (result.success && result.caption) {
                return NextResponse.json({
                    success: true,
                    caption: result.caption,
                    model,
                    status: 200
                });
            }

            console.log(`Model(Free Tier) ${model} failed, trying next...`);
        }

        // All models failed
        return NextResponse.json(
            {
                success: false,
                error: 'All captioning models are currently unavailable (Free Tier). Please try again later.',
                attempted_models: CAPTION_MODELS
            },
            { status: 503 }
        );
    } catch (err: unknown) {
        console.error('Server error:', err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

async function generateCaptionWithModel(
    model: string,
    imageBuffer: ArrayBuffer
): Promise<{ success: boolean; caption?: string }> {
    try {
        const apiUrl = `https://api-inference.huggingface.co/models/${model}`;

        const res = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_API_KEY}`,
            },
            body: imageBuffer,
        });

        // Skip unavailable models
        if (res.status === 404 || res.status === 503 || res.status === 504) {
            console.log(`Model ${model} returned ${res.status}`);
            return { success: false };
        }

        if (!res.ok) {
            const errorText = await res.text();
            console.error(`Model ${model} error (${res.status}):`, errorText.substring(0, 100));
            return { success: false };
        }

        const responseText = await res.text();

        // Check for loading messages
        if (responseText.includes('loading') || responseText.includes('estimated_time')) {
            console.log(`Model ${model} is loading`);
            return { success: false };
        }

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error(`Failed to parse response from ${model}:`, e);
            return { success: false };
        }

        // Extract caption from various response formats
        let caption: string | null = null;

        // Format 1: BLIP models return [{ generated_text: "..." }]
        if (Array.isArray(data) && data[0]?.generated_text) {
            caption = data[0].generated_text;
        }
        // Format 2: Some models return direct string
        else if (typeof data === 'string') {
            caption = data;
        }
        // Format 3: Other models might return [{ caption: "..." }]
        else if (Array.isArray(data) && data[0]?.caption) {
            caption = data[0].caption;
        }

        if (caption && caption.trim()) {
            console.log(`✓ Success with ${model}: "${caption.substring(0, 50)}..."`);
            return { success: true, caption };
        }

        return { success: false };
    } catch (err) {
        console.error(`Error with model ${model}:`, err);
        return { success: false };
    }
}