import React from "react";
import Input from "../ui/Input.jsx";
import * as I from "../ui/Icons.jsx";

export default function TopBar({ title, eyebrow, actions, search, onSearch }) {
  return (
    <div style={{
      padding: "22px 32px 18px",
      borderBottom: "1px solid var(--border-soft)",
      display: "flex", alignItems: "flex-end", gap: 24,
      position: "sticky", top: 0, background: "var(--bg)", zIndex: 5,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {eyebrow && (
          <div className="eyebrow" style={{ color: "var(--teal)", marginBottom: 4 }}>{eyebrow}</div>
        )}
        <h1 className="display upper" style={{ margin: 0, fontSize: 28, letterSpacing: -0.01, lineHeight: 1 }}>
          {title}
        </h1>
      </div>
      {search !== undefined && (
        <Input
          icon={<I.search />}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search..."
          style={{ width: 280, height: 38 }}
        />
      )}
      {actions}
    </div>
  );
}
