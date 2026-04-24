import React from "react";

const THEME_COLORS = [
  ["var(--accent)", "var(--accent-ink)"],
  ["var(--coral)",  "var(--bg)"],
  ["var(--teal)",   "var(--bg)"],
  ["var(--green)",  "var(--bg)"],
];

export default function Avatar({ name = "?", size = 32 }) {
  const init = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const hash = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  const [bg, fg] = THEME_COLORS[hash % THEME_COLORS.length];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size,
        background: bg,
        color: fg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.38,
        fontWeight: 700,
        fontFamily: "var(--display)",
        flexShrink: 0,
        letterSpacing: -0.5,
      }}
    >
      {init}
    </div>
  );
}
