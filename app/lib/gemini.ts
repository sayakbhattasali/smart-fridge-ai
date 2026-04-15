// ─── Gemini API Integration ───────────────────────────────────────────────────
import { cleanAndParse } from "./parser";
import { AnalysisResult } from "./types";

export const analyzeImageWithGemini = async (
  base64Data: string,
  apiKey: string
): Promise<AnalysisResult> => {
  if (!apiKey) {
    throw new Error("API key not configured. Add NEXT_PUBLIC_GEMINI_API_KEY to .env.local");
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Analyze this fridge/pantry image and return ONLY valid JSON.

Format:
{
  "ingredients": ["every item"],
  "veg": ["plant-based only"],
  "nonVeg": ["meat, eggs, fish only"]
}

Rules:
- Chicken, meat, fish, eggs → MUST be in nonVeg
- Vegetables, fruits, grains, dairy → veg
- Do NOT include recipes
- Return ONLY JSON
`,
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Data.split(",")[1],
                },
              },
            ],
          },
        ],
      }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error("API Error:", errorText);
    throw new Error(`API Error: ${errorText}`);
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    console.error("Failed to parse API response:", err);
    throw new Error("Invalid API response format");
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    console.error("No text extracted from API response:", data);
    throw new Error("No valid response text from API");
  }

  return cleanAndParse(text);
};
