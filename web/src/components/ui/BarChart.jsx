import React from "react";

export default function BarChart({
  data,
  labels,
  height = 140,
  accent = "var(--accent)",
  benchmark,
}) {
  const max = Math.max(...data, benchmark || 0);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 6,
        height,
        position: "relative",
      }}
    >
      {benchmark !== undefined && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: `${(benchmark / max) * 100}%`,
            borderTop: "1px dashed var(--text-dim)",
            pointerEvents: "none",
          }}
        >
          <span
            className="mono"
            style={{
              position: "absolute",
              right: 0,
              top: -18,
              fontSize: 10,
              color: "var(--text-dim)",
            }}
          >
            avg · {benchmark}
          </span>
        </div>
      )}
      {data.map((v, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            height: "100%",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 28,
              height: `${(v / max) * 100}%`,
              background: i === data.length - 1 ? accent : "var(--surface-3)",
              borderRadius: "3px 3px 0 0",
              transition: "height .3s",
            }}
          />
          {labels && (
            <span
              className="mono"
              style={{ fontSize: 10, color: "var(--text-dim)" }}
            >
              {labels[i]}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
