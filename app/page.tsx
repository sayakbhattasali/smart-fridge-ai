"use client";

import { useState, useRef, useCallback } from "react";
import { Chip } from "@/app/components/Chip";
import { SectionCard } from "@/app/components/SectionCard";
import { RecipeCard } from "@/app/components/RecipeCard";
import { COLORS } from "@/app/lib/colors";
import { AnalysisResult } from "@/app/lib/types";
import { toBase64 } from "@/app/lib/utils";

export default function Home() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [dragging, setDragging] = useState(false);
  const [btnHov, setBtnHov] = useState(false);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [partialIngredients, setPartialIngredients] = useState<AnalysisResult | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  const [lightbulbHov, setLightbulbHov] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [manualChips, setManualChips] = useState<string[]>([]);
  const [manualBtnHov, setManualBtnHov] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Dark mode color scheme
  const lightModeColors = {
    ...COLORS,
    bg: "#f8fafc",
    surface: "#ffffff",
    text: "#0f172a",
    textDim: "#334155",
    textMuted: "#64748b",
    border: "#e2e8f0",
  };

  const darkModeColors = COLORS; // Keep existing dark mode colors

  const colors = darkMode ? darkModeColors : lightModeColors;

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const analyzeImage = async () => {
    if (!image) return;
    setLoading(true);
    setResult(null);
    setErrorType(null);
    setPartialIngredients(null);
    setProgress(0);
    const iv = setInterval(
      () => setProgress((p) => (p < 82 ? p + Math.random() * 10 : p)),
      450
    );
    try {
      const base64 = await toBase64(image);
      const imageData = base64.split(",")[1];

      const apiRes = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: imageData }),
      });

      const data = await apiRes.json();

      // Case 1: Both Gemini AND Groq Vision failed → manual input is the last resort
      if (data.error === "BOTH_VISION_FAILED") {
        console.error("Both vision APIs failed:", data.details);
        setErrorType("BOTH_VISION_FAILED");
        setManualMode(true);
        setResult({
          raw: "Both Gemini and Groq Vision are unavailable. Enter your ingredients manually below."
        });
        setProgress(100);
        clearInterval(iv);
        setLoading(false);
        return;
      }

      // Case 2: Groq recipe generation failed (but vision succeeded — we have ingredients)
      if (data.error === "GROQ_PARSE_FAILED") {
        console.error("Groq parsing failed:", data.details);
        setErrorType("GROQ_PARSE_FAILED");
        setPartialIngredients({
          ingredients: data.ingredients || [],
          veg: data.veg || [],
          nonVeg: data.nonVeg || [],
          recipes: [],
        });
        setResult({
          ingredients: data.ingredients || [],
          veg: data.veg || [],
          nonVeg: data.nonVeg || [],
          recipes: [],
          raw: "Failed to generate recipes. You can retry.",
        });
        // Still show fallback notification if applicable
        if (data.usedFallback) {
          setIsFallback(true);
          setTimeout(() => setIsFallback(false), 6000);
        }
        setProgress(100);
        clearInterval(iv);
        setLoading(false);
        return;
      }

      // Case 3: Any other error
      if (!apiRes.ok) {
        throw new Error(data.error || data.details || "Failed to analyze image");
      }

      // Case 4: Success — check if fallback was used
      if (data.usedFallback) {
        setIsFallback(true);
        setTimeout(() => setIsFallback(false), 6000);
      }

      const ingredientsData: AnalysisResult = {
        ingredients: data.ingredients || [],
        veg: data.veg || [],
        nonVeg: data.nonVeg || [],
        recipes: data.recipes || [],
      };

      setProgress(100);
      setTimeout(() => setResult(ingredientsData), 250);
    } catch (err: any) {
      console.error("Analysis error:", err);
      setErrorType("UNKNOWN");
      setResult({ raw: err.message || "An error occurred during analysis" });
    } finally {
      clearInterval(iv);
      setLoading(false);
    }
  };

  const generateRecipesOnly = async () => {
    if (
      !partialIngredients ||
      !partialIngredients.ingredients ||
      !partialIngredients.ingredients.length
    ) {
      return;
    }

    setLoading(true);
    setProgress(0);
    const iv = setInterval(
      () => setProgress((p) => (p < 82 ? p + Math.random() * 10 : p)),
      450
    );

    try {
      const apiRes = await fetch("/api/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ingredients: partialIngredients.ingredients,
        }),
      });

      const data = await apiRes.json();

      if (!apiRes.ok || data.error) {
        throw new Error(data.error || "Failed to generate recipes");
      }

      setProgress(100);
      setErrorType(null);
      setTimeout(() => {
        setResult({
          ...partialIngredients,
          recipes: data.recipes || [],
        });
      }, 250);
    } catch (err: any) {
      console.error("Recipe generation error:", err);
      setResult({
        ...partialIngredients,
        raw: err.message || "Failed to generate recipes",
      });
    } finally {
      clearInterval(iv);
      setLoading(false);
    }
  };

  // ── Manual ingredient chip helpers ──
  const addManualChip = (value: string) => {
    const items = value
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0 && !manualChips.includes(s));
    if (items.length) setManualChips((prev) => [...prev, ...items]);
    setManualInput("");
  };

  const removeManualChip = (chip: string) => {
    setManualChips((prev) => prev.filter((c) => c !== chip));
  };

  const handleManualSubmit = async () => {
    if (manualChips.length === 0) return;

    setLoading(true);
    setResult(null);
    setErrorType(null);
    setProgress(0);
    const iv = setInterval(
      () => setProgress((p) => (p < 82 ? p + Math.random() * 10 : p)),
      450
    );

    try {
      const apiRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: manualChips,
          mode: "groq-only",
        }),
      });

      const data = await apiRes.json();

      if (!apiRes.ok || data.error) {
        throw new Error(data.error || "Failed to generate recipes");
      }

      const parsed = data.parsed || data;
      setProgress(100);
      setManualMode(false);
      setTimeout(() => {
        setResult({
          ingredients: parsed.ingredients || manualChips,
          veg: parsed.veg || [],
          nonVeg: parsed.nonVeg || [],
          recipes: parsed.recipes || [],
        });
      }, 250);
    } catch (err: any) {
      console.error("Manual submit error:", err);
      setErrorType("MANUAL_ERROR");
      setResult({ raw: err.message || "Failed to generate recipes. Please try again." });
    } finally {
      clearInterval(iv);
      setLoading(false);
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
          background: ${colors.bg};
          font-family: 'Instrument Sans', sans-serif;
          color: ${colors.text};
          transition: background 0.3s, color 0.3s;
        }
        body::before {
          content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background:
  radial-gradient(ellipse 70% 40% at 50% -10%, rgba(245,158,11,0.12) 0%, transparent 70%),
  radial-gradient(ellipse 30% 25% at 80% 80%, rgba(52,211,153,0.05) 0%, transparent 60%);
        }
        @keyframes fadein {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner {
          display: inline-block; width: 16px; height: 16px; border-radius: 50%;
          border: 2px solid rgba(10,10,10,0.2); border-top-color: #0a0a0a;
          animation: spin 0.65s linear infinite;
        }
        .dropzone {
          border: 1.5px dashed ${darkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"};
          border-radius: 16px;
          transition: border-color 0.2s, background 0.2s;
          cursor: pointer;
        }
        .dropzone:hover, .dropzone.drag { border-color: ${COLORS.amber}; background: ${COLORS.amberDim}; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: ${darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}; border-radius: 3px; }
        .hero {
  position: relative;

  background-image: url("https://www.transparenttextures.com/patterns/stardust.png");
  background-size: cover;
  background-position: center;
}
  @keyframes shineText {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
      `}</style>

      {/* Full-width root */}
      <div style={{ position: "relative", zIndex: 1, width: "100%", minHeight: "100vh" }}>
        {/* Centered constrained container */}
        <div
          style={{
            width: "100%",
            maxWidth: hasResults ? 1120 : 640,
            marginLeft: "auto",
            marginRight: "auto",
            padding: "52px 24px 64px",
            transition: "max-width 0.4s ease",
          }}
        >
          {/* ── Header ── */}
          <div className="hero">
            <header
              style={{
                position: "relative",
                zIndex: 2,   // 🔥 VERY IMPORTANT
                textAlign: "center",
                marginBottom: 44,
                animation: "fadein 0.5s ease both",
              }}
            >
              {/* Light bulb toggle */}
              {/* Dark/Light toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                onMouseEnter={() => setLightbulbHov(true)}
                onMouseLeave={() => setLightbulbHov(false)}
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  border: "none",
                  background: lightbulbHov
                    ? darkMode
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.06)"
                    : "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.25s ease",
                  boxShadow: lightbulbHov
                    ? `0 0 12px ${COLORS.amberGlow}`
                    : "none",
                  transform: lightbulbHov ? "scale(1.08)" : "scale(1)",
                }}
                title={darkMode ? "Switch to Light Mode ☀️" : "Switch to Dark Mode 🌙"}
              >
                {darkMode ? (
                  // 🌞 SUN ICON (dark mode ON)
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={COLORS.amber}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      transition: "all 0.3s ease",
                      transform: lightbulbHov ? "rotate(20deg) scale(1.1)" : "rotate(0deg)",
                    }}
                  >
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                ) : (
                  // 🌙 MOON ICON (light mode ON)
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill={COLORS.amber}
                    style={{
                      transition: "all 0.3s ease",
                      transform: lightbulbHov ? "rotate(-20deg) scale(1.1)" : "rotate(0deg)",
                    }}
                  >
                    <path d="M21 12.79A9 9 0 0111.21 3c0 .34.02.67.05 1A7 7 0 1019 18.74c.33.03.66.05 1 .05a9 9 0 001-5z" />
                  </svg>
                )}
              </button>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: COLORS.amber,
                  fontWeight: 600,
                  marginBottom: 16,
                }}
              >
                <span
                  style={{
                    width: 28,
                    height: 1,
                    background: COLORS.amber,
                    opacity: 0.5,
                  }}
                />
                AI-Powered Kitchen Intelligence
                <span
                  style={{
                    width: 28,
                    height: 1,
                    background: COLORS.amber,
                    opacity: 0.5,
                  }}
                />
              </div>
              <div style={{ textAlign: "center" }}></div>
              <h1
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "clamp(42px, 7vw, 70px)",
                  fontWeight: 800,
                  lineHeight: 1.05,
                  color: colors.text,
                  letterSpacing: "-0.02em",
                  textAlign: "left",
                  textShadow: darkMode
                    ? "0 10px 40px rgba(0,0,0,0.6)"
                    : "0 10px 30px rgba(0,0,0,0.15)",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", width: "100%", maxWidth: "600px", margin: "0 auto" }}>

                  <div style={{ textAlign: "left", whiteSpace: "nowrap", fontSize: "0.85em" }}>

                    Your{" "}

                    <span
                      style={{
                        position: "relative",
                        display: "inline",
                        fontSize: "inherit",
                        background: "linear-gradient(90deg, #f59e0b, #fbbf24, #fff, #fbbf24, #f59e0b)",
                        backgroundSize: "200% auto",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        animation: "shineText 3s linear infinite"
                      }}
                    >
                      Fridge


                    </span>

                  </div>

                  <div style={{ textAlign: "right", whiteSpace: "nowrap", fontSize: "0.7em" }}><span style={{ color: COLORS.amber }}>Just</span> Got Smarter</div>
                </div>
              </h1>
              <p
                style={{
                  color: colors.textMuted,
                  fontSize: 15,
                  marginTop: 16,
                  lineHeight: 1.8,
                  maxWidth: 520,
                  marginLeft: "auto",
                  marginRight: "auto",
                  opacity: 0.9,
                }}
              >
                Photograph your fridge or pantry — AI identifies every ingredient
                <br />
                and crafts creative recipes in seconds.
              </p>
            </header>
          </div >

          {/* ── Grid: upload left, results right ── */}
          < div
            style={{
              display: "grid",
              gridTemplateColumns: hasResults ? "minmax(290px, 400px) 1fr" : "1fr",
              gap: 24,
              alignItems: "start",
            }
            }
          >
            {/* ═══ UPLOAD CARD ═══ */}
            < div
              style={{
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: 24,
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 18,
                animation: "fadein 0.5s ease 80ms both",
              }}
            >
              {/* Drop zone */}
              < div
                className={`dropzone${dragging ? " drag" : ""}`}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
              >
                {
                  preview ? (
                    <div style={{ position: "relative" }} >
                      <img
                        src={preview}
                        alt="Preview"
                        style={{
                          width: "100%",
                          borderRadius: 14,
                          objectFit: "cover",
                          maxHeight: 260,
                          display: "block",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: 14,
                          background: "rgba(0,0,0,0.52)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: 0,
                          transition: "opacity 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.opacity = "0")
                        }
                      >
                        <span
                          style={{
                            color: "#fff",
                            fontSize: 13,
                            fontWeight: 500,
                          }}
                        >
                          Click to change image
                        </span>
                      </div>
                    </div >
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "52px 24px",
                        gap: 14,
                        textAlign: "center",
                      }}
                    >
                      <svg
                        style={{
                          width: 50,
                          height: 50,
                          color: colors.textDim,
                        }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.3}
                      >
                        <rect x="5" y="2" width="14" height="20" rx="2.5" />
                        <line x1="5" y1="10" x2="19" y2="10" />
                        <line x1="9" y1="6" x2="9" y2="8" strokeLinecap="round" />
                        <line x1="9" y1="14" x2="9" y2="18" strokeLinecap="round" />
                      </svg>
                      <div>
                        <div
                          style={{
                            color: colors.textDim,
                            fontWeight: 500,
                            fontSize: 14,
                          }}
                        >
                          Drop your fridge photo here
                        </div>
                        <div
                          style={{
                            color: colors.textMuted,
                            fontSize: 12,
                            marginTop: 5,
                          }}
                        >
                          or click to browse · JPG, PNG, WEBP
                        </div>
                      </div>
                    </div>
                  )}
              </div >

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) =>
                  e.target.files?.[0] && handleFile(e.target.files[0])
                }
              />

              {/* Progress */}
              {
                loading && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 11,
                        color: colors.textMuted,
                      }}
                    >
                      <span>Scanning ingredients…</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: 3,
                        background: darkMode ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
                        borderRadius: 2,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          borderRadius: 2,
                          background: `linear-gradient(90deg, ${COLORS.amber}, #fbbf24)`,
                          width: `${progress}%`,
                          transition: "width 0.35s ease",
                        }}
                      />
                    </div>
                  </div>
                )
              }

              {/* Analyze button */}
              <button
                onClick={analyzeImage}
                disabled={loading || !image}
                onMouseEnter={() => setBtnHov(true)}
                onMouseLeave={() => setBtnHov(false)}
                style={{
                  width: "100%",
                  padding: "15px 0",
                  borderRadius: 14,
                  border: "none",
                  cursor: loading || !image ? "not-allowed" : "pointer",
                  background:
                    loading || !image
                      ? "rgba(245,158,11,0.3)"
                      : "linear-gradient(135deg, #f59e0b, #d97706)",
                  color: loading || !image ? "rgba(10,10,10,0.45)" : "#0a0a0a",
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: 13,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  boxShadow:
                    !loading && image && btnHov
                      ? `0 8px 30px ${COLORS.amberGlow}`
                      : "none",
                  transform:
                    !loading && image && btnHov ? "translateY(-2px)" : "none",
                  transition: "box-shadow 0.2s, transform 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner" /> Analyzing…
                  </>
                ) : (
                  <>
                    <svg
                      style={{ width: 15, height: 15 }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                    Analyze Fridge
                  </>
                )}
              </button>

              {/* ═══ MANUAL MODE TOGGLE ═══ */}
              {!manualMode && (
                <button
                  onClick={() => { setManualMode(true); setResult(null); setErrorType(null); }}
                  style={{
                    background: "none",
                    border: "none",
                    color: colors.textMuted,
                    fontSize: 12,
                    cursor: "pointer",
                    marginTop: 12,
                    padding: "6px 0",
                    transition: "color 0.2s",
                    width: "100%",
                    textAlign: "center",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = COLORS.amber)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = colors.textMuted)}
                >
                  ✍️ Or enter ingredients manually
                </button>
              )}

              {/* ═══ MANUAL INPUT SECTION ═══ */}
              {manualMode && (
                <div
                  style={{
                    marginTop: 16,
                    padding: 20,
                    borderRadius: 16,
                    background: darkMode
                      ? "rgba(245,158,11,0.06)"
                      : "rgba(245,158,11,0.04)",
                    border: `1px solid ${COLORS.borderAmber}`,
                    animation: "fadein 0.35s ease both",
                  }}
                >
                  {/* Header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: COLORS.amber,
                      }}
                    >
                      ✍️ Manual Ingredients
                    </div>
                    <button
                      onClick={() => { setManualMode(false); setManualChips([]); setManualInput(""); }}
                      style={{
                        background: "none",
                        border: "none",
                        color: colors.textMuted,
                        fontSize: 18,
                        cursor: "pointer",
                        lineHeight: 1,
                        padding: "2px 6px",
                        borderRadius: 6,
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = COLORS.rose;
                        e.currentTarget.style.background = COLORS.roseDim;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = colors.textMuted;
                        e.currentTarget.style.background = "none";
                      }}
                    >
                      ×
                    </button>
                  </div>

                  <p style={{ color: colors.textDim, fontSize: 12, marginBottom: 12, lineHeight: 1.5 }}>
                    Type ingredients and press <span style={{ color: COLORS.amber, fontWeight: 600 }}>Enter</span> or <span style={{ color: COLORS.amber, fontWeight: 600 }}>,</span> to add them as chips.
                  </p>

                  {/* Chips display */}
                  {manualChips.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 8,
                        marginBottom: 14,
                      }}
                    >
                      {manualChips.map((chip) => (
                        <div
                          key={chip}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "5px 10px 5px 12px",
                            borderRadius: 20,
                            background: COLORS.amberDim,
                            border: `1px solid ${COLORS.borderAmber}`,
                            fontSize: 12,
                            fontWeight: 500,
                            color: COLORS.amber,
                            animation: "fadein 0.2s ease both",
                          }}
                        >
                          {chip}
                          <button
                            onClick={() => removeManualChip(chip)}
                            style={{
                              background: "none",
                              border: "none",
                              color: COLORS.amber,
                              cursor: "pointer",
                              fontSize: 14,
                              lineHeight: 1,
                              padding: 0,
                              opacity: 0.6,
                              transition: "opacity 0.15s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Input field */}
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="text"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          if (manualInput.trim()) addManualChip(manualInput);
                        }
                      }}
                      placeholder="e.g. eggs, milk, bread…"
                      style={{
                        flex: 1,
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: `1px solid ${colors.border}`,
                        background: darkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                        color: colors.text,
                        fontSize: 13,
                        outline: "none",
                        transition: "border-color 0.2s",
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = COLORS.amber)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = colors.border)}
                    />
                    <button
                      onClick={() => { if (manualInput.trim()) addManualChip(manualInput); }}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: `1px solid ${COLORS.borderAmber}`,
                        background: COLORS.amberDim,
                        color: COLORS.amber,
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(245,158,11,0.25)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = COLORS.amberDim)}
                    >
                      + Add
                    </button>
                  </div>

                  {/* Generate button */}
                  <button
                    onClick={handleManualSubmit}
                    disabled={loading || manualChips.length === 0}
                    onMouseEnter={() => setManualBtnHov(true)}
                    onMouseLeave={() => setManualBtnHov(false)}
                    style={{
                      width: "100%",
                      marginTop: 16,
                      padding: "14px 0",
                      borderRadius: 12,
                      border: "none",
                      cursor: loading || manualChips.length === 0 ? "not-allowed" : "pointer",
                      background:
                        loading || manualChips.length === 0
                          ? "rgba(245,158,11,0.2)"
                          : "linear-gradient(135deg, #f59e0b, #d97706)",
                      color: loading || manualChips.length === 0 ? "rgba(10,10,10,0.4)" : "#0a0a0a",
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 700,
                      fontSize: 13,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      boxShadow:
                        !loading && manualChips.length > 0 && manualBtnHov
                          ? `0 8px 30px ${COLORS.amberGlow}`
                          : "none",
                      transform:
                        !loading && manualChips.length > 0 && manualBtnHov
                          ? "translateY(-2px)"
                          : "none",
                      transition: "all 0.25s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner" /> Generating…
                      </>
                    ) : (
                      <>
                        <svg
                          style={{ width: 15, height: 15 }}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        Generate Recipes ({manualChips.length} ingredient{manualChips.length !== 1 ? "s" : ""})
                      </>
                    )}
                  </button>
                </div>
              )}
            </div >

            {/* ═══ RESULTS PANEL ═══ */}
            {
              result && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                  {/* ═══ FALLBACK NOTIFICATION ═══ */}
                  {isFallback && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "14px 18px",
                        borderRadius: 14,
                        background: COLORS.amberDim,
                        border: `1px solid ${COLORS.borderAmber}`,
                        animation: "fadein 0.35s ease both",
                      }}
                    >
                      {/* Spinner */}
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          border: `2px solid ${COLORS.amberDim}`,
                          borderTopColor: COLORS.amber,
                          animation: "spin 0.7s linear infinite",
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: COLORS.amber,
                            letterSpacing: "0.03em",
                          }}
                        >
                          Gemini is busy. Shifting to Groq Intelligence for analysis...
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: colors.textMuted,
                            marginTop: 3,
                          }}
                        >
                          Powered by Llama 4 Scout — results may vary slightly
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Error */}
                  {result.raw && (
                    <div
                      style={{
                        background: errorType === "GEMINI_RATE_LIMITED"
                          ? COLORS.amberDim
                          : darkMode ? "rgba(248,113,113,0.07)" : "rgba(248,113,113,0.04)",
                        border: `1px solid ${errorType === "GEMINI_RATE_LIMITED"
                          ? COLORS.borderAmber
                          : `rgba(${darkMode ? "248,113,113" : "220,38,38"}, 0.2)`}`,
                        borderRadius: 16,
                        padding: "16px 20px",
                        animation: "fadein 0.4s ease both",
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            color: errorType === "GEMINI_RATE_LIMITED" ? COLORS.amber : (darkMode ? COLORS.rose : "#dc2626"),
                            fontWeight: 600,
                            marginBottom: 4,
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                          }}
                        >
                          {errorType === "BOTH_VISION_FAILED"
                            ? "Vision APIs Unavailable"
                            : errorType === "GEMINI_RATE_LIMITED"
                              ? "Gemini Rate Limited"
                              : errorType === "GEMINI_FAILED" || errorType === "GEMINI_PARSE_FAILED"
                                ? "Ingredient Recognition Failed"
                                : errorType === "GROQ_PARSE_FAILED"
                                  ? "Recipe Generation Failed"
                                  : errorType === "MANUAL_ERROR"
                                    ? "Recipe Generation Failed"
                                    : "Error"}
                        </div>
                        <div style={{ fontSize: 14, color: errorType === "GEMINI_RATE_LIMITED" ? colors.textDim : (darkMode ? "#fca5a5" : "#dc2626") }}>
                          {result.raw}
                        </div>
                      </div>

                      {/* Retry buttons */}
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {(errorType === "GEMINI_PARSE_FAILED" || errorType === "GEMINI_RATE_LIMITED" || errorType === "GEMINI_FAILED") && image && (
                          <button
                            onClick={analyzeImage}
                            disabled={loading}
                            style={{
                              flex: 1,
                              padding: "10px 14px",
                              borderRadius: 12,
                              border: "none",
                              background:
                                loading
                                  ? "rgba(245,158,11,0.3)"
                                  : "rgba(248,113,113,0.2)",
                              color: loading ? "rgba(10,10,10,0.45)" : (darkMode ? "#fca5a5" : "#dc2626"),
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: loading ? "not-allowed" : "pointer",
                              transition: "all 0.2s",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                            onMouseEnter={(e) => {
                              if (!loading)
                                e.currentTarget.style.background =
                                  "rgba(248,113,113,0.35)";
                            }}
                            onMouseLeave={(e) => {
                              if (!loading)
                                e.currentTarget.style.background =
                                  "rgba(248,113,113,0.2)";
                            }}
                          >
                            Retry Analysis
                          </button>
                        )}

                        {errorType === "GROQ_PARSE_FAILED" && (
                          <button
                            onClick={generateRecipesOnly}
                            disabled={loading}
                            style={{
                              flex: 1,
                              padding: "10px 14px",
                              borderRadius: 12,
                              border: "none",
                              background:
                                loading
                                  ? "rgba(245,158,11,0.3)"
                                  : "rgba(248,113,113,0.2)",
                              color: loading ? "rgba(10,10,10,0.45)" : (darkMode ? "#fca5a5" : "#dc2626"),
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: loading ? "not-allowed" : "pointer",
                              transition: "all 0.2s",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                            onMouseEnter={(e) => {
                              if (!loading)
                                e.currentTarget.style.background =
                                  "rgba(248,113,113,0.35)";
                            }}
                            onMouseLeave={(e) => {
                              if (!loading)
                                e.currentTarget.style.background =
                                  "rgba(248,113,113,0.2)";
                            }}
                          >
                            Retry Recipes (Groq)
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  {(result.ingredients ||
                    result.veg ||
                    result.nonVeg) && (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3,1fr)",
                          gap: 10,
                          animation: "fadein 0.4s ease both",
                        }}
                      >
                        {[
                          {
                            label: "Total Items",
                            count: result.ingredients?.length ?? 0,
                            color: colors.text,
                          },
                          {
                            label: "Vegetarian",
                            count: result.veg?.length ?? 0,
                            color: COLORS.emerald,
                          },
                          {
                            label: "Non-Veg",
                            count: result.nonVeg?.length ?? 0,
                            color: COLORS.rose,
                          },
                        ].map((s) => (
                          <div
                            key={s.label}
                            style={{
                              background: colors.surface,
                              border: `1px solid ${colors.border}`,
                              borderRadius: 16,
                              padding: "16px 10px",
                              textAlign: "center",
                            }}
                          >
                            <div
                              style={{
                                fontFamily: "'Syne', sans-serif",
                                fontSize: 34,
                                fontWeight: 800,
                                color: s.color,
                                lineHeight: 1,
                              }}
                            >
                              {s.count}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: colors.textMuted,
                                marginTop: 6,
                              }}
                            >
                              {s.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                  {/* Ingredients */}
                  {(result.ingredients?.length ?? 0) > 0 && (
                    <SectionCard title="🧲 All Ingredients" delay={60} darkMode={darkMode}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {result.ingredients!.map((item, i) => (
                          <Chip key={i} label={item} darkMode={darkMode} />
                        ))}
                      </div>
                    </SectionCard>
                  )}

                  {/* Veg + Non-Veg row */}
                  {((result.veg?.length ?? 0) > 0 ||
                    (result.nonVeg?.length ?? 0) > 0) && (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 12,
                        }}
                      >
                        {(result.veg?.length ?? 0) > 0 && (
                          <SectionCard title="🥦 Vegetarian" delay={100} darkMode={darkMode}>
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 7,
                              }}
                            >
                              {result.veg!.map((item, i) => (
                                <Chip
                                  key={i}
                                  label={item}
                                  variant="veg"
                                  darkMode={darkMode}
                                />
                              ))}
                            </div>
                          </SectionCard>
                        )}
                        {(result.nonVeg?.length ?? 0) > 0 && (
                          <SectionCard title="🍗 Non-Veg" delay={130} darkMode={darkMode}>
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 7,
                              }}
                            >
                              {result.nonVeg!.map((item, i) => (
                                <Chip
                                  key={i}
                                  label={item}
                                  variant="nonveg"
                                  darkMode={darkMode}
                                />
                              ))}
                            </div>
                          </SectionCard>
                        )}
                      </div>
                    )}

                  {/* Recipes */}
                  {(result.recipes?.length ?? 0) > 0 && (
                    <SectionCard
                      title={`👨‍🍳 ${result.recipes!.length} Recipes Suggested`}
                      delay={160}
                      darkMode={darkMode}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        {result.recipes!.map((r, i) => (
                          <RecipeCard key={i} recipe={r} index={i} darkMode={darkMode} />
                        ))}
                      </div>
                    </SectionCard>
                  )}
                </div>
              )
            }
          </div >
        </div >
      </div >
    </>
  );
}