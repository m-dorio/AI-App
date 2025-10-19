"use client"

import { useState, useRef } from "react"
import Image from 'next/image';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Brain, TrendingUp, Loader2, FileText, Upload, ImageIcon, X } from "lucide-react"
import {
  BookOpen,      // 📖 Open book icon (Story Generator)
  Wand2,         // 🪄 Magic wand (Generate Story button)
  Copy,          // 📋 Copy to clipboard
  RefreshCw      // 🔄 Refresh/reset icon
} from "lucide-react"

type ActionType = "summarize" | "sentiment" | "embed"

// Define proper types for the API response
interface SummaryResult {
  summary_text: string;
}

interface SentimentResult {
  label: string;
  score: number;
}

interface StoryResult {
  generated_text: string;
}

type AnalysisResult = {
  model: string;
  data:
  | { summary_text: string }[] // For summarize
  | SentimentResult[][] // For sentiment  
  | number[] // For embeddings
  | { caption: string } // For image captioning
  | StoryResult[] // For story generation
  ;
  status?: number;
  error?: string;
};

export default function Page() {
  // Text Analysis State
  const [text, setText] = useState("")
  const [action, setAction] = useState<ActionType>("summarize")
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)

  // Image Captioning State
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [caption, setCaption] = useState("")
  const [imageLoading, setImageLoading] = useState(false)
  const [imageError, setImageError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Story Generator State
  const [prompt, setPrompt] = useState("")
  const [generatedStory, setGeneratedStory] = useState("")
  const [storyLoading, setStoryLoading] = useState(false)
  const [storyError, setStoryError] = useState("")
  const [copySuccess, setCopySuccess] = useState(false)
  const [maxLength, setMaxLength] = useState(200)
  const [temperature, setTemperature] = useState(0.7)

  // Text Analysis Function with Retry Logic
  async function analyzeWithRetry(retryCount = 0) {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 10000; // 10 seconds

    setLoading(true)
    setResult(null)

    try {
      const resp = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, text }),
      })
      const json = await resp.json()

      // Check if we got a 503 (model loading) and should retry
      if (json.error && (resp.status === 503 || json.error.includes('loading') || json.error.includes('timed out')) && retryCount < MAX_RETRIES) {
        setResult({
          error: `Model is loading... Retrying in 10 seconds (Attempt ${retryCount + 1}/${MAX_RETRIES})`,
          model: '',
          data: []
        })

        // Wait and retry
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
        return analyzeWithRetry(retryCount + 1)
      }

      setResult(json)
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : 'An error occurred',
        model: '',
        data: []
      })
    } finally {
      setLoading(false)
    }
  }

  // Wrapper function for button onClick
  const analyze = () => {
    analyzeWithRetry(0)
  }

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file)

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      setCaption('')
      setImageError('')
    } else {
      setImageError('Please select a valid image file')
    }
  }

  // Generate Caption Function with Retry Logic
  const generateCaptionWithRetry = async (retryCount = 0) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 10000; // 10 seconds

    if (!selectedImage) {
      setImageError('Please upload an image first')
      return
    }

    setImageLoading(true)
    setImageError('')
    setCaption('')

    try {
      const formData = new FormData()
      formData.append('image', selectedImage)

      const response = await fetch('/api/caption', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      // Check if we got a 503 (model loading) and should retry
      if (result.error && (response.status === 503 || result.error.includes('loading') || result.error.includes('timed out')) && retryCount < MAX_RETRIES) {
        setImageError(`Model is loading... Retrying in 10 seconds (Attempt ${retryCount + 1}/${MAX_RETRIES})`)

        // Wait and retry
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
        return generateCaptionWithRetry(retryCount + 1)
      }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate caption')
      }

      if (result && result.data && result.data.caption) {
        setCaption(result.data.caption)
        setImageError('')
      } else {
        setImageError('Unexpected response format from API')
      }
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Failed to generate caption')
    } finally {
      setImageLoading(false)
    }
  }

  // Wrapper function for button onClick
  const generateCaption = () => {
    generateCaptionWithRetry(0)
  }

  // Reset Image Function
  const resetImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setCaption('')
    setImageError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Story Generation Functions
  const storyStarters = [
    "Once upon a time in a magical forest,",
    "The spaceship landed on an unknown planet and",
    "Detective Sarah opened the mysterious letter that read:",
    "In the year 2150, humans discovered",
    "The old bookstore had a secret room where"
  ]

  const generateStoryWithRetry = async (retryCount = 0) => {
    const MAX_RETRIES = 3
    const RETRY_DELAY = 10000

    if (!prompt.trim()) {
      setStoryError('Please enter a story prompt to get started')
      return
    }

    setStoryLoading(true)
    setStoryError('')
    setGeneratedStory('')
    setCopySuccess(false)

    try {
      const response = await fetch('/api/storyteller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          maxLength,
          temperature
        }),
      })

      const result = await response.json()

      // Check if we got a 503 (model loading) and should retry
      if (result.error && (response.status === 503 || result.error.includes('loading') || result.error.includes('timed out')) && retryCount < MAX_RETRIES) {
        setStoryError(`Model is loading... Retrying in 10 seconds (Attempt ${retryCount + 1}/${MAX_RETRIES})`)

        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
        return generateStoryWithRetry(retryCount + 1)
      }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate story')
      }

      if (result && result.data && result.data[0] && result.data[0].generated_text) {
        setGeneratedStory(result.data[0].generated_text)
        setStoryError('')
      } else {
        setStoryError('Unexpected response format from API')
      }
    } catch (err) {
      setStoryError(err instanceof Error ? err.message : 'Failed to generate story')
    } finally {
      setStoryLoading(false)
    }
  }

  const generateStory = () => {
    generateStoryWithRetry(0)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedStory)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error("Clipboard copy failed:", err)
      setStoryError("Failed to copy to clipboard")
    }
  }

  const resetStoryGenerator = () => {
    setPrompt('')
    setGeneratedStory('')
    setStoryError('')
    setCopySuccess(false)
  }

  // const { startStory } = useStoryStarter();

  const handleStoryStarter = (starter: string): void => {
    setPrompt(starter)
    setGeneratedStory('')
    setStoryError('')
  }

  // const useStoryStarter = (starter: string) => {
  //   setPrompt(starter)
  //   setGeneratedStory('')
  //   setStoryError('')
  // }

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
  ]

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center md:items-center gap-20 mb-12">
          {/* Left Column (Image & Name Link) */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4 ">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/30 hover:bg-primary/40 text-primary text-sm font-medium mb-12">
              <a href="https://michaelangelodorio.com" title="Visit my portfolio">
                <span>michaelangelodorio</span>
              </a>
            </div>
            <a target="_blank" href="https://www.linkedin.com/in/michael-angelo-dorio-17510182/" title="Let's Connect!">
              <Image
                src="/images/about-image2b-sm.png"
                alt="About me"
                width={140}
                height={140}
                className="object-cover rounded-full border-2 border-primary"
                priority
              /></a>
          </div>

          {/* Right Column (Text Content) */}
          <div className="flex-1 text-center md:text-left space-y-4">

            <div className="flex gap-2.5 w-full  mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/40 text-primary text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                <span>Text Analysis</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/40 text-primary text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                <span>Image Captioning</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/40 text-primary text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                <span>Story Generator</span>
              </div>
            </div>
            <h1 className="text-5xl md:text-4xl font-bold tracking-tight text-balance">
              AI Tools
              <span className="block text-primary mt-2">Made Simple</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl text-pretty">
              Leverage advanced AI models to analyze text and images using state-of-the-art machine learning techniques.
            </p>
          </div>
        </div>

        <div className="space-y-6 mb-20">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg">About Image Captioning</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm leading-relaxed">
                This project integrates multiple APIs and open-source frameworks to deliver intelligent insights, including caption generation, content understanding, and contextual analysis. (Some tools currently run on free-tier services, which may affect processing time or model availability.)</p>
            </CardContent>
          </Card>
        </div>

        {/* TEXT ANALYSIS SECTION */}
        <div className="space-y-6 mb-20">

          <div className="flex items-center gap-2 mb-6">
            <Brain className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Text Analysis</h2>
          </div>
          {/* Input Card */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                {/* Summarization */}
                {(result.model.includes("bart") || result.model.includes("distilbart")) && Array.isArray(result.data) && (
                  <div className="p-6 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-lg mb-2">Summary</h4>
                        <p className="text-foreground leading-relaxed">{(result.data[0] as SummaryResult)?.summary_text}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sentiment Analysis */}
                {result.model.includes("distilbert") && Array.isArray(result.data) && (
                  <div className="p-6 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-3">Sentiment Analysis</h4>
                        <div className="flex items-center gap-4">
                          <span className="text-2xl font-bold text-primary">{(result.data[0] as SentimentResult[])?.[0]?.label}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-muted-foreground">Confidence</span>
                              <span className="text-sm font-semibold">
                                {((result.data[0] as SentimentResult[])?.[0]?.score * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${((result.data[0] as SentimentResult[])?.[0]?.score * 100) || 0}%` }}
                              />
                            </div>
                          </div>
                        </div>
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

        {/* IMAGE CAPTIONING SECTION */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-6">
            <ImageIcon className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Image Captioning</h2>
          </div>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" />
                Upload Image
              </CardTitle>
              <CardDescription>Upload an image and let AI generate a descriptive caption</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />

              {/* Upload Area or Image Preview */}
              {!imagePreview ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 hover:border-primary/50 hover:bg-accent/50 transition-all group"
                >
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4 group-hover:text-primary transition-colors" />
                  <p className="text-foreground font-medium">
                    Click to upload an image
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Supports JPG, PNG, GIF, and more
                  </p>
                </button>
              ) : (
                <div className="relative">
                  <div className="relative w-full h-96 rounded-lg border-2 border-border overflow-hidden bg-muted">
                    <Image
                      src={imagePreview}
                      alt="Uploaded preview"
                      fill
                      className="object-contain"
                    />
                  </div>
                  {/* Remove Image Button */}
                  <Button
                    onClick={resetImage}
                    variant="destructive"
                    size="icon"
                    className="absolute top-4 right-4 rounded-full shadow-lg"
                    title="Remove image"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              )}

              {/* Generate Caption Button */}
              {imagePreview && (
                <Button
                  onClick={generateCaption}
                  disabled={imageLoading}
                  size="lg"
                  className="w-full"
                >
                  {imageLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating Caption...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Caption
                    </>
                  )}
                </Button>
              )}

              {/* Error Display */}
              {imageError && (
                <Card className="border-2 border-destructive/20 bg-destructive/5">
                  <CardContent className="pt-6">
                    <p className="text-destructive font-medium">{imageError}</p>
                  </CardContent>
                </Card>
              )}

              {/* Caption Display */}
              {caption && (
                <Card className="border-2 border-primary/20 bg-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Generated Caption
                    </CardTitle>
                    <CardDescription>
                      Model: <span className="font-mono text-xs">nlpconnect/vit-gpt2-image-captioning</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="p-6 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-foreground text-lg leading-relaxed">
                        &ldquo;{caption}&rdquo;
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Info Section */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg">About Image Captioning</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Our AI uses state-of-the-art vision-language models to understand images
                and generate natural language descriptions. It can recognize objects,
                scenes, and context to create accurate captions.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* AI STORY GENERATOR SECTION */}
        <div className="space-y-6 mt-24">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">AI Story Generator</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Left Column - Input & Controls */}
            <div className="md:col-span-1 space-y-6">
              {/* Prompt Input Card */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Story Prompt</CardTitle>
                  <CardDescription>Start your creative story</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Start your story... (e.g., 'In a world where magic exists,')"
                    className="min-h-[128px] resize-none"
                  />

                  {/* Generate Button */}
                  <Button
                    onClick={generateStory}
                    disabled={storyLoading || !prompt.trim()}
                    className="w-full"
                  >
                    {storyLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5 mr-2" />
                        Generate Story
                      </>
                    )}
                  </Button>

                  {/* Reset Button */}
                  {(prompt || generatedStory) && (
                    <Button
                      onClick={resetStoryGenerator}
                      variant="outline"
                      className="w-full"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Settings Card */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Generation Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Max Length Slider */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Story Length: {maxLength} tokens
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="500"
                      value={maxLength}
                      onChange={(e) => setMaxLength(Number(e.target.value))}
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Short</span>
                      <span>Long</span>
                    </div>
                  </div>

                  {/* Temperature Slider */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Creativity: {temperature.toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(Number(e.target.value))}
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Focused</span>
                      <span>Creative</span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Higher creativity = more surprising results
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Output & Suggestions */}
            <div className="md:col-span-2 space-y-6">
              {/* Generated Story Display */}
              {generatedStory && (
                <Card className="border-2 border-primary/20 bg-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Your Generated Story
                      </CardTitle>
                      <Button
                        onClick={copyToClipboard}
                        variant="secondary"
                        size="sm"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        {copySuccess ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                    <CardDescription>
                      Model: <span className="font-mono text-xs">gpt2</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="p-6 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                        {generatedStory}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Error Display */}
              {storyError && (
                <Card className="border-2 border-destructive/20 bg-destructive/5">
                  <CardContent className="pt-6">
                    <p className="text-destructive font-medium">{storyError}</p>
                    {storyError.includes('loading') && (
                      <p className="text-destructive/80 text-sm mt-2">
                        The model needs a moment to warm up. It will retry automatically.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Story Starters Card */}
              {!generatedStory && !storyLoading && (
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle>Need Inspiration? Try These Starters:</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {storyStarters.map((starter, index) => (
                      <button
                        key={index}
                        onClick={() => handleStoryStarter(starter)}
                        className="w-full text-left px-4 py-3 bg-primary/5 hover:bg-primary/10 rounded-lg transition-all border border-primary/20 hover:border-primary/40"
                      >
                        <p className="text-foreground">{starter}</p>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Info Card */}
              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    About GPT-2
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm leading-relaxed">
                    GPT-2 is a powerful language model developed by OpenAI. It`s trained
                    on millions of web pages and can generate surprisingly coherent and
                    creative text continuations.
                  </p>
                  <p className="text-sm leading-relaxed">
                    <strong>Pro tip:</strong> Start with a clear, descriptive prompt.
                    The more context you provide, the better the story will be!
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}