import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((msg, tone = "accent") => {
    const id = Math.random();
    setToasts((t) => [...t, { id, msg, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          zIndex: 200,
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="fade-in"
            style={{
              padding: "10px 16px",
              background: "var(--surface)",
              border: `1px solid ${t.tone === "accent" ? "rgba(224,251,76,.4)" : "var(--border-strong)"}`,
              borderLeft: `3px solid ${t.tone === "accent" ? "var(--accent)" : "var(--coral)"}`,
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 500,
              color: "var(--text)",
              minWidth: 260,
              boxShadow: "0 8px 24px rgba(0,0,0,.4)",
            }}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
