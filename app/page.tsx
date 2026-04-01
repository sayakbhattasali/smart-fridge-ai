"use client";

import { useState, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Recipe { name: string; steps: string[] }
interface AnalysisResult {
  ingredients?: string[];
  veg?: string[];
  nonVeg?: string[];
  recipes?: Recipe[];
  raw?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toBase64 = (file: File): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.readAsDataURL(file);
    r.onload = () => res(r.result as string);
    r.onerror = rej;
  });

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:           "#07090f",
  surface:      "rgba(255,255,255,0.045)",
  surfaceHover: "rgba(255,255,255,0.07)",
  border:       "rgba(255,255,255,0.08)",
  borderAmber:  "rgba(245,158,11,0.4)",
  amber:        "#f59e0b",
  amberDim:     "rgba(245,158,11,0.12)",
  amberGlow:    "rgba(245,158,11,0.25)",
  text:         "#e2e8f0",
  textMuted:    "#64748b",
  textDim:      "#94a3b8",
  emerald:      "#34d399",
  emeraldDim:   "rgba(52,211,153,0.15)",
  rose:         "#f87171",
  roseDim:      "rgba(248,113,113,0.15)",
};

// ─── Chip ─────────────────────────────────────────────────────────────────────
function Chip({ label, variant = "default" }: { label: string; variant?: "veg" | "nonveg" | "default" }) {
  const map = {
    veg:     { bg: C.emeraldDim, color: C.emerald,  border: "rgba(52,211,153,0.3)" },
    nonveg:  { bg: C.roseDim,    color: C.rose,     border: "rgba(248,113,113,0.3)" },
    default: { bg: "rgba(255,255,255,0.08)", color: C.text, border: C.border },
  };
  const t = map[variant];
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center",
        padding: "4px 12px", borderRadius: 999,
        fontSize: 12, fontWeight: 500,
        background: t.bg, color: t.color, border: `1px solid ${t.border}`,
        transition: "transform 0.15s, filter 0.15s", cursor: "default",
      }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "scale(1.06)"; el.style.filter = "brightness(1.15)"; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "scale(1)"; el.style.filter = "brightness(1)"; }}
    >
      {label}
    </span>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 20, padding: "20px 24px",
      display: "flex", flexDirection: "column", gap: 14,
      animation: "fadein 0.45s ease both",
      animationDelay: `${delay}ms`,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: C.textMuted }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// ─── Recipe Card ──────────────────────────────────────────────────────────────
