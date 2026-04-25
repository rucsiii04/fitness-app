import React, { useState, useRef, useEffect } from "react";
import { useToast } from "../../context/ToastContext.jsx";
import { exportMemberships, exportUsers, exportCheckins } from "../../api/gymAdmin.js";
import * as I from "./Icons.jsx";

function todayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(new Blob([blob]));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const dateInputStyle = {
  background: "var(--surface-3)",
  border: "1px solid var(--border-strong)",
  borderRadius: 6,
  color: "var(--text)",
  fontSize: 11,
  fontFamily: "var(--mono)",
  padding: "3px 6px",
  outline: "none",
  width: "100%",
};

export default function ExportMenu({ gymId }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(null); 
  const [from, setFrom] = useState("");
  const [to, setTo] = useState(todayStr());
  const ref = useRef(null);

  useEffect(() => {
    function onOutsideClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  async function download(key, apiFn, filename) {
    if (loading) return;
    setLoading(key);
    try {
      const res = await apiFn();
      triggerDownload(res.data, filename);
      setOpen(false);
    } catch {
      toast("Export failed", "coral");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          height: 36,
          padding: "0 14px",
          background: "var(--surface-2)",
          border: "1px solid var(--border-strong)",
          borderRadius: "var(--radius)",
          color: "var(--text)",
          fontSize: 13,
          fontWeight: 500,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        <I.download width={14} height={14} />
        Export
        <span style={{ fontSize: 10, marginLeft: 2, opacity: 0.6 }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            minWidth: 220,
            background: "var(--surface)",
            border: "1px solid var(--border-strong)",
            borderRadius: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
            zIndex: 100,
            overflow: "hidden",
          }}
        >
          <div
            className="eyebrow"
            style={{ padding: "10px 14px 6px", fontSize: 9, color: "var(--text-dim)" }}
          >
            Download CSV
          </div>

          {/* Memberships */}
          <MenuItem
            label="Export Memberships"
            sub="Client, type, dates, status"
            loading={loading === "memberships"}
            onClick={() =>
              download(
                "memberships",
                () => exportMemberships(gymId),
                `memberships_${todayStr()}.csv`
              )
            }
          />

          <MenuItem
            label="Export Users"
            sub="Name, email, phone, role"
            loading={loading === "users"}
            onClick={() =>
              download(
                "users",
                () => exportUsers(gymId),
                `users_${todayStr()}.csv`
              )
            }
          />

          <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />

          <div style={{ padding: "10px 14px 12px" }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
              Export Check-ins
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
              <div>
                <div className="eyebrow" style={{ fontSize: 9, marginBottom: 3 }}>
                  From
                </div>
                <input
                  type="date"
                  value={from}
                  max={to || todayStr()}
                  onChange={(e) => setFrom(e.target.value)}
                  style={dateInputStyle}
                />
              </div>
              <div>
                <div className="eyebrow" style={{ fontSize: 9, marginBottom: 3 }}>
                  To
                </div>
                <input
                  type="date"
                  value={to}
                  max={todayStr()}
                  onChange={(e) => setTo(e.target.value)}
                  style={dateInputStyle}
                />
              </div>
            </div>
            <button
              disabled={!!loading}
              onClick={() =>
                download(
                  "checkins",
                  () => exportCheckins(gymId, from || undefined, to || undefined),
                  `checkins_${todayStr()}.csv`
                )
              }
              style={{
                width: "100%",
                height: 32,
                background: loading === "checkins" ? "var(--surface-3)" : "var(--accent)",
                color: loading === "checkins" ? "var(--text-dim)" : "var(--bg)",
                border: "none",
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "var(--mono)",
                letterSpacing: 0.5,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              {loading === "checkins" ? (
                "Downloading…"
              ) : (
                <>
                  <I.download width={12} height={12} />
                  {from || to ? "Download filtered" : "Download all"}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ label, sub, loading, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "9px 14px",
        background: "none",
        border: "none",
        textAlign: "left",
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.5 : 1,
      }}
      onMouseEnter={(e) => !loading && (e.currentTarget.style.background = "var(--surface-2)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{label}</div>
        <div className="mono" style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 1 }}>
          {sub}
        </div>
      </div>
      {loading ? (
        <span className="mono" style={{ fontSize: 10, color: "var(--text-dim)" }}>
          …
        </span>
      ) : (
        <I.download width={13} height={13} style={{ color: "var(--text-dim)", flexShrink: 0 }} />
      )}
    </button>
  );
}
