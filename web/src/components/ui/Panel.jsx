import React from "react";

export default function Panel({ title, eyebrow, children, action, style }) {
  return (
    <div className="card" style={{ padding: 22, ...style }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          {eyebrow && (
            <div className="eyebrow" style={{ marginBottom: 4 }}>
              {eyebrow}
            </div>
          )}
          <h3
            className="display upper"
            style={{
              margin: 0,
              fontSize: 14,
              letterSpacing: 0.04,
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
