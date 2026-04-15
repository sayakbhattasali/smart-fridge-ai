// ─── Type Definitions ─────────────────────────────────────────────────────────
export interface Recipe {
  name: string;
  steps: string[];
  calories?: number;
}

export interface AnalysisResult {
  ingredients?: string[];
  veg?: string[];
  nonVeg?: string[];
  recipes?: Recipe[];
  raw?: string;
}
