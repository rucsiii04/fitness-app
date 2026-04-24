import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import Avatar from "../ui/Avatar.jsx";
import * as I from "../ui/Icons.jsx";

const ADMIN_NAV = [
  { path: "/admin/dashboard", label: "Dashboard", icon: I.dash },
  { path: "/admin/classes", label: "Classes", icon: I.calendar },
  { path: "/admin/staff", label: "Staff", icon: I.users },
  { path: "/admin/memberships", label: "Memberships", icon: I.card },
  { path: "/admin/attendance", label: "Attendance", icon: I.qr },
  { path: "/admin/settings", label: "Gym Settings", icon: I.building },
];

const RECEPTION_NAV = [
  { path: "/reception/scan", label: "Scan QR", icon: I.qr },
  { path: "/reception/issue", label: "Issue Membership", icon: I.card },
];

const TRAINER_NAV = [
  { path: "/trainer/dashboard", label: "Dashboard", icon: I.dash },
  { path: "/trainer/clients", label: "Clients", icon: I.users },
  { path: "/trainer/builder", label: "Workout Builder", icon: I.dumbbell },
  { path: "/trainer/classes", label: "Classes", icon: I.calendar },
  { path: "/trainer/profile", label: "Public Profile", icon: I.user },
];

function NavItem({ path, label, icon: Icon, active }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(path)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        padding: "10px 14px",
        borderRadius: 10,
        background: active ? "rgba(224,251,76,.1)" : "transparent",
        color: active ? "var(--accent)" : "var(--text-muted)",
        textAlign: "left",
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: 0.02,
        position: "relative",
        transition: "all .15s",
      }}
      onMouseEnter={(e) =>
        !active &&
        ((e.currentTarget.style.background = "rgba(255,255,255,.03)"),
        (e.currentTarget.style.color = "var(--text)"))
      }
      onMouseLeave={(e) =>
        !active &&
        ((e.currentTarget.style.background = "transparent"),
        (e.currentTarget.style.color = "var(--text-muted)"))
      }
    >
      {active && (
        <span
          style={{
            position: "absolute",
            left: 0,
            top: 8,
            bottom: 8,
            width: 2,
            background: "var(--accent)",
            borderRadius: 2,
          }}
        />
      )}
      <span style={{ display: "flex", width: 16, height: 16 }}>
        <Icon width={16} height={16} />
      </span>
      <span
        style={{
          flex: 1,
          textTransform: "uppercase",
          fontFamily: "var(--display)",
          fontWeight: 600,
          letterSpacing: 0.06,
          fontSize: 11,
        }}
      >
        {label}
      </span>
    </button>
  );
}

export function Sidebar() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const role = user?.role;
  const nav =
    role === "trainer"
      ? TRAINER_NAV
      : role === "front_desk"
        ? RECEPTION_NAV
        : ADMIN_NAV;
  const eyebrow =
    role === "trainer"
      ? "Coaching"
      : role === "front_desk"
        ? "Reception"
        : "Operations";
  const roleLabel =
    role === "trainer"
      ? "Trainer"
      : role === "front_desk"
        ? "Front Desk"
        : "Gym Admin";
  const fullName = user ? `${user.first_name} ${user.last_name}` : "User";

  return (
    <aside
      style={{
        width: 240,
        flexShrink: 0,
        height: "100vh",
        background: "var(--bg)",
        borderRight: "1px solid var(--border-soft)",
        display: "flex",
        flexDirection: "column",
        padding: "20px 14px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "4px 8px 20px",
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "var(--accent)",
            color: "var(--accent-ink)",
            display: "grid",
            placeItems: "center",
            fontWeight: 900,
          }}
        >
          <I.bolt width={16} height={16} />
        </div>
        <div
          className="display upper"
          style={{ fontSize: 16, color: "var(--accent)", letterSpacing: 0.06 }}
        >
          Kinetic
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            background: "var(--teal)",
          }}
          className="pulse-dot"
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-dim)",
              fontFamily: "var(--mono)",
              textTransform: "uppercase",
              letterSpacing: 0.1,
            }}
          >
            {roleLabel}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text)",
              fontWeight: 500,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {fullName}
          </div>
        </div>
      </div>

      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          flex: 1,
          overflowY: "auto",
        }}
      >
        <div
          className="eyebrow"
          style={{ padding: "6px 14px 8px", fontSize: 10 }}
        >
          {eyebrow}
        </div>
        {nav.map((n) => (
          <NavItem key={n.path} {...n} active={location.pathname === n.path} />
        ))}
      </nav>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          paddingTop: 12,
          borderTop: "1px solid var(--border-soft)",
        }}
      >
        <button
          onClick={() => signOut()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            width: "100%",
            padding: "10px 14px",
            borderRadius: 10,
            color: "var(--text-muted)",
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            fontFamily: "var(--display)",
            letterSpacing: 0.06,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--coral)")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--text-muted)")
          }
        >
          <I.logout width={16} height={16} />
          Log out
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 8px",
            marginTop: 4,
          }}
        >
          <Avatar name={fullName} size={32} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {fullName}
            </div>
            <div
              className="mono"
              style={{ fontSize: 10, color: "var(--text-dim)" }}
            >
              {roleLabel.toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
