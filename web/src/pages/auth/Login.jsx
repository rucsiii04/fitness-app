import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { login } from "../../api/auth.js";
import Btn from "../../components/ui/Btn.jsx";
import Field from "../../components/ui/Field.jsx";
import Input from "../../components/ui/Input.jsx";
import * as I from "../../components/ui/Icons.jsx";

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login(email, password);
      const { token, user } = res.data;
      const staffRoles = ["gym_admin", "front_desk"];
      if (!staffRoles.includes(user.role)) {
        setError("This portal is for gym staff only. Clients and trainers use the mobile app.");
        return;
      }
      signIn(token, user);
      navigate(user.role === "front_desk" ? "/reception/scan" : "/admin/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password.");
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
        <svg
          style={{ position: "absolute", inset: 0, opacity: 0.25 }}
          width="100%"
          height="100%"
        >
          <defs>
            <pattern
              id="lgrid"
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
          <rect width="100%" height="100%" fill="url(#lgrid)" />
        </svg>
        <I.bolt
          style={{
            position: "absolute",
            right: -80,
            top: "30%",
            opacity: 0.06,
            width: 500,
            height: 500,
          }}
        />

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
            Trainer & Admin Portal
          </div>
          <div
            className="display"
            style={{
              fontSize: 68,
              lineHeight: 0.95,
              letterSpacing: -0.02,
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            Train.
            <br />
            Manage.
            <br />
            <span style={{ color: "var(--accent)" }}>Perform.</span>
          </div>
          <div
            style={{
              fontSize: 15,
              color: "var(--text-muted)",
              maxWidth: 380,
              lineHeight: 1.6,
            }}
          >
            Your complete platform for coaching clients, managing programs, and
            running your gym.
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
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--text-dim)",
              letterSpacing: 0.1,
              marginBottom: 10,
            }}
          >
            WELCOME BACK
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
            Sign in to
            <br />
            Kinetic.
          </h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: 14,
              marginBottom: 32,
              lineHeight: 1.5,
            }}
          >
            Gym admin or front desk account required.
          </p>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <Field label="Email">
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
            <Field label="Password">
              <Input
                icon={<I.lock />}
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
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
              disabled={loading}
              style={{ width: "100%", justifyContent: "center" }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Btn>

            <div style={{ textAlign: "center" }}>
              <Link
                to="/forgot-password"
                style={{
                  color: "var(--text-muted)",
                  fontSize: 13,
                  textDecoration: "none",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--text)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--text-muted)")
                }
              >
                Forgot password?
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
