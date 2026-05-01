# 🧊 Fridge Intelligence AI

An advanced, fault-tolerant kitchen assistant that utilizes a multi-LLM pipeline to transform food photography into actionable recipes. Designed with a high-end "A24 Indie" aesthetic and built for performance and reliability.

---

## 🌐 Live Demo

[🚀 Visit Smart Fridge AI](https://smart-fridge-ai-orcin.vercel.app)

---

## 🛠 Technical Specs

- **Framework**: Next.js 15 (App Router)
- **Primary Vision**: Google Gemini 1.5 Flash (Image-to-JSON)
- **Secondary Vision (Fallback)**: Groq Llama 4 Scout 17B (Vision-to-JSON)
- **Recipe Engine**: Groq Llama 3.3 70B (Text-to-Structured-Recipes)
- **Language**: TypeScript
- **Styling**: Inline CSS-in-JS (Instrument Sans & Syne Typography)
- **Architecture**: Distributed Multi-LLM Pivot (Fail-Soft System)

---

## 🚀 How It Works: Step-by-Step

### 1. Primary Analysis (Gemini Vision)
The user photographs their fridge or pantry. The image is processed first by **Google Gemini 1.5 Flash**, which identifies ingredients and categorizes them into `Vegetarian` and `Non-Vegetarian`.

### 2. Intelligent Recipe Generation (Groq)
The ingredient list is passed to **Groq Llama 3.3**, generating structured recipes in milliseconds using Groq's LPU™.

### 3. Automated Fallback (Groq Vision)
If Gemini fails or is rate-limited, the system performs a **Smart Pivot** to **Groq Llama 4 Scout**, ensuring uninterrupted functionality.

### 4. Manual Input Last-Resort
If image processing fails, users can manually enter ingredients as chips, ensuring the app always remains usable.

---

## 🚀 Key Features

- 📸 Image-based ingredient detection  
- ⚡ Instant AI-powered recipe generation  
- 🔄 Smart fallback system for high reliability  
- ✍️ Manual ingredient input mode  
- 📱 Fully responsive mobile-first UI  

---

## 🎨 Design Philosophy

Inspired by **A24 Indie Romance aesthetics**, the UI features:

- **Cinematic Typography** – Bold Syne headers for a cinematic feel  
- **Dynamic Theming** – Dark/Light mode with glow effects  
- **Micro-interactions** – Smooth animations and premium UI behavior  

---

## ⚙️ Setup

1. Create a `.env.local` file:

```bash
GEMINI_API_KEY=your_key_here
GROQ_API_KEY=your_key_here
````

2. Install dependencies:

```bash
npm install
```

3. Run the app:

```bash
npm run dev
```

---

## 📌 Latest Update

**Improved mobile responsiveness**

* Better hero text scaling
* Responsive grid layout
* Redesigned stats section for mobile balance

```
```
