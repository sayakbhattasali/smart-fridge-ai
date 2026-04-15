// ─── Groq API Integration (Fallback) ───────────────────────────────────────────
import { AnalysisResult } from "./types";
import { cleanAndParse } from "./parser";

export const analyzeWithGroq = async (
  base64Data: string,
  apiKey: string
): Promise<AnalysisResult> => {
  if (!apiKey) {
    throw new Error("Groq API key not configured");
  }

  const res = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768", // Fast fallback model
        messages: [
          {
            role: "user",
            content: `You are a culinary AI. Based on common kitchen ingredients, analyze and return STRICT JSON only.

Format:
{
  "ingredients": ["list", "of", "items"],
  "veg": ["vegetarian", "items"],
  "nonVeg": ["non-vegetarian", "items"],
  "recipes": [
    {
      "name": "Recipe Name",
      "calories": 350,
      "steps": ["Step 1", "Step 2", "Step 3"]
    }
  ]
}

Rules:
- You MUST include "calories" for EVERY recipe
- Classify ingredients strictly:
  - "veg" MUST contain ONLY plant-based items (vegetables, fruits, grains, dairy)
  - "nonVeg" MUST contain meat, chicken, fish, eggs
- Chicken MUST ALWAYS be classified as nonVeg
- Do NOT put any meat item in veg
- If classification is wrong, the response is INVALID
- "calories" MUST be a number (no text)
- If any recipe is missing calories, the entire response is INVALID
- Calories must be between 200 and 800
- Return ONLY JSON
- No explanation

Common ingredients to consider: vegetables, fruits, proteins, grains, dairy, oils, spices based on typical kitchen inventory.`,
          },
        ],
        temperature: 0.2,
        max_tokens: 1024,
      }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Groq API Error:", errorText);
    throw new Error(`Groq API failed: ${errorText}`);
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    console.error("Failed to parse Groq response:", err);
    throw new Error("Invalid Groq API response format");
  }

  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    console.error("No text extracted from Groq response:", data);
    throw new Error("No valid response text from Groq");
  }

  return cleanAndParse(text);
};
