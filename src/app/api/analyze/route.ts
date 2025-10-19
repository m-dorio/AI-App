// src/app/api/analyze/route.ts

import { NextResponse } from 'next/server';

const HF_API_KEY = process.env.HF_API_KEY;

// Text analysis models only
const TEXT_MODELS = {
    summarize: 'sshleifer/distilbart-cnn-12-6',
    sentiment: 'distilbert/distilbert-base-uncased-finetuned-sst-2-english',
    embed: 'sentence-transformers/paraphrase-albert-small-v2',
} as const;

type TextAction = keyof typeof TEXT_MODELS;

export async function POST(req: Request) {
    try {
        const contentType = req.headers.get('content-type') || '';

        if (!contentType.includes('application/json')) {
            return NextResponse.json(
                { error: 'Invalid content type. Use application/json for text analysis.' },
                { status: 400 }
            );
        }

        console.log('📝 Handling text analysis request');
        return await handleTextAnalysis(req);

    } catch (err: unknown) {
        console.error('🔥 Server error:', err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

async function handleTextAnalysis(req: Request) {
    const { action, text } = await req.json();

    console.log('📥 Text analysis request:', { action, textLength: text?.length });

    if (!action || !text) {
        console.log('❌ Missing action or text');
        return NextResponse.json({ error: 'Missing action or text' }, { status: 400 });
    }

    const model = TEXT_MODELS[action as TextAction];
    if (!model) {
        console.log('❌ Invalid action:', action);
        return NextResponse.json(
            { error: `Invalid action. Must be one of: ${Object.keys(TEXT_MODELS).join(', ')}` },
            { status: 400 }
        );
    }

    // Validate text length
    if (text.length > 10000) {
        return NextResponse.json({ error: 'Text too long (max 10000 characters)' }, { status: 400 });
    }

    const apiUrl = `https://api-inference.huggingface.co/models/${model}`;

    const body = {
        inputs: text.trim(),
        options: {
            wait_for_model: true
        }
    };

    console.log(`🎯 Making request to: ${apiUrl}`);
    console.log('📦 Request body:', JSON.stringify(body).substring(0, 300));

    // Build headers
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // Add auth if API key is available
    if (HF_API_KEY) {
        headers['Authorization'] = `Bearer ${HF_API_KEY}`;
        console.log('🔑 Using API key for model:', model);
    } else {
        console.log('🔓 No API key available');
    }

    // Add timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
        const res = await fetch(apiUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
            signal: controller.signal
        });

        const responseText = await res.text();
        console.log('📨 API Response Status:', res.status);
        console.log('📄 API Response:', responseText.substring(0, 500));

        if (!res.ok) {
            console.error('❌ HuggingFace API error:', responseText);

            if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<html')) {
                if (res.status === 504) {
                    return NextResponse.json({
                        error: 'Model is loading or timed out. Please try again in 10-20 seconds.'
                    }, { status: 503 });
                }
                return NextResponse.json({
                    error: 'Service temporarily unavailable. Please try again.'
                }, { status: res.status });
            }

            return NextResponse.json({ error: responseText }, { status: res.status });
        }

        let data;
        try {
            data = JSON.parse(responseText);
            console.log('✅ Successfully parsed response data');
        } catch (e) {
            console.error('❌ Failed to parse response:', e);
            return NextResponse.json({
                error: 'Invalid response from API. Model may be loading.'
            }, { status: 500 });
        }

        console.log('🎉 Text analysis completed successfully for model:', model);
        return NextResponse.json({ model, data, status: 200 });

    } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
            console.error('⏰ Request timeout');
            return NextResponse.json({
                error: 'Request timeout - model is loading or responding slowly. Please try again.'
            }, { status: 408 });
        }
        console.error('🔥 Fetch error:', err);
        throw err;
    } finally {
        clearTimeout(timeout);
    }
}