import { NextResponse } from 'next/server';

const HF_API_KEY = process.env.HF_API_KEY!;

const MODEL_MAP: Record<string, string> = {
    summarize: 'facebook/bart-large-cnn',
    sentiment: 'distilbert/distilbert-base-uncased-finetuned-sst-2-english',
    embed: 'sentence-transformers/all-MiniLM-L6-v2',
};

export async function POST(req: Request) {
    try {
        const { action, text } = await req.json();

        if (!action || !text) {
            return NextResponse.json({ error: 'Missing action or text' }, { status: 400 });
        }

        const model = MODEL_MAP[action];
        if (!model) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Prepare body for Hugging Face request
        const body =
            action === 'embed'
                ? { inputs: [text] }
                : { inputs: text };

        // Fetch from Hugging Face
        const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error('HuggingFace API error:', errorText);
            return NextResponse.json({ error: errorText }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json({ model, data, status: 200 });
    } catch (err: any) {
        console.error('Server error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
