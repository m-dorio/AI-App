"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Brain, TrendingUp, Loader2, FileText, BarChart3 } from "lucide-react"

type ActionType = "summarize" | "sentiment" | "embed"

export default function Page() {
  const [text, setText] = useState("")
  const [action, setAction] = useState<ActionType>("summarize")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function analyze() {
    setLoading(true)
    setResult(null)
    const resp = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, text }),
    })
    const json = await resp.json()
    setResult(json)
    setLoading(false)
  }

  const actions = [
    {
      id: "summarize" as ActionType,
      label: "Summarize",
      description: "Generate concise summaries",
      icon: FileText,
    },
    {
      id: "sentiment" as ActionType,
      label: "Sentiment",
      description: "Analyze emotional tone",
      icon: TrendingUp,
    },
    {
      id: "embed" as ActionType,
      label: "Embed",
      description: "Generate vector embeddings",
      icon: BarChart3,
    },
  ]

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Analysis</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-balance">
            Text Analysis
            <span className="block text-primary mt-2">Made Simple</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Leverage advanced AI models to summarize, analyze sentiment, and generate embeddings from your text data
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Input Card */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Input Text
              </CardTitle>
              <CardDescription>Enter or paste the text you want to analyze</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your text here... You can include paragraphs, CSV data, or any content you'd like to analyze."
                className="min-h-[200px] resize-none text-base"
              />
            </CardContent>
          </Card>

          {/* Action Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {actions.map((item) => {
              const Icon = item.icon
              const isSelected = action === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setAction(item.id)}
                  className={`relative p-6 rounded-lg border-2 transition-all text-left ${isSelected
                      ? "border-primary bg-primary/5 shadow-lg shadow-primary/20"
                      : "border-border bg-card hover:border-primary/50 hover:bg-card/80"
                    }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-lg ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{item.label}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary animate-pulse" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Analyze Button */}
          <div className="flex justify-center">
            <Button
              onClick={analyze}
              disabled={!text.trim() || loading}
              size="lg"
              className="px-8 py-6 text-lg font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Analyze Text
                </>
              )}
            </Button>
          </div>

          {/* Results */}
          {result && !result.error && (
            <Card className="border-2 border-primary/20 bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Analysis Results
                </CardTitle>
                <CardDescription>
                  Model: <span className="font-mono text-xs">{result.model}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.model.includes("bart-large-cnn") && result.data[0]?.summary_text && (
                  <div className="p-6 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-lg mb-2">Summary</h4>
                        <p className="text-foreground leading-relaxed">{result.data[0].summary_text}</p>
                      </div>
                    </div>
                  </div>
                )}

                {result.model.includes("distilbert") && result.data[0]?.[0] && (
                  <div className="p-6 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-3">Sentiment Analysis</h4>
                        <div className="flex items-center gap-4">
                          <span className="text-2xl font-bold text-primary">{result.data[0][0].label}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-muted-foreground">Confidence</span>
                              <span className="text-sm font-semibold">
                                {(result.data[0][0].score * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${result.data[0][0].score * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {result.model.includes("embed") && (
                  <div className="p-6 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-start gap-3">
                      <BarChart3 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-lg mb-2">Vector Embeddings</h4>
                        <p className="text-muted-foreground text-sm">
                          Generated {result.data?.length || 0} dimensional vector representation
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {result?.error && (
            <Card className="border-2 border-destructive/20 bg-destructive/5">
              <CardContent className="pt-6">
                <p className="text-destructive font-medium">Error: {result.error}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  )
}
