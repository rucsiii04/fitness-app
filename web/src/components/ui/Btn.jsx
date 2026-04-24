import React from "react";

const VARIANTS = {
  primary: {
    background: "var(--accent)",
    color: "var(--accent-ink)",
    border: "1px solid var(--accent)",
  },
  secondary: {
    background: "var(--surface-2)",
    color: "var(--text)",
    border: "1px solid var(--border-strong)",
  },
  ghost: {
    background: "transparent",
    color: "var(--text-muted)",
    border: "1px solid transparent",
  },
  outline: {
    background: "transparent",
    color: "var(--text)",
    border: "1px solid var(--border-strong)",
  },
  danger: {
    background: "transparent",
    color: "var(--red)",
    border: "1px solid #44272c",
  },
  coral: {
    background: "var(--coral)",
    color: "#1a0c07",
    border: "1px solid var(--coral)",
  },
};

export default function Btn({
  variant = "primary",
  size = "md",
  icon,
  children,
  onClick,
  disabled,
  style,
  type,
}) {
  const h = size === "sm" ? 32 : size === "lg" ? 48 : 40;
  const pad = size === "sm" ? "0 12px" : size === "lg" ? "0 20px" : "0 16px";
  const fs = size === "sm" ? 12 : 13;
  const iconSize = size === "sm" ? 14 : 16;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        height: h,
        padding: pad,
        borderRadius: 10,
        fontSize: fs,
        fontWeight: 600,
        letterSpacing: 0.02,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        textTransform: "uppercase",
        fontFamily: "var(--sans)",
        opacity: disabled ? 0.4 : 1,
        transition: "all .15s",
        ...VARIANTS[variant],
        ...style,
      }}
      onMouseEnter={(e) =>
        !disabled && (e.currentTarget.style.filter = "brightness(1.08)")
      }
      onMouseLeave={(e) => !disabled && (e.currentTarget.style.filter = "none")}
    >
      {icon && React.cloneElement(icon, { width: iconSize, height: iconSize })}
      {children}
    </button>
  );
}
