# 🧠 Text Analysis AI Tool

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)
![HuggingFace](https://img.shields.io/badge/Hugging%20Face-Models-yellow?style=for-the-badge&logo=huggingface)

A modern, AI-powered web application for analyzing text using state-of-the-art Hugging Face models.

**[Live Demo](#)** • [Features](#-features) • [Quick Start](#-quick-start) • [Usage](#-usage)

</div>

---

## 🚀 Overview

**Text Analysis AI Tool** is a powerful web app that leverages cutting-edge AI models to provide three essential text analysis capabilities:

- 📝 **Summarization** — Condense long texts into key points  
- 😊 **Sentiment Analysis** — Detect emotional tone and polarity  
- 🔢 **Vector Embeddings** — Generate numerical representations for ML  

Built with **Next.js 14**, featuring a modern, responsive interface powered by **Tailwind CSS** and **TypeScript**.

---

## ✨ Features

| Feature | Description | Model Used |
|----------|--------------|------------|
| 🧩 Smart Summarization | Generate concise summaries from long documents | `facebook/bart-large-cnn` |
| 💬 Accurate Sentiment | Analyze emotional tone with confidence scores | `distilbert-base-uncased-finetuned-sst-2-english` |
| 🔢 Vector Embeddings | Create numerical representations for ML applications | `sentence-transformers/all-MiniLM-L6-v2` |
| 🎨 Modern UI | Clean, responsive design with real-time feedback | Tailwind CSS + shadcn/ui |
| 🔐 Type Safety | Full TypeScript support for better development | TypeScript 5.0 |

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Icons:** Lucide React
- **AI API:** Hugging Face Inference API
- **Deployment:** Vercel-ready

---

## 📦 Quick Start

### Prerequisites
- Node.js 18+
- Hugging Face account (get your free API token)
- Git

### Installation

Clone the repository:

```bash
git clone <your-repo-url>
cd text-analysis-ai
