// ─── JSON Parser ──────────────────────────────────────────────────────────────
import { AnalysisResult } from "./types";

export const cleanAndParse = (text: string): AnalysisResult => {
  try {
    if (!text || typeof text !== "string") {
      console.error("Invalid text input:", text);
      return { raw: "Invalid text format received from API" };
    }

    let cleaned = text
      .replace(/```json|```/g, "")
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleaned) {
      console.error("Empty text after cleaning");
      return { raw: "Received empty response from API" };
    }

    // 🔥 Fix common JSON issues
    cleaned = cleaned
      .replace(/,\s*}/g, "}") // trailing comma in object
      .replace(/,\s*]/g, "]") // trailing comma in array
      .replace(/"\s+"/g, '","'); // missing commas between strings

    const parsed = JSON.parse(cleaned);

    // Validate the parsed result has expected fields
    if (!parsed.ingredients && !parsed.recipes && !parsed.veg && !parsed.nonVeg) {
      console.warn("Warning: Parsed JSON missing expected fields:", parsed);
    }

    return {
      ingredients: parsed.ingredients || [],
      veg: parsed.veg || [],
      nonVeg: parsed.nonVeg || [],
      recipes: (parsed.recipes || []).map((r: any) => ({
        name: typeof r.name === "string" ? r.name.trim() : "Unnamed Recipe",
        steps: Array.isArray(r.steps)
          ? r.steps.map((s: any) => String(s))
          : [],
        calories: typeof r.calories === "number" ? r.calories : undefined
      }))
    };
  } catch (err) {
    console.error("JSON Parse Error:", err);
    console.error("Original text:", text);
    return { raw: `Parse error: ${err instanceof Error ? err.message : "Unknown error"}` };
  }
};
