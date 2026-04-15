import { ReactNode } from "react";
import { COLORS } from "@/app/lib/colors";

interface SectionCardProps {
  title: string;
  children: ReactNode;
  delay?: number;
  darkMode?: boolean;
}

export function SectionCard({ title, children, delay = 0, darkMode = true }: SectionCardProps) {
  const surface = darkMode ? COLORS.surface : "#ffffff";
  const border = darkMode ? COLORS.border : "#e2e8f0";
  const textMuted = darkMode ? COLORS.textMuted : "#64748b";

  return (
    <div
      style={{
        background: surface,
        border: `1px solid ${border}`,
        borderRadius: 20,
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        animation: "fadein 0.45s ease both",
        animationDelay: `${delay}ms`,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: textMuted,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}
