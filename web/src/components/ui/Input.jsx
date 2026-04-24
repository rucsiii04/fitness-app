import React from "react";

export default function Input({ icon, right, error, style, ...rest }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "var(--surface-2)",
        border: `1px solid ${error ? "var(--red)" : "var(--border-strong)"}`,
        borderRadius: 10,
        padding: "0 12px",
        height: 44,
        transition: "border-color .15s",
        ...style,
      }}
    >
      {icon && (
        <span style={{ color: "var(--text-dim)", display: "flex" }}>
          {React.cloneElement(icon, { width: 16, height: 16 })}
        </span>
      )}
      <input
        {...rest}
        style={{
          flex: 1,
          background: "transparent",
          border: "none",
          outline: "none",
          color: "var(--text)",
          fontSize: 14,
          minWidth: 0,
        }}
      />
      {right}
    </div>
  );
}
