import React from "react";

export default function Field({ label, error, hint, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label className="eyebrow" style={{ color: "var(--text-muted)" }}>
          {label}
        </label>
      )}
      {children}
      {hint && !error && (
        <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{hint}</div>
      )}
      {error && (
        <div
          style={{
            fontSize: 12,
            color: "var(--red)",
            fontFamily: "var(--mono)",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
