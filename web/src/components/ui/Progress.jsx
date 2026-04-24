import React from "react";

export default function Progress({
  value,
  max = 100,
  color = "var(--accent)",
  height = 4,
}) {
  return (
    <div
      style={{
        width: "100%",
        height,
        background: "var(--surface-3)",
        borderRadius: height,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${Math.min(100, (value / max) * 100)}%`,
          height: "100%",
          background: color,
          transition: "width .3s",
        }}
      />
    </div>
  );
}
