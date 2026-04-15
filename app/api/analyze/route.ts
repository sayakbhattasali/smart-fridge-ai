import { NextResponse } from "next/server";

// ─── STEP 1: CALL GEMINI (INGREDIENTS ONLY) ────────────────────────────────────
const callGemini = async (base64Data: string, apiKey: string): Promise<string> => {
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
                text: `Analyze this fridge image and return STRICT JSON only.

{
  "ingredients": ["all items"],
  "veg": ["veg only"],
  "nonVeg": ["non-veg only"]
}

Do NOT include recipes.`,
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Data,
                },
              },
            ],
          },
        ],
      }),
    }
  );

  if (!res.ok) {
    const err = new Error(`Gemini API failed: ${res.status}`) as any;
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("No response from Gemini");
  }

  return text;
};

// ─── STEP 1b: CALL GROQ VISION (FALLBACK for ingredients) ───────────────────
const callGroqVision = async (base64Data: string, apiKey: string): Promise<string> => {
  const res = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this fridge/pantry image and return ONLY valid JSON.

Format:
{
  "ingredients": ["every visible item"],
  "veg": ["plant-based only: vegetables, fruits, grains, dairy"],
  "nonVeg": ["meat, chicken, fish, eggs, seafood only"]
}

Rules:
- Chicken, meat, fish, eggs → MUST be in nonVeg
- Vegetables, fruits, grains, dairy (milk, cheese, butter, paneer) → veg
- Do NOT include recipes
- Return ONLY JSON, no extra text`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Data}`,
                },
              },
            ],
          },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error("[GROQ-VISION] API error:", errorText);
    throw new Error(`Groq Vision API failed: ${res.status}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("No response from Groq Vision");
  }

  return text;
};

// ─── STEP 2: CALL GROQ (RECIPES ONLY) ──────────────────────────────────────────
const callGroqRecipes = async (
  ingredients: string[],
  apiKey: string
): Promise<string> => {
  const res = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: `Given these ingredients:

${ingredients.join(", ")}

Generate STRICT JSON:

{
  "ingredients": ["all", "items", "listed"],
  "veg": ["only plant-based: vegetables, fruits, grains, dairy, oils, spices"],
  "nonVeg": ["only animal-based: meat, chicken, fish, eggs, seafood"],
  "recipes": [
    {
      "name": "",
      "calories": 350,
      "steps": ["step1", "step2"]
    }
  ]
}

Rules:
- Classify ingredients strictly:
  - "veg" = ONLY plant-based items (vegetables, fruits, grains, dairy, oils, spices)
  - "nonVeg" = meat, chicken, fish, eggs, seafood, prawns
  - Chicken, eggs, fish are ALWAYS nonVeg
  - Milk, cheese, butter, paneer are veg (dairy)
- You MUST include "calories" for EVERY recipe
- "calories" MUST be a number (no text)
- Calories must be between 200 and 800
- 3 recipes. 3-5 steps each.
No extra text.`,
          },
        ],
        temperature: 0.7,
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Groq API failed: ${res.status}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("No response from Groq");
  }

  return text;
};

// ─── PARSE & VALIDATE JSON ────────────────────────────────────────────────────────
const cleanAndParse = (text: string): { ok: boolean; data?: any; error?: string } => {
  try {
    let cleaned = text
      .replace(/```json|```/g, "")
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    cleaned = cleaned
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
      .replace(/"\s+"/g, '","');

    const parsed = JSON.parse(cleaned);
    return { ok: true, data: parsed };
  } catch (err) {
    return { ok: false, error: `Parse failed: ${err instanceof Error ? err.message : "Unknown"}` };
  }
};

// ─── MAIN API HANDLER ──────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { image, ingredients, mode } = await req.json();

    // Validate inputs based on mode
    if (!mode || mode === "full") {
      if (!image) {
        return NextResponse.json({ error: "MISSING_IMAGE" }, { status: 400 });
      }
    } else if (mode === "gemini-only") {
      if (!image) {
        return NextResponse.json({ error: "MISSING_IMAGE" }, { status: 400 });
      }
    } else if (mode === "groq-only") {
      if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
        return NextResponse.json(
          { error: "MISSING_INGREDIENTS", details: "Ingredients array required for groq-only mode" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "INVALID_MODE", details: "Mode must be 'full', 'gemini-only', or 'groq-only'" },
        { status: 400 }
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    if (!geminiKey || !groqKey) {
      return NextResponse.json(
        { error: "MISSING_API_KEYS" },
        { status: 500 }
      );
    }

    // 🔵 MODE: GEMINI ONLY (test ingredient extraction)
    if (mode === "gemini-only") {
      console.log("[TEST] Gemini-only mode");
      try {
        const geminiText = await callGemini(image, geminiKey);
        const parsed = cleanAndParse(geminiText);

        return NextResponse.json(
          {
            mode: "gemini-only",
            raw: geminiText,
            parsed: parsed.ok ? parsed.data : null,
            error: parsed.ok ? null : parsed.error,
            provider: "gemini",
            timestamp: new Date().toISOString(),
          },
          { status: parsed.ok ? 200 : 500 }
        );
      } catch (err: any) {
        console.error("[GEMINI-TEST]", err.message);
        return NextResponse.json(
          { mode: "gemini-only", error: err.message, provider: "gemini" },
          { status: 500 }
        );
      }
    }

    // 🟢 MODE: GROQ ONLY (test recipe generation)
    if (mode === "groq-only") {
      console.log("[TEST] Groq-only mode with", ingredients.length, "ingredients");
      try {
        const groqText = await callGroqRecipes(ingredients, groqKey);
        const parsed = cleanAndParse(groqText);

        return NextResponse.json(
          {
            mode: "groq-only",
            raw: groqText,
            parsed: parsed.ok ? parsed.data : null,
            error: parsed.ok ? null : parsed.error,
            provider: "groq",
            timestamp: new Date().toISOString(),
          },
          { status: parsed.ok ? 200 : 500 }
        );
      } catch (err: any) {
        console.error("[GROQ-TEST]", err.message);
        return NextResponse.json(
          { mode: "groq-only", error: err.message, provider: "groq" },
          { status: 500 }
        );
      }
    }

    // 🔄 MODE: FULL PIPELINE (default)
    console.log("[API] Starting full pipeline analysis");

    // 🧠 STEP 1: Try Gemini → ingredients (with Groq Vision fallback)
    let extractedIngredients: string[];
    let veg: string[];
    let nonVeg: string[];
    let usedFallback = false;

    console.log("[GEMINI] Analyzing image...");
    try {
      const geminiText = await callGemini(image, geminiKey);
      const parsedGemini = cleanAndParse(geminiText);

      if (!parsedGemini.ok) {
        console.error("[GEMINI] Failed to parse:", parsedGemini.error);
        throw new Error("GEMINI_PARSE_FAILED");
      }

      extractedIngredients = parsedGemini.data.ingredients || [];
      veg = parsedGemini.data.veg || [];
      nonVeg = parsedGemini.data.nonVeg || [];
      console.log(`[GEMINI] ✅ Extracted ${extractedIngredients.length} ingredients`);
    } catch (geminiErr: any) {
      // ─── AUTOMATIC FALLBACK: Groq Vision (Llama 4 Scout) ───
      console.warn(`[GEMINI] ❌ Failed (${geminiErr.message}). Falling back to Groq Vision...`);
      usedFallback = true;

      try {
        const groqVisionText = await callGroqVision(image, groqKey);
        const parsedGroqVision = cleanAndParse(groqVisionText);

        if (!parsedGroqVision.ok) {
          console.error("[GROQ-VISION] Failed to parse:", parsedGroqVision.error);
          return NextResponse.json(
            { error: "GROQ_VISION_PARSE_FAILED", details: parsedGroqVision.error },
            { status: 500 }
          );
        }

        extractedIngredients = parsedGroqVision.data.ingredients || [];
        veg = parsedGroqVision.data.veg || [];
        nonVeg = parsedGroqVision.data.nonVeg || [];
        console.log(`[GROQ-VISION] ✅ Extracted ${extractedIngredients.length} ingredients via fallback`);
      } catch (groqVisionErr: any) {
        console.error("[GROQ-VISION] ❌ Fallback also failed:", groqVisionErr.message);
        return NextResponse.json(
          { error: "BOTH_VISION_FAILED", details: "Both Gemini and Groq Vision failed. Please enter ingredients manually." },
          { status: 500 }
        );
      }
    }

    // 🧠 STEP 2: Groq → recipes
    console.log("[GROQ] Generating recipes...");
    const groqText = await callGroqRecipes(extractedIngredients, groqKey);
    const parsedGroq = cleanAndParse(groqText);

    if (!parsedGroq.ok) {
      console.error("[GROQ] Failed to parse:", parsedGroq.error);
      return NextResponse.json(
        {
          error: "GROQ_PARSE_FAILED",
          details: parsedGroq.error,
          ingredients: extractedIngredients,
          veg,
          nonVeg,
          usedFallback,
        },
        { status: 500 }
      );
    }

    console.log(`[GROQ] ✅ Generated ${parsedGroq.data.recipes.length} recipes`);

    // 🧠 STEP 3: Merge results
    const finalResponse = {
      ingredients: extractedIngredients,
      veg,
      nonVeg,
      recipes: parsedGroq.data.recipes,
      usedFallback,
      provider: usedFallback ? "groq-vision+groq" : "gemini+groq",
      timestamp: new Date().toISOString(),
    };

    console.log(`[API] ✅ Pipeline completed successfully${usedFallback ? " (via Groq Vision fallback)" : ""}`);
    return NextResponse.json(finalResponse, { status: 200 });
  } catch (err: any) {
    console.error("[API] ❌ Error:", err.message);
    return NextResponse.json(
      { error: err.message || "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: "Smart Fridge Analysis API",
      endpoint: "POST /api/analyze",
      modes: {
        "full (default)": {
          description: "Complete pipeline: Gemini → ingredients, then Groq → recipes",
          body: { image: "base64_string" },
          returns: "ingredients, veg, nonVeg, recipes"
        },
        "gemini-only": {
          description: "Test Gemini ingredient extraction only",
          body: { image: "base64_string", mode: "gemini-only" },
          returns: "raw gemini response + parsed ingredients"
        },
        "groq-only": {
          description: "Test Groq recipe generation only (no image needed)",
          body: { ingredients: ["potato", "onion"], mode: "groq-only" },
          returns: "raw groq response + parsed recipes"
        }
      },
      example_gemini_only: `POST /api/analyze { "image": "...", "mode": "gemini-only" }`,
      example_groq_only: `POST /api/analyze { "ingredients": ["tomato", "basil"], "mode": "groq-only" }`,
    },
    { status: 200 }
  );
}