function RecipeCard({ recipe, index }: { recipe: Recipe; index: number }) {
  const [open, setOpen] = useState(false);
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={() => setOpen(p => !p)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius: 14, overflow: "hidden", cursor: "pointer",
        border: `1px solid ${hov ? C.borderAmber : C.border}`,
        background: hov ? C.surfaceHover : "rgba(255,255,255,0.03)",
        transition: "border-color 0.2s, background 0.2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{
            width: 28, height: 28, borderRadius: "50%",
            background: C.amberDim, color: C.amber,
            fontSize: 11, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Syne', sans-serif",
          }}>
            {index + 1}
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{recipe.name}</span>
        </div>
        <svg
          style={{ width: 14, height: 14, color: C.textMuted, transition: "transform 0.25s", transform: open ? "rotate(180deg)" : "none", flexShrink: 0 }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {open && (
        <ol style={{ padding: "4px 18px 18px", borderTop: `1px solid ${C.border}`, paddingTop: 14, display: "flex", flexDirection: "column", gap: 10, listStyle: "none", margin: 0 }}>
          {recipe.steps.map((step, i) => (
            <li key={i} style={{ display: "flex", gap: 10, fontSize: 13, color: C.textDim }}>
              <span style={{ color: C.amber, fontWeight: 700, marginTop: 1, flexShrink: 0, fontFamily: "'Syne', sans-serif" }}>{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [image, setImage]     = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult]   = useState<AnalysisResult | null>(null);
  const [dragging, setDragging] = useState(false);
  const [btnHov, setBtnHov]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setImage(file); setPreview(URL.createObjectURL(file)); setResult(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const analyzeImage = async () => {
    if (!image) return;
    setLoading(true); setResult(null); setProgress(0);
    const iv = setInterval(() => setProgress(p => p < 82 ? p + Math.random() * 10 : p), 450);
    try {
      const base64 = await toBase64(image);
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API key not configured. Add NEXT_PUBLIC_GEMINI_API_KEY to .env.local");
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: `You are a world-class culinary AI. Analyze this fridge/pantry image and return ONLY valid JSON, no markdown fences.\n\n{"ingredients":["every item"],"veg":["veg only"],"nonVeg":["non-veg only"],"recipes":[{"name":"Dish","steps":["Step 1"]}]}\n\nSuggest 3-4 creative recipes. 3-6 steps each. Return ONLY JSON.` },
                { inline_data: { mime_type: "image/jpeg", data: base64.split(",")[1] } },
              ],
            }],
          }),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const cleanAndParse = (text: string) => {
  try {
    let cleaned = text
      .replace(/```json|```/g, "")
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // 🔥 Fix common JSON issues
    cleaned = cleaned
      .replace(/,\s*}/g, "}")   // trailing comma in object
      .replace(/,\s*]/g, "]")   // trailing comma in array
      .replace(/"\s+"/g, '","'); // missing commas between strings

    return JSON.parse(cleaned);
  } catch (err) {
    console.error("PARSE FAILED:", text);
    return { raw: text }; // fallback
  }
};
      setProgress(100);
      setTimeout(() => setResult(cleanAndParse(text)), 250);
    } catch (err: any) {
      setResult({ raw: err.message });
    } finally {
      clearInterval(iv); setLoading(false);
    }
  };

  const hasResults = !!(result && !result.raw);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Instrument+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { width: 100%; }
        body {
          width: 100%; min-height: 100vh;
          background: ${C.bg};
          font-family: 'Instrument Sans', sans-serif;
          color: ${C.text};
        }
        body::before {
          content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background:
            radial-gradient(ellipse 80% 45% at 50% -8%, rgba(245,158,11,0.08) 0%, transparent 65%),
            radial-gradient(ellipse 40% 30% at 85% 85%, rgba(52,211,153,0.04) 0%, transparent 55%);
        }
        @keyframes fadein {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner {
          display: inline-block; width: 16px; height: 16px; border-radius: 50%;
          border: 2px solid rgba(10,10,10,0.2); border-top-color: #0a0a0a;
          animation: spin 0.65s linear infinite;
        }
        .dropzone {
          border: 1.5px dashed rgba(255,255,255,0.12);
          border-radius: 16px;
          transition: border-color 0.2s, background 0.2s;
          cursor: pointer;
        }
        .dropzone:hover, .dropzone.drag { border-color: ${C.amber}; background: ${C.amberDim}; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>

      {/* Full-width root */}
      <div style={{ position: "relative", zIndex: 1, width: "100%", minHeight: "100vh" }}>
        {/* Centered constrained container */}
        <div style={{
          width: "100%",
          maxWidth: hasResults ? 1120 : 640,
          marginLeft: "auto",
          marginRight: "auto",
          padding: "52px 24px 64px",
          transition: "max-width 0.4s ease",
        }}>

          {/* ── Header ── */}
          <header style={{ textAlign: "center", marginBottom: 44, animation: "fadein 0.5s ease both" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
              color: C.amber, fontWeight: 600, marginBottom: 16,
            }}>
              <span style={{ width: 28, height: 1, background: C.amber, opacity: 0.5 }} />
              AI-Powered Kitchen Intelligence
              <span style={{ width: 28, height: 1, background: C.amber, opacity: 0.5 }} />
            </div>
            <h1 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "clamp(40px, 7vw, 66px)",
              fontWeight: 800,
              lineHeight: 1.05,
              color: "#fff",
              letterSpacing: "-0.02em",
            }}>
              Smart Fridge{" "}
              <span style={{ color: C.amber }}>Analyst</span>
            </h1>
            <p style={{ color: C.textMuted, fontSize: 14, marginTop: 12, lineHeight: 1.75 }}>
              Photograph your fridge or pantry — AI identifies every ingredient<br />and crafts creative recipes in seconds.
            </p>
          </header>

          {/* ── Grid: upload left, results right ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: hasResults ? "minmax(290px, 400px) 1fr" : "1fr",
            gap: 24,
            alignItems: "start",
          }}>

            {/* ═══ UPLOAD CARD ═══ */}
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 24, padding: 24,
              display: "flex", flexDirection: "column", gap: 18,
              animation: "fadein 0.5s ease 80ms both",
            }}>

              {/* Drop zone */}
              <div
                className={`dropzone${dragging ? " drag" : ""}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
              >
                {preview ? (
                  <div style={{ position: "relative" }}>
                    <img src={preview} alt="Preview" style={{
                      width: "100%", borderRadius: 14,
                      objectFit: "cover", maxHeight: 260, display: "block",
                    }} />
                    <div
                      style={{
                        position: "absolute", inset: 0, borderRadius: 14,
                        background: "rgba(0,0,0,0.52)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        opacity: 0, transition: "opacity 0.2s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={e => (e.currentTarget.style.opacity = "0")}
                    >
                      <span style={{ color: "#fff", fontSize: 13, fontWeight: 500 }}>Click to change image</span>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    padding: "52px 24px", gap: 14, textAlign: "center",
                  }}>
                    <svg style={{ width: 50, height: 50, color: "#1e293b" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.3}>
                      <rect x="5" y="2" width="14" height="20" rx="2.5" />
                      <line x1="5" y1="10" x2="19" y2="10" />
                      <line x1="9" y1="6" x2="9" y2="8" strokeLinecap="round" />
                      <line x1="9" y1="14" x2="9" y2="18" strokeLinecap="round" />
                    </svg>
                    <div>
                      <div style={{ color: C.textDim, fontWeight: 500, fontSize: 14 }}>Drop your fridge photo here</div>
                      <div style={{ color: C.textMuted, fontSize: 12, marginTop: 5 }}>or click to browse · JPG, PNG, WEBP</div>
                    </div>
                  </div>
                )}
              </div>

              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

              {/* Progress */}
              {loading && (
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.textMuted }}>
                    <span>Scanning ingredients…</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div style={{ width: "100%", height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 2,
                      background: `linear-gradient(90deg, ${C.amber}, #fbbf24)`,
                      width: `${progress}%`, transition: "width 0.35s ease",
                    }} />
                  </div>
                </div>
              )}

              {/* Analyze button */}
              <button
                onClick={analyzeImage}
                disabled={loading || !image}
                onMouseEnter={() => setBtnHov(true)}
                onMouseLeave={() => setBtnHov(false)}
                style={{
                  width: "100%", padding: "15px 0",
                  borderRadius: 14, border: "none",
                  cursor: loading || !image ? "not-allowed" : "pointer",
                  background: loading || !image
                    ? "rgba(245,158,11,0.3)"
                    : "linear-gradient(135deg, #f59e0b, #d97706)",
                  color: loading || !image ? "rgba(10,10,10,0.45)" : "#0a0a0a",
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700, fontSize: 13,
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  boxShadow: (!loading && image && btnHov) ? `0 8px 30px ${C.amberGlow}` : "none",
                  transform: (!loading && image && btnHov) ? "translateY(-2px)" : "none",
                  transition: "box-shadow 0.2s, transform 0.2s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                }}
              >
                {loading ? (
                  <><span className="spinner" /> Analyzing…</>
                ) : (
                  <>
                    <svg style={{ width: 15, height: 15 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Analyze Fridge
                  </>
                )}
              </button>

              <div style={{ textAlign: "center", fontSize: 11, color: "#1e293b" }}>
                Developed By Sayak Bhattasali
              </div>
            </div>

            {/* ═══ RESULTS PANEL ═══ */}
            {result && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Error */}
                {result.raw && (
                  <div style={{
                    background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.2)",
                    borderRadius: 16, padding: "16px 20px",
                    animation: "fadein 0.4s ease both",
                  }}>
                    <div style={{ fontSize: 11, color: C.rose, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>Error</div>
                    <pre style={{ fontSize: 11, color: "#fca5a5", whiteSpace: "pre-wrap", fontFamily: "monospace" }}>{result.raw}</pre>
                  </div>
                )}

                {/* Stats */}
                {(result.ingredients || result.veg || result.nonVeg) && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, animation: "fadein 0.4s ease both" }}>
                    {[
                      { label: "Total Items",  count: result.ingredients?.length ?? 0, color: "#fff" },
                      { label: "Vegetarian",   count: result.veg?.length ?? 0,         color: C.emerald },
                      { label: "Non-Veg",      count: result.nonVeg?.length ?? 0,      color: C.rose },
                    ].map(s => (
                      <div key={s.label} style={{
                        background: C.surface, border: `1px solid ${C.border}`,
                        borderRadius: 16, padding: "16px 10px", textAlign: "center",
                      }}>
                        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 34, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.count}</div>
                        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Ingredients */}
                {(result.ingredients?.length ?? 0) > 0 && (
                  <SectionCard title="🧺 All Ingredients" delay={60}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {result.ingredients!.map((item, i) => <Chip key={i} label={item} />)}
                    </div>
                  </SectionCard>
                )}

                {/* Veg + Non-Veg row */}
                {((result.veg?.length ?? 0) > 0 || (result.nonVeg?.length ?? 0) > 0) && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {(result.veg?.length ?? 0) > 0 && (
                      <SectionCard title="🥦 Vegetarian" delay={100}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                          {result.veg!.map((item, i) => <Chip key={i} label={item} variant="veg" />)}
                        </div>
                      </SectionCard>
                    )}
                    {(result.nonVeg?.length ?? 0) > 0 && (
                      <SectionCard title="🍗 Non-Veg" delay={130}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                          {result.nonVeg!.map((item, i) => <Chip key={i} label={item} variant="nonveg" />)}
                        </div>
                      </SectionCard>
                    )}
                  </div>
                )}

                {/* Recipes */}
                {(result.recipes?.length ?? 0) > 0 && (
                  <SectionCard title={`👨‍🍳 ${result.recipes!.length} Recipes Suggested`} delay={160}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {result.recipes!.map((r, i) => <RecipeCard key={i} recipe={r} index={i} />)}
                    </div>
                  </SectionCard>
                )}

              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}