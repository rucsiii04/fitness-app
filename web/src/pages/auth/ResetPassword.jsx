import React, { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { resetPasswordWithToken } from "../../api/auth.js";
import Btn from "../../components/ui/Btn.jsx";
import Field from "../../components/ui/Field.jsx";
import Input from "../../components/ui/Input.jsx";
import * as I from "../../components/ui/Icons.jsx";

function pwStrength(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");
  const userId = params.get("userId");

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const strength = pwStrength(pw);
  const pwMatch = pw && pw2 && pw === pw2;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (strength < 3 || !pwMatch) return;
    setError("");
    setLoading(true);
    try {
      await resetPasswordWithToken(userId, token, pw);
      setDone(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Link invalid sau expirat. Solicită unul nou.",
      );
    } finally {
      setLoading(false);
    }
  };

  const invalid = !token || !userId;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, #0a0a0a 0%, #141408 50%, #0d0d0d 100%)",
          padding: 56,
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid var(--border-soft)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "20%",
            width: 600,
            height: 600,
            background:
              "radial-gradient(circle, rgba(224,251,76,.18), transparent 60%)",
            filter: "blur(80px)",
            pointerEvents: "none",
          }}
        />
        <svg
          style={{ position: "absolute", inset: 0, opacity: 0.25 }}
          width="100%"
          height="100%"
        >
          <defs>
            <pattern
              id="g3"
              width="48"
              height="48"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 48 0 L 0 0 0 48"
                fill="none"
                stroke="rgba(224,251,76,.08)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#g3)" />
        </svg>

        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "var(--accent)",
              color: "var(--accent-ink)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <I.bolt width={20} height={20} />
          </div>
          <div
            className="display upper"
            style={{
              fontSize: 20,
              color: "var(--accent)",
              letterSpacing: 0.08,
            }}
          >
            Kinetic
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ position: "relative" }}>
          <div
            className="eyebrow"
            style={{ color: "var(--teal)", marginBottom: 18 }}
          >
            <span
              className="pulse-dot"
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: 3,
                background: "var(--teal)",
                marginRight: 6,
                verticalAlign: "middle",
              }}
            />
            Recuperare Securizată
          </div>
          <div
            className="display"
            style={{
              fontSize: 72,
              lineHeight: 0.95,
              letterSpacing: -0.02,
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Credențiale
            <br />
            noi.
            <br />
            <span style={{ color: "var(--accent)" }}>Start proaspăt.</span>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Step trail */}
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 3,
                  background: (done ? i <= 3 : i <= 2)
                    ? "var(--accent)"
                    : "var(--surface-3)",
                  borderRadius: 2,
                  transition: "background .3s",
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {["SOLICITARE", "VERIFICARE", "SETARE", "COMPLET"].map((l, i) => (
              <div
                key={l}
                className="mono"
                style={{
                  fontSize: 10,
                  color: (done ? i <= 3 : i <= 2)
                    ? "var(--accent)"
                    : "var(--text-dim)",
                  letterSpacing: 0.1,
                }}
              >
                {String(i + 1).padStart(2, "0")} · {l}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 40,
        }}
      >
        <div style={{ width: "100%", maxWidth: 420 }}>
          {invalid && (
            <div className="fade-in">
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 18,
                  background: "rgba(255,85,102,.1)",
                  border: "1px solid rgba(255,85,102,.3)",
                  display: "grid",
                  placeItems: "center",
                  color: "var(--red)",
                  marginBottom: 20,
                }}
              >
                <I.close width={32} height={32} />
              </div>
              <h1
                className="display upper"
                style={{ fontSize: 32, margin: "0 0 12px", lineHeight: 1 }}
              >
                Link invalid
              </h1>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: 14,
                  marginBottom: 24,
                }}
              >
                Acest link de resetare este invalid sau a expirat.
              </p>
              <Link to="/forgot-password">
                <Btn
                  variant="primary"
                  size="lg"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Solicită un link nou
                </Btn>
              </Link>
            </div>
          )}

          {!invalid && !done && (
            <form onSubmit={handleSubmit} className="fade-in">
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  color: "var(--text-dim)",
                  letterSpacing: 0.1,
                  marginBottom: 10,
                }}
              >
                PAS 03 · SETEAZĂ PAROLA
              </div>
              <h1
                className="display upper"
                style={{
                  fontSize: 36,
                  margin: "0 0 12px",
                  letterSpacing: -0.01,
                  lineHeight: 1,
                }}
              >
                Credențiale
                <br />
                noi.
              </h1>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: 14,
                  marginBottom: 24,
                  lineHeight: 1.5,
                }}
              >
                Alege o parolă puternică pe care nu ai mai folosit-o.
              </p>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <Field label="Parolă Nouă">
                  <Input
                    icon={<I.lock />}
                    type={showPw ? "text" : "password"}
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    placeholder="••••••••"
                    autoFocus
                    right={
                      <button
                        type="button"
                        onClick={() => setShowPw((s) => !s)}
                        style={{ color: "var(--text-dim)", padding: 4 }}
                      >
                        {showPw ? (
                          <I.eyeOff width={16} height={16} />
                        ) : (
                          <I.eye width={16} height={16} />
                        )}
                      </button>
                    }
                  />
                </Field>

                <div>
                  <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: 3,
                          borderRadius: 2,
                          background:
                            i < strength
                              ? strength < 2
                                ? "var(--coral)"
                                : strength < 4
                                  ? "#ffb94a"
                                  : "var(--accent)"
                              : "var(--surface-3)",
                          transition: "background .2s",
                        }}
                      />
                    ))}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 6,
                    }}
                  >
                    {[
                      { c: pw.length >= 8, l: "8+ caractere" },
                      { c: /[A-Z]/.test(pw), l: "Literă mare" },
                      { c: /[0-9]/.test(pw), l: "Cifră" },
                      { c: /[^A-Za-z0-9]/.test(pw), l: "Simbol" },
                    ].map((r) => (
                      <div
                        key={r.l}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 11,
                          color: r.c ? "var(--accent)" : "var(--text-dim)",
                          fontFamily: "var(--mono)",
                        }}
                      >
                        <span style={{ display: "flex" }}>
                          {r.c ? (
                            <I.check width={10} height={10} />
                          ) : (
                            <span
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: 5,
                                border: "1px solid currentColor",
                                display: "inline-block",
                              }}
                            />
                          )}
                        </span>
                        {r.l}
                      </div>
                    ))}
                  </div>
                </div>

                <Field
                  label="Confirmă Parola"
                  error={pw2 && !pwMatch ? "Parolele nu coincid" : ""}
                >
                  <Input
                    icon={<I.lock />}
                    type={showPw ? "text" : "password"}
                    value={pw2}
                    onChange={(e) => setPw2(e.target.value)}
                    placeholder="••••••••"
                    error={pw2 && !pwMatch}
                    right={
                      pw2 &&
                      pwMatch && (
                        <span
                          style={{ color: "var(--accent)", display: "flex" }}
                        >
                          <I.check width={16} height={16} />
                        </span>
                      )
                    }
                  />
                </Field>

                {error && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--red)",
                      fontFamily: "var(--mono)",
                      padding: "10px 12px",
                      background: "rgba(255,85,102,.08)",
                      border: "1px solid rgba(255,85,102,.2)",
                      borderRadius: 8,
                    }}
                  >
                    {error}
                  </div>
                )}

                <Btn
                  type="submit"
                  variant="primary"
                  size="lg"
                  icon={<I.arrowRight />}
                  disabled={strength < 3 || !pwMatch || loading}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  {loading ? "Se actualizează..." : "Actualizează Parola"}
                </Btn>
              </div>
            </form>
          )}

          {!invalid && done && (
            <div className="fade-in" style={{ textAlign: "center" }}>
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  color: "var(--accent)",
                  letterSpacing: 0.1,
                  marginBottom: 10,
                }}
              >
                PAS 04 · COMPLET
              </div>
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  margin: "0 auto 24px",
                  background: "var(--accent)",
                  color: "var(--accent-ink)",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: "0 0 60px rgba(224,251,76,.4)",
                }}
              >
                <I.check width={44} height={44} />
              </div>
              <h1
                className="display upper"
                style={{
                  fontSize: 40,
                  margin: "0 0 12px",
                  letterSpacing: -0.01,
                  lineHeight: 1,
                }}
              >
                Parolă
                <br />
                resetată.
              </h1>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: 14,
                  marginBottom: 32,
                  lineHeight: 1.5,
                  maxWidth: 320,
                  margin: "0 auto 32px",
                }}
              >
                Parola ta a fost actualizată. Autentifică-te cu noile credențiale.
              </p>
              <Btn
                variant="primary"
                size="lg"
                icon={<I.arrowRight />}
                onClick={() => navigate("/login")}
                style={{ width: "100%", justifyContent: "center" }}
              >
                Continuă la Autentificare
              </Btn>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
