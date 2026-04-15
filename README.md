# 🧠 AI Fridge Assistant

An AI-powered web application that analyzes fridge or pantry images to identify ingredients and generate creative recipes instantly.

Built using a **multi-stage AI pipeline** combining computer vision and language models, with a robust fallback mechanism to ensure reliability even under API limits.

---

## 🚀 Features

- 📸 **Image-based Ingredient Detection**  
  Upload a photo of your fridge or pantry and automatically detect all visible ingredients.

- 🧾 **Automatic Classification**  
  Ingredients are categorized into:
  - Vegetarian
  - Non-Vegetarian

- 👨‍🍳 **AI Recipe Generation**  
  Generates multiple creative recipes using detected ingredients.

- 🔥 **Calorie Estimation**  
  Each recipe includes an estimated calorie count.

- ⚠️ **Manual Input Fallback**  
  If image analysis fails (e.g., API rate limits), users can manually enter ingredients and continue seamlessly.

- 🎯 **Modern UI/UX**
  - Smooth animations
  - Expandable recipe cards
  - Dark/Light mode toggle

---

## 🧠 Architecture Overview

The system is designed as a **multi-step AI pipeline**:


Image Upload
↓
Gemini Vision API (Ingredient Extraction)
↓
Groq LLM (Recipe + Calories Generation)
↓
Frontend Rendering



---

## 🔍 Core Components

### 1️⃣ Image Analysis — Gemini API

- Uses **Google Gemini Vision API**
- Takes an image as input and extracts:
  - Ingredients
  - Vegetarian items
  - Non-vegetarian items

- Designed to return **strict JSON output** for reliable parsing

---

### 2️⃣ Recipe Generation — Groq API

- Uses **Groq (Mixtral model)**
- Takes ingredient list as input
- Generates:
  - Recipe names
  - Step-by-step instructions
  - Estimated calorie values

- Optimized with structured prompts for consistent output

---

### 3️⃣ Fallback System — Manual Input

To handle real-world API limitations:

- If Gemini fails (e.g., **rate limit / 429 error**):
  - User is prompted to manually enter ingredients
  - Input is processed and sent directly to Groq
  - Recipes are generated without interruption

👉 This ensures the app **never blocks the user experience**

---

## ⚙️ Tech Stack

### Frontend
- React (Next.js App Router)
- TypeScript
- Inline styling (custom UI design)

### Backend / APIs
- Google Gemini API (Vision)
- Groq API (LLM)

---

⚠️ Known Limitations
Gemini API may hit rate limits (429) on free tier
Image recognition depends on image quality
Calorie values are AI-estimated (not exact nutritional data)