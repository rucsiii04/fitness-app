import React, { useEffect } from "react";
import * as I from "./Icons.jsx";

export default function Modal({ open, onClose, title, width = 520, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        background: "rgba(5,5,5,.72)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        animation: "fade-in .2s",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: width,
          background: "var(--surface)",
          border: "1px solid var(--border-strong)",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,.5)",
        }}
      >
        {title && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "20px 24px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <h3
              className="display upper"
              style={{ margin: 0, fontSize: 16, letterSpacing: 0.04 }}
            >
              {title}
            </h3>
            <button
              onClick={onClose}
              style={{
                color: "var(--text-muted)",
                display: "flex",
                padding: 4,
              }}
            >
              <I.close width={18} height={18} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
