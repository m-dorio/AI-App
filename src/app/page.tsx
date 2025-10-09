'use client';
import { useState } from 'react';

export default function Page() {
  const [text, setText] = useState('');
  const [action, setAction] = useState<'summarize' | 'sentiment' | 'embed'>('summarize');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function analyze() {
    setLoading(true);
    setResult(null);
    const resp = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, text })
    });
    const json = await resp.json();
    setResult(json);
    setLoading(false);
  }

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Tiny AI Analyzer</h1>
      <textarea value={text} onChange={e => setText(e.target.value)}
        className="w-full h-40 border p-2 mb-3" placeholder="Paste text or CSV rows..." />
      <div className="flex gap-2 mb-3">
        <select value={action} onChange={e => setAction(e.target.value as any)} className="p-2 border">
          <option value="summarize">Summarize</option>
          <option value="sentiment">Sentiment</option>
          <option value="embed">Embed (vectors)</option>
        </select>
        <button onClick={analyze} className="px-4 py-2 bg-slate-800 text-white rounded">
          {loading ? 'Working…' : 'Analyze'}
        </button>
      </div>
      {result && !result.error && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          {result.model.includes('bart-large-cnn') && (
            <p className="font-medium text-gray-700">
              🧾 Summary: {result.data[0]?.summary_text}
            </p>
          )}
          {result.model.includes('distilbert') && (
            <p className="font-medium text-gray-700">
              💬 Sentiment: {result.data[0][0]?.label} ({(result.data[0][0]?.score * 100).toFixed(1)}%)
            </p>
          )}
        </div>
      )}

    </main>
  );
}
