# 🧊 Fridge Intelligence AI

An advanced, fault-tolerant kitchen assistant that utilizes a multi-LLM pipeline to transform food photography into actionable recipes. Built with a high-end "A24 Indie" aesthetic and engineered for reliability.

---

## 🛠 Technical Specs

* **Framework**: Next.js 15 (App Router)
* **Primary Vision**: Google Gemini 1.5 Flash (Image-to-JSON)
* **Secondary Vision (Fallback)**: Groq Llama 4 Scout 17B (Vision-to-JSON)
* **Recipe Engine**: Groq Llama 3.3 70B (Text-to-Structured-Recipes)
* **Language**: TypeScript
* **Architecture**: Distributed Multi-LLM Pivot (Fail-Soft System)

---

## 🚀 Key Features

### 📸 1. Image-based Ingredient Detection
The user photographs their fridge or pantry. The image is processed first by **Google Gemini 1.5 Flash**. It identifies all visible food items and categorizes them into `Vegetarian` and `Non-Vegetarian` groups.

### 👨‍🍳 2. Intelligent Recipe Generation
Once ingredients are identified, the app utilizes **Groq Llama 3.3** via an LPU™ (Language Processing Unit) to generate creative recipes in milliseconds, providing instant culinary inspiration.

### 🔄 3. Automated Fallback (Smart Pivot)
To handle API rate limits, the system triggers a **"Smart Pivot"** to **Groq Llama 4 Scout** if Gemini fails. The UI notifies the user: *"Gemini is busy. Shifting to Groq Intelligence..."* ensuring 99.9% uptime.

### ✍️ 4. Manual Input Last-Resort
If all image processing fails, a **Manual Entry Mode** allows users to add ingredients as interactive chips, ensuring the app is always functional.

---

## 🎨 Design Philosophy
Inspired by **A24 Indie Romance** aesthetics, the UI features:
* **Cinematic Typography**: Bold Syne headers for a "movie poster" feel.
* **Dynamic Theming**: Interactive Dark/Light mode with customized glow effects and stardust overlays.
* **Micro-interactions**: Subtle hover states, progress tracking, and animated entry transitions.

---

## ⚙️ Setup

1. **Environment Variables**: Create a `.env.local` file.
   ```bash
   GEMINI_API_KEY=your_key_here
   GROQ_API_KEY=your_key_here
