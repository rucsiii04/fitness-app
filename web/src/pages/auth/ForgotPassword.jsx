import React, { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../../api/auth.js";
import Btn from "../../components/ui/Btn.jsx";
import Field from "../../components/ui/Field.jsx";
import Input from "../../components/ui/Input.jsx";
import * as I from "../../components/ui/Icons.jsx";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        minHeight: "100vh",
      }}
    >
      {/* Left hero */}
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
        <div
          style={{
            position: "absolute",
            bottom: -100,
            right: -100,
            width: 400,
            height: 400,
            background:
              "radial-gradient(circle, rgba(56,214,196,.1), transparent 60%)",
            filter: "blur(60px)",
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
              id="g2"
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
          <rect width="100%" height="100%" fill="url(#g2)" />
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
            Secure Recovery · Encrypted end-to-end
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
            Reset.
            <br />
            Reload.
            <br />
            <span style={{ color: "var(--accent)" }}>Return.</span>
          </div>
          <div
            style={{
              fontSize: 16,
              color: "var(--text-muted)",
              maxWidth: 400,
              lineHeight: 1.5,
            }}
          >
            A quick flow to get you back on the floor. No delays. No detours.
          </div>
        </div>
        <div style={{ flex: 1 }} />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 40,
        }}
      >
        <div style={{ width: "100%", maxWidth: 420 }}>
          {!sent ? (
            <>
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  color: "var(--text-dim)",
                  letterSpacing: 0.1,
                  marginBottom: 10,
                }}
              >
                STEP 01 · REQUEST
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
                Forgot
                <br />
                password?
              </h1>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: 14,
                  marginBottom: 32,
                  lineHeight: 1.5,
                }}
              >
                Enter the email tied to your Kinetic account. We'll send a reset
                link.
              </p>
              <form
                onSubmit={handleSubmit}
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                <Field label="Email Address" error={error}>
                  <Input
                    icon={<I.mail />}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@kinetic.ro"
                    autoFocus
                    required
                  />
                </Field>
                <Btn
                  type="submit"
                  variant="primary"
                  size="lg"
                  icon={<I.arrowRight />}
                  disabled={loading}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </Btn>
                <div style={{ textAlign: "center" }}>
                  <Link
                    to="/login"
                    style={{
                      color: "var(--text-muted)",
                      fontSize: 13,
                      textDecoration: "none",
                    }}
                  >
                    ← Back to login
                  </Link>
                </div>
              </form>
            </>
          ) : (
            <div className="fade-in">
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  color: "var(--text-dim)",
                  letterSpacing: 0.1,
                  marginBottom: 10,
                }}
              >
                STEP 02 · CHECK INBOX
              </div>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 18,
                  background: "rgba(224,251,76,.1)",
                  border: "1px solid rgba(224,251,76,.3)",
                  display: "grid",
                  placeItems: "center",
                  color: "var(--accent)",
                  marginBottom: 20,
                }}
              >
                <I.mail width={32} height={32} />
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
                Check
                <br />
                your inbox.
              </h1>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: 14,
                  marginBottom: 24,
                  lineHeight: 1.5,
                }}
              >
                We sent a recovery link to{" "}
                <b style={{ color: "var(--text)" }}>{email}</b>. The link
                expires in 30 minutes.
              </p>
              <div
                style={{
                  padding: 14,
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <I.clock
                  width={18}
                  height={18}
                  style={{ color: "var(--text-dim)", flexShrink: 0 }}
                />
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Check spam if you don't see it within a minute.
                </div>
              </div>
              <Link to="/login">
                <Btn
                  variant="outline"
                  size="lg"
                  icon={<I.chevL />}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Back to login
                </Btn>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
