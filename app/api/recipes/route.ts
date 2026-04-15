import { NextRequest, NextResponse } from "next/server";

interface Recipe {
  name: string;
  description: string;
  servings: string;
  cookTime: string;
  difficulty: string;
  ingredients: string[];
  steps: string[];
}

const callGroqRecipes = async (
  ingredients: string[],
  apiKey: string
): Promise<string> => {
  const ingredientList = ingredients.join(", ");

  const prompt = `Generate exactly 3 recipes using these ingredients: ${ingredientList}

For each recipe, provide ONLY valid JSON in this format:
{
  "recipes": [
    {
      "name": "Recipe Name",
      "description": "Brief 1-sentence description",
      "servings": "2-4",
      "cookTime": "30 mins",
      "difficulty": "Easy|Medium|Hard",
      "ingredients": ["ingredient 1", "ingredient 2"],
      "steps": ["Step 1", "Step 2", "Step 3"]
    }
  ]
}

Requirements:
- Must return valid JSON only, no markdown, no extra text
- Each recipe must have 3-5 steps
- 3 recipes total
- Use ONLY ingredients from the provided list`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Groq API error: ${errorData.error?.message || "Unknown error"}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

const cleanAndParse = (text: string): { ok: boolean; data?: any; error?: string } => {
  try {
    // Remove markdown code blocks if present
    let cleaned = text.replace(/```json\n?/g, "").replace(/```/g, "");

    // Find JSON object
    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}");

    if (jsonStart === -1 || jsonEnd === -1) {
      return {
        ok: false,
        error: "No JSON found in response",
      };
    }

    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);

    // Fix common JSON issues
    // Remove trailing commas
    cleaned = cleaned.replace(/,(\s*[}\]])/g, "$1");

    const parsed = JSON.parse(cleaned);
    return { ok: true, data: parsed };
  } catch (err: any) {
    console.error("[PARSE_ERROR]", err.message);
    return {
      ok: false,
      error: err.message,
    };
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ingredients } = body;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json(
        {
          error: "INVALID_INPUT",
          details: "Ingredients array is required and must not be empty",
        },
        { status: 400 }
      );
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json(
        {
          error: "MISSING_API_KEYS",
          details: "Server configuration error: GROQ_API_KEY not set",
        },
        { status: 500 }
      );
    }

    console.log("[GROQ] Generating recipes for", ingredients.length, "ingredients");

    // Call Groq for recipes
    const groqResponse = await callGroqRecipes(ingredients, groqApiKey);
    console.log("[GROQ] Raw response length:", groqResponse.length);

    // Parse Groq response
    const parseResult = cleanAndParse(groqResponse);

    if (!parseResult.ok) {
      console.error("[GROQ_PARSE] Failed:", parseResult.error);
      return NextResponse.json(
        {
          error: "GROQ_PARSE_FAILED",
          details: parseResult.error,
        },
        { status: 500 }
      );
    }

    const recipes: Recipe[] = parseResult.data.recipes || [];

    console.log("[API] Recipe generation complete:", recipes.length, "recipes");

    return NextResponse.json({
      recipes,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[API_ERROR]", error.message);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
