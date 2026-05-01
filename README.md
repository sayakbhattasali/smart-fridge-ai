<<<<<<< HEAD
# 🧊 Fridge Intelligence AI

An advanced, fault-tolerant kitchen assistant that utilizes a multi-LLM pipeline to transform food photography into actionable recipes. Built with a high-end "A24 Indie" aesthetic and engineered for reliability.
=======
content = """# Fridge Intelligence AI 🧊🧠

An advanced, fault-tolerant kitchen assistant that utilizes a multi-LLM pipeline to transform food photography into actionable recipes. Designed with a high-end "A24 Indie" aesthetic and built for sub-second performance.
>>>>>>> eb0cf2f (Improved mobile responsiveness)

---

## 🛠 Technical Specs

<<<<<<< HEAD
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
=======
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
The user photographs their fridge or pantry. The image is processed first by **Google Gemini 1.5 Flash**. It identifies all visible food items and categorizes them into `Vegetarian` and `Non-Vegetarian` groups, outputting a clean JSON object.

### 2. Intelligent Recipe Generation (Groq)
Once the ingredients are identified, the app passes the ingredient list to the **Groq Llama 3.3** model. Leveraging Groq's LPU™ (Language Processing Unit), recipes are generated in milliseconds, providing instant culinary inspiration.

### 3. Automated Fallback (Groq Vision)
AI rate limits are a common point of failure. If the Gemini API is busy or fails, the system triggers a **"Smart Pivot"** to **Groq Llama 4 Scout**. The frontend displays a notification: *"Gemini is busy. Shifting to Groq Intelligence..."* ensuring a seamless experience without user interruption.

### 4. Manual Input Last-Resort
If all image processing fails or the photo quality is too poor for AI detection, the app provides a **Manual Entry Mode**. Users can add ingredients as interactive "chips," ensuring the recipe generation feature is always accessible.
>>>>>>> eb0cf2f (Improved mobile responsiveness)

---

## 🎨 Design Philosophy
Inspired by **A24 Indie Romance** aesthetics, the UI features:
<<<<<<< HEAD
* **Cinematic Typography**: Bold Syne headers for a "movie poster" feel.
* **Dynamic Theming**: Interactive Dark/Light mode with customized glow effects and stardust overlays.
* **Micro-interactions**: Subtle hover states, progress tracking, and animated entry transitions.
=======
- **Cinematic Typography**: Bold Syne headers for a "movie poster" feel.
- **Dynamic Theming**: An interactive Dark/Light mode toggle with customized glow effects and stardust overlays.
- **Micro-interactions**: Subtle hover states, progress tracking, and animated entry transitions for a premium software feel.
>>>>>>> eb0cf2f (Improved mobile responsiveness)

---

## ⚙️ Setup

1. **Environment Variables**: Create a `.env.local` file.
   ```bash
   GEMINI_API_KEY=your_key_here
<<<<<<< HEAD
   GROQ_API_KEY=your_key_here
=======
   GROQ_API_KEY=your_key_here
>>>>>>> eb0cf2f (Improved mobile responsiveness)
