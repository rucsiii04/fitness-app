import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  getMyGyms,
  getAttendanceStats,
  getRevenueStats,
} from "../../api/gymAdmin.js";
import { getMembershipTypesForAdmin } from "../../api/memberships.js";
import { getSessionsByGym } from "../../api/classes.js";
import TopBar from "../../components/layout/TopBar.jsx";
import Panel from "../../components/ui/Panel.jsx";
import Btn from "../../components/ui/Btn.jsx";
import Pill from "../../components/ui/Pill.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import Progress from "../../components/ui/Progress.jsx";
import Sparkline from "../../components/ui/Sparkline.jsx";
import BarChart from "../../components/ui/BarChart.jsx";
import * as I from "../../components/ui/Icons.jsx";

const COLORS = ["var(--accent)", "var(--teal)", "var(--coral)", "#c79bff"];

function KPICard({ label, value, total, delta, data, tone = "neutral" }) {
  const colors = {
    neutral: "var(--text)",
    accent: "var(--accent)",
    coral: "var(--coral)",
  };
  return (
    <div
      className="card"
      style={{ padding: 18, position: "relative", overflow: "hidden" }}
    >
      <div className="eyebrow" style={{ marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <div
          className="display"
          style={{ fontSize: 28, color: colors[tone], lineHeight: 1 }}
        >
          {value}
        </div>
        {total && (
          <div
            className="mono"
            style={{ fontSize: 12, color: "var(--text-dim)" }}
          >
            / {total}
          </div>
        )}
      </div>
      <div
        style={{
          marginTop: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div className="mono" style={{ fontSize: 10, color: "var(--accent)" }}>
          {delta}
        </div>
        {data && <Sparkline data={data} width={90} height={24} fill={false} />}
      </div>
    </div>
  );
}

function KV({ label, value, tone }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div className="eyebrow" style={{ fontSize: 10 }}>
        {label}
      </div>
      <div
        className="display"
        style={{
          fontSize: 20,
          color:
            tone === "accent"
              ? "var(--accent)"
              : tone === "coral"
                ? "var(--coral)"
                : "var(--text)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [gyms, setGyms] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);

  const gymId = user?.gym_id;

  useEffect(() => {
    const fetches = [
      getMyGyms()
        .then((r) => setGyms(r.data))
        .catch(() => {}),
    ];
    if (gymId) {
      fetches.push(
        getMembershipTypesForAdmin(gymId)
          .then((r) => setMemberships(r.data))
          .catch(() => {}),
        getSessionsByGym(gymId)
          .then((r) => setSessions(r.data))
          .catch(() => {}),
        getAttendanceStats(gymId)
          .then((r) => setAttendance(r.data))
          .catch(() => {}),
        getRevenueStats(gymId)
          .then((r) => setRevenue(r.data))
          .catch(() => {}),
      );
    }
    Promise.all(fetches).finally(() => setLoading(false));
  }, [gymId]);

  const gym = gyms[0];
  const todaySessions = sessions.filter(
    (s) => new Date(s.start_time).toDateString() === new Date().toDateString(),
  );

  const hourly = attendance?.hourly || Array(24).fill(0);
  const peakHour = hourly.indexOf(Math.max(...hourly));
  const monthly = revenue?.monthly || Array(6).fill(0);
  const mrr = revenue?.mrr ?? 0;

  return (
    <div
      style={{ padding: 32, display: "flex", flexDirection: "column", gap: 24 }}
    >
      <div
        className="card"
        style={{
          padding: 28,
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%)",
          marginBottom: 4,
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -40,
            top: -40,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(224,251,76,.15), transparent 70%)",
          }}
        />
        <div
          className="eyebrow"
          style={{ color: "var(--teal)", marginBottom: 8 }}
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
          Operations Active
        </div>
        <div
          className="display"
          style={{ fontSize: 28, lineHeight: 1.05, marginBottom: 4 }}
        >
          {gym?.name || "Your Gym"} —{" "}
          <span style={{ color: "var(--accent)" }}>Dashboard</span>
        </div>
        <div style={{ color: "var(--text-muted)", marginBottom: 16 }}>
          {gym?.address || "Manage your gym's operations below."}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn
            variant="primary"
            icon={<I.users />}
            onClick={() => navigate("/admin/staff")}
          >
            Manage Staff
          </Btn>
          <Btn
            variant="outline"
            icon={<I.calendar />}
            onClick={() => navigate("/admin/classes")}
          >
            View Schedule
          </Btn>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
        }}
      >
        <KPICard
          label="Membership Plans"
          value={memberships.length}
          delta="Active tiers"
        />
        <KPICard
          label="Today's Classes"
          value={todaySessions.length}
          delta="Scheduled today"
          tone="accent"
        />
        <KPICard
          label="Check-ins Today"
          value={attendance?.today ?? 0}
          delta="Via QR scanner"
        />
        <KPICard
          label="MRR (est.)"
          value={`RON ${mrr.toLocaleString()}`}
          delta="Active memberships"
          data={monthly}
          tone="coral"
        />
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}
      >
        <Panel title="Check-ins · Today by hour" eyebrow="Peak traffic">
          <div style={{ padding: "12px 0 4px" }}>
            <BarChart
              data={hourly}
              labels={hourly.map((_, i) => (i % 3 === 0 ? String(i) : ""))}
              height={180}
              benchmark={Math.max(...hourly) * 0.7 || 1}
            />
          </div>
          <div
            style={{
              display: "flex",
              gap: 24,
              paddingTop: 14,
              borderTop: "1px solid var(--border-soft)",
            }}
          >
            <KV label="Today" value={attendance?.today ?? 0} />
            <KV
              label="Peak Hour"
              value={
                hourly.some(Boolean)
                  ? `${String(peakHour).padStart(2, "0")}:00`
                  : "—"
              }
            />
            <KV
              label="This Week"
              value={attendance?.thisWeek ?? 0}
              tone="accent"
            />
          </div>
        </Panel>

        <Panel
          title="Revenue"
          eyebrow="Last 6 months"
          action={
            <Btn
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin/memberships")}
            >
              Plans →
            </Btn>
          }
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div className="display" style={{ fontSize: 36, lineHeight: 1 }}>
              RON {mrr.toLocaleString()}
            </div>
            <div style={{ paddingBottom: 4 }}>
              <Pill tone={mrr > 0 ? "green" : "muted"}>
                {revenue?.activeMemberships ?? 0} active
              </Pill>
            </div>
          </div>
          <Sparkline
            data={monthly.length ? monthly : [0]}
            width={340}
            height={80}
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginTop: 14,
            }}
          >
            <div
              style={{
                padding: 10,
                background: "var(--surface-2)",
                borderRadius: 8,
              }}
            >
              <div className="eyebrow" style={{ fontSize: 10 }}>
                Est. MRR
              </div>
              <div
                className="display"
                style={{ fontSize: 18, color: "var(--accent)" }}
              >
                RON {mrr.toLocaleString()}
              </div>
            </div>
            <div
              style={{
                padding: 10,
                background: "var(--surface-2)",
                borderRadius: 8,
              }}
            >
              <div className="eyebrow" style={{ fontSize: 10 }}>
                Active Members
              </div>
              <div
                className="display"
                style={{ fontSize: 18, color: "var(--teal)" }}
              >
                {revenue?.activeMemberships ?? 0}
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}
      >
        <Panel title="Today's Classes" eyebrow="Live schedule">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {todaySessions.length === 0 ? (
              <div
                style={{
                  padding: "24px 0",
                  textAlign: "center",
                  color: "var(--text-dim)",
                  fontSize: 12,
                }}
              >
                No classes today.
              </div>
            ) : (
              todaySessions.slice(0, 5).map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 0",
                    borderBottom: "1px solid var(--border-soft)",
                  }}
                >
                  <div
                    className="mono"
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--accent)",
                      width: 48,
                    }}
                  >
                    {new Date(s.start_time).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>
                      {s.class_type?.name || "Class"}
                    </div>
                    <div
                      className="mono"
                      style={{ fontSize: 10, color: "var(--text-dim)" }}
                    >
                      {s.enrollment_count || 0}/{s.max_capacity}
                    </div>
                  </div>
                  <Progress
                    value={(s.enrollment_count / s.max_capacity) * 100}
                    style={{ width: 60 }}
                  />
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel
          title="Membership Plans"
          eyebrow="Tiers"
          action={
            <Btn
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin/memberships")}
            >
              Manage →
            </Btn>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {memberships.length === 0 ? (
              <div
                style={{
                  padding: "24px 0",
                  textAlign: "center",
                  color: "var(--text-dim)",
                  fontSize: 12,
                }}
              >
                No plans yet.
              </div>
            ) : (
              memberships.map((m, i) => (
                <div key={m.membership_type_id || i}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 6,
                      fontSize: 12,
                    }}
                  >
                    <span
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          background: COLORS[i % COLORS.length],
                        }}
                      />
                      {m.name}
                    </span>
                    <span
                      className="mono"
                      style={{ color: "var(--text-muted)" }}
                    >
                      RON {m.price}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel title="Gym Info" eyebrow="Your profile">
          {gym ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <div
                  className="eyebrow"
                  style={{ fontSize: 9, marginBottom: 4 }}
                >
                  Name
                </div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{gym.name}</div>
              </div>
              <div>
                <div
                  className="eyebrow"
                  style={{ fontSize: 9, marginBottom: 4 }}
                >
                  Address
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {gym.address}
                </div>
              </div>
              <div>
                <div
                  className="eyebrow"
                  style={{ fontSize: 9, marginBottom: 4 }}
                >
                  City
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {gym.city}
                </div>
              </div>
              <Btn
                variant="outline"
                size="sm"
                icon={<I.settings />}
                onClick={() => navigate("/admin/settings")}
                style={{ marginTop: 4 }}
              >
                Edit settings
              </Btn>
            </div>
          ) : (
            <div style={{ padding: "24px 0", textAlign: "center" }}>
              <div
                style={{
                  color: "var(--text-dim)",
                  fontSize: 12,
                  marginBottom: 12,
                }}
              >
                No gym set up yet.
              </div>
              <Btn
                variant="primary"
                size="sm"
                icon={<I.plus />}
                onClick={() => navigate("/admin/settings")}
              >
                Create gym
              </Btn>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
