import { COLORS } from "@/app/lib/colors";

interface ChipProps {
  label: string;
  variant?: "veg" | "nonveg" | "default";
  darkMode?: boolean;
}

export function Chip({ label, variant = "default", darkMode = true }: ChipProps) {
  const text = darkMode ? COLORS.text : "#0f172a";
  const border = darkMode ? COLORS.border : "#e2e8f0";

  const map = {
    veg: {
      bg: COLORS.emeraldDim,
      color: darkMode ? COLORS.emerald : "#059669",
      border: "rgba(52,211,153,0.3)",
    },
    nonveg: {
      bg: COLORS.roseDim,
      color: darkMode ? COLORS.rose : "#dc2626",
      border: "rgba(248,113,113,0.3)",
    },
    default: {
      bg: darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
      color: text,
      border: border,
    },
  };

  const t = map[variant];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 12px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 500,
        background: t.bg,
        color: t.color,
        border: `1px solid ${t.border}`,
        transition: "transform 0.15s, filter 0.15s",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = "scale(1.06)";
        el.style.filter = "brightness(1.15)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = "scale(1)";
        el.style.filter = "brightness(1)";
      }}
    >
      {label}
    </span>
  );
}
