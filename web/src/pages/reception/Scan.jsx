import React, { useState, useCallback } from "react";
import TopBar from "../../components/layout/TopBar.jsx";
import QrScanner from "../../components/ui/QrScanner.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import Btn from "../../components/ui/Btn.jsx";
import Pill from "../../components/ui/Pill.jsx";
import * as I from "../../components/ui/Icons.jsx";
import { scanQR } from "../../api/reception.js";

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function ResultCard({ result, error, onReset }) {
  const ok = Boolean(result);
  return (
    <div
      style={{
        borderRadius: 16,
        border: `1px solid ${ok ? "rgba(125,216,125,.3)" : "rgba(255,85,102,.3)"}`,
        background: ok ? "rgba(125,216,125,.06)" : "rgba(255,85,102,.06)",
        padding: 32,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          background: ok ? "rgba(125,216,125,.15)" : "rgba(255,85,102,.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: ok ? "var(--green)" : "var(--red)",
        }}
      >
        {ok ? (
          <I.check width={28} height={28} />
        ) : (
          <I.close width={28} height={28} />
        )}
      </div>

      {ok ? (
        <>
          <div>
            <div
              style={{
                fontSize: 11,
                fontFamily: "var(--mono)",
                textTransform: "uppercase",
                letterSpacing: 0.1,
                color: "var(--green)",
                marginBottom: 10,
              }}
            >
              Access Granted
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <Avatar name={result.name} size={40} />
              <div className="display" style={{ fontSize: 22 }}>
                {result.name}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Pill tone="green">{result.membership_type}</Pill>
              <Pill tone="muted">Expires {fmtDate(result.expires_at)}</Pill>
            </div>
          </div>
        </>
      ) : (
        <div>
          <div
            style={{
              fontSize: 11,
              fontFamily: "var(--mono)",
              textTransform: "uppercase",
              letterSpacing: 0.1,
              color: "var(--red)",
              marginBottom: 8,
            }}
          >
            Access Denied
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
            {error}
          </div>
        </div>
      )}

      <Btn variant="outline" icon={<I.qr />} onClick={onReset}>
        Scan Another
      </Btn>
    </div>
  );
}

export default function ReceptionScan() {
  const [phase, setPhase] = useState("scanning"); // scanning or loading or done
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleScan = useCallback(async (token) => {
    setPhase("loading");
    try {
      const res = await scanQR(token);
      setResult(res.data.client);
      setError(null);
    } catch (err) {
      setResult(null);
      setError(err.response?.data?.message || "Scan failed");
    }
    setPhase("done");
  }, []);

  function reset() {
    setPhase("scanning");
    setResult(null);
    setError(null);
  }

  return (
    <>
      <TopBar title="Scan QR" eyebrow="Check-in" />
      <div style={{ padding: 32, maxWidth: 520, margin: "0 auto" }}>
        {phase === "scanning" && <QrScanner onScan={handleScan} />}

        {phase === "loading" && (
          <div
            style={{
              borderRadius: 16,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              padding: 48,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "2px solid var(--accent)",
                borderTopColor: "transparent",
                animation: "spin 0.7s linear infinite",
              }}
            />
            <div
              className="mono"
              style={{
                fontSize: 12,
                color: "var(--text-dim)",
                textTransform: "uppercase",
                letterSpacing: 0.1,
              }}
            >
              Validating...
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {phase === "done" && (
          <ResultCard result={result} error={error} onReset={reset} />
        )}
      </div>
    </>
  );
}
