# 🧠 Text & Image AI Analyzer

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)
![HuggingFace](https://img.shields.io/badge/Hugging%20Face-Models-yellow?style=for-the-badge&logo=huggingface)

A modern, AI-powered web application that analyzes **text and images** using state-of-the-art Hugging Face models.

**[Live Demo](#)** • [Features](#-features) • [Quick Start](#-quick-start) • [Usage](#-usage)

</div>

---

## 🚀 Overview

**Text & Image AI Analyzer** is a full-featured web app built on Next.js 14 that lets you:

- Analyze and summarize text  
- Detect emotional sentiment  
- Generate meaningful embeddings  
- Caption uploaded images  
- Create short stories from prompts with GPT-style creativity  

It uses multiple Hugging Face models under the hood, complete with retry logic and graceful fallbacks for free-tier model warmups.

> 🧠 *Note: Some features run on free-tier Hugging Face models, so initial requests may take a few seconds to warm up.*

---

## ✨ Features

| Feature | Description | Model Used |
|----------|--------------|------------|
| 🧩 Smart Summarization | Generate concise summaries from long documents | `facebook/bart-large-cnn` |
| 💬 Sentiment Analysis | Detect emotional tone and polarity | `distilbert-base-uncased-finetuned-sst-2-english` |
| 🔢 Vector Embeddings | Create numerical vector representations for ML | `sentence-transformers/all-MiniLM-L6-v2` |
| 🖼️ Image Captioning | Generate natural-language captions from uploaded images | `nlpconnect/vit-gpt2-image-captioning` |
| ✍️ AI Story Generator | Generate creative text stories using GPT-2 | `gpt2` with fallback models |
| 🔄 Retry Logic | Automatically retries if a model is warming up | Built-in API resilience |
| 🎨 Modern UI | Responsive, minimal, and visually clean | Tailwind CSS + shadcn/ui |
| 🔐 Type Safety | Full TypeScript integration | TypeScript 5.0 |

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Icons:** Lucide React
- **AI Integration:** Hugging Face Inference API
- **Deployment:** Vercel-ready
- **Image Handling:** Next/Image optimization

---

## ⚙️ Architecture Highlights

- Unified API routes for `/api/analyze`, `/api/caption`, and `/api/storyteller`
- Automatic retry mechanism for 503 (model loading) errors
- Componentized UI with clear separation of analysis tools
- Support for multiple model fallbacks (e.g., `gpt2`, `distilgpt2`, `EleutherAI/gpt-neo`)

---

## 📦 Quick Start

### Prerequisites
- Node.js 18+
- Hugging Face API key ([get one for free](https://huggingface.co/settings/tokens))
- Git

### Installation

```bash
git clone <your-repo-url>
cd text-analysis-ai
npm install
