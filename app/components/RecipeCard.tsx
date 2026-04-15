import { useState } from "react";
import { Recipe } from "@/app/lib/types";
import { COLORS } from "@/app/lib/colors";

interface RecipeCardProps {
  recipe: Recipe;
  index: number;
  darkMode?: boolean;
}

export function RecipeCard({ recipe, index, darkMode = true }: RecipeCardProps) {
  const [open, setOpen] = useState(false);
  const [hov, setHov] = useState(false);

  const text = darkMode ? COLORS.text : "#0f172a";
  const textDim = darkMode ? COLORS.textDim : "#334155";
  const border = darkMode ? COLORS.border : "#e2e8f0";
  const surfaceHover = darkMode ? COLORS.surfaceHover : "rgba(0,0,0,0.03)";
  const surfaceDefault = darkMode ? "rgba(255,255,255,0.03)" : "#ffffff";

  return (
    <div
      onClick={() => setOpen((p) => !p)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius: 14,
        overflow: "hidden",
        cursor: "pointer",
        border: `1px solid ${hov ? COLORS.borderAmber : border}`,
        background: hov ? surfaceHover : surfaceDefault,
        transition: "border-color 0.2s, background 0.2s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: COLORS.amberDim,
              color: COLORS.amber,
              fontSize: 11,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Syne', sans-serif",
            }}
          >
            {index + 1}
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, color: text }}>
            {recipe.name}

            {recipe.calories && (
              <span
                style={{
                  marginLeft: 8,
                  color: COLORS.amber,
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "'Syne', sans-serif"
                }}
              >
                ({recipe.calories} kcal)
              </span>
            )}
          </span>
        </div>
        <svg
          style={{
            width: 14,
            height: 14,
            color: darkMode ? COLORS.textMuted : "#64748b",
            transition: "transform 0.25s",
            transform: open ? "rotate(180deg)" : "none",
            flexShrink: 0,
          }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {open && (
        <ol
          style={{
            padding: "4px 18px 18px",
            borderTop: `1px solid ${border}`,
            paddingTop: 14,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            listStyle: "none",
            margin: 0,
          }}
        >
          {recipe.steps.map((step, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                gap: 10,
                fontSize: 13,
                color: textDim,
              }}
            >
              <span
                style={{
                  color: COLORS.amber,
                  fontWeight: 700,
                  marginTop: 1,
                  flexShrink: 0,
                  fontFamily: "'Syne', sans-serif",
                }}
              >
                {i + 1}.
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
