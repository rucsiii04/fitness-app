import React from "react";

const mix = (v, pct) => `color-mix(in srgb, var(${v}) ${pct}%, transparent)`;

const TONES = {
  accent: {
    bg: mix("--accent", 14),
    fg: "var(--accent)",
    br: mix("--accent", 30),
  },
  coral: { bg: mix("--coral", 14), fg: "var(--coral)", br: mix("--coral", 30) },
  teal: { bg: mix("--teal", 14), fg: "var(--teal)", br: mix("--teal", 30) },
  green: { bg: mix("--green", 12), fg: "var(--green)", br: mix("--green", 25) },
  red: { bg: mix("--red", 12), fg: "var(--red)", br: mix("--red", 25) },
  muted: { bg: mix("--text", 5), fg: "var(--text-muted)", br: "var(--border)" },
  outline: {
    bg: "transparent",
    fg: "var(--text-muted)",
    br: "var(--border-strong)",
  },
};

export default function Pill({ children, tone = "muted", style }) {
  const t = TONES[tone] || TONES.muted;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 8px",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: 0.1,
        textTransform: "uppercase",
        background: t.bg,
        color: t.fg,
        border: `1px solid ${t.br}`,
        borderRadius: 999,
        fontFamily: "var(--mono)",
        ...style,
      }}
    >
      {children}
    </span>
  );
}
