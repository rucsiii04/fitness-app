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

function KV({ label, value, tone, small }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div className="eyebrow" style={{ fontSize: 9 }}>
        {label}
      </div>
      <div
        className="display"
        style={{
          fontSize: small ? 15 : 18,
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
  const activeAlert =
    gym?.alert_message &&
    (!gym.alert_expires_at || new Date(gym.alert_expires_at) > new Date());

  const todaySessions = sessions.filter(
    (s) => new Date(s.start_datetime).toDateString() === new Date().toDateString(),
  );

  const hourly = attendance?.hourly || Array(24).fill(0);
  const peakHour = hourly.indexOf(Math.max(...hourly));
  const monthly = revenue?.monthly || Array(6).fill(0);
  const daily = attendance?.daily || Array(7).fill(0);
  const DAY_SHORT = ["Lun", "Mar", "Mie", "Joi", "Vin", "Sâm", "Dum"];
  const DAY_FULL = [
    "Luni",
    "Marți",
    "Miercuri",
    "Joi",
    "Vineri",
    "Sâmbătă",
    "Duminică",
  ];
  const liveCount = attendance?.liveCount ?? 0;
  const avgPerDay = attendance?.avgPerDay ?? 0;
  const peakDayIdx = daily.some(Boolean)
    ? daily.indexOf(Math.max(...daily))
    : -1;
  const currentMonthRevenue = revenue?.currentMonthRevenue ?? 0;

  const MONTHS_RO = [
    "Ian",
    "Feb",
    "Mar",
    "Apr",
    "Mai",
    "Iun",
    "Iul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const now = new Date();
  const monthLabels = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return MONTHS_RO[d.getMonth()];
  });

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
          style={{ color: activeAlert ? "var(--coral)" : "var(--teal)", marginBottom: 8 }}
        >
          <span
            className="pulse-dot"
            style={{
              display: "inline-block",
              width: 6,
              height: 6,
              borderRadius: 3,
              background: activeAlert ? "var(--coral)" : "var(--teal)",
              marginRight: 6,
              verticalAlign: "middle",
            }}
          />
          {activeAlert ? "Alertă Activă · Sală Închisă" : "Operațiuni Active"}
        </div>
        {activeAlert && (
          <div
            style={{
              marginBottom: 8,
              padding: "8px 12px",
              background: "rgba(255,115,81,.1)",
              border: "1px solid rgba(255,115,81,.25)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--coral)",
              display: "inline-block",
            }}
          >
            {gym.alert_message}
          </div>
        )}
        <div
          className="display"
          style={{ fontSize: 28, lineHeight: 1.05, marginBottom: 4 }}
        >
          {gym?.name || "Sala ta"} -{" "}
          <span style={{ color: "var(--accent)" }}>Dashboard</span>
        </div>
        <div style={{ color: "var(--text-muted)", marginBottom: 16 }}>
          {gym?.address || "Gestionează operațiunile sălii mai jos."}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn
            variant="primary"
            icon={<I.users />}
            onClick={() => navigate("/admin/staff")}
          >
            Gestionează personal
          </Btn>
          <Btn
            variant="outline"
            icon={<I.calendar />}
            onClick={() => navigate("/admin/classes")}
          >
            Vezi programul
          </Btn>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 16,
        }}
      >
        <KPICard
          label="Planuri abonament"
          value={memberships.length}
          delta="Tipuri active"
        />
        <KPICard
          label="Clase azi"
          value={todaySessions.length}
          delta="Programate azi"
          tone="accent"
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "0.55fr 1fr 1fr",
          gap: 20,
        }}
      >
        <Panel
          title="Check-in-uri azi"
          eyebrow="De la deschidere până acum"
          style={{ padding: 16, display: "flex", flexDirection: "column" }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "space-evenly",
              flex: 1,
              paddingBottom: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                className="pulse-dot"
                style={{
                  display: "inline-block",
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  background: "var(--accent)",
                }}
              />
              <span className="eyebrow" style={{ fontSize: 9 }}>
                clienți intrați azi
              </span>
            </div>
            <div
              className="display"
              style={{
                fontSize: 44,
                lineHeight: 1,
                color:
                  (attendance?.today ?? 0) > 0
                    ? "var(--accent)"
                    : "var(--text-dim)",
              }}
            >
              {attendance?.today ?? 0}
            </div>
          </div>
        </Panel>

        <Panel
          title="Flux pe zile"
          eyebrow="Săptămâna curentă"
          style={{ padding: 16 }}
        >
          <div style={{ padding: "8px 0 4px" }}>
            <BarChart
              data={daily}
              labels={DAY_SHORT}
              height={140}
              benchmark={avgPerDay || 1}
            />
          </div>
          <div
            style={{
              display: "flex",
              gap: 20,
              paddingTop: 14,
              borderTop: "1px solid var(--border-soft)",
            }}
          >
            <KV
              label="Cea mai aglomerată"
              value={peakDayIdx >= 0 ? DAY_FULL[peakDayIdx] : "-"}
              tone="accent"
            />
            <KV
              label={
                peakDayIdx >= 0
                  ? `Check-in-uri ${DAY_FULL[peakDayIdx]}`
                  : "Vârf"
              }
              value={peakDayIdx >= 0 ? daily[peakDayIdx] : "-"}
            />
            <KV label="Medie / zi" value={avgPerDay} />
          </div>
        </Panel>

        <Panel
          title="Venituri"
          eyebrow="Luna curentă · Ultimele 6 luni"
          style={{ padding: 16 }}
          action={
            <Btn
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin/memberships")}
            >
              Planuri →
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
              RON {currentMonthRevenue.toLocaleString()}
            </div>
            <div style={{ paddingBottom: 4 }}>
              <Pill tone={currentMonthRevenue > 0 ? "green" : "muted"}>
                {revenue?.activeMemberships ?? 0} active
              </Pill>
            </div>
          </div>
          <BarChart
            data={monthly.length ? monthly : Array(6).fill(0)}
            labels={monthLabels}
            height={80}
            formatValue={(v) => `RON ${v.toLocaleString()}`}
          />
        </Panel>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}
      >
        <Panel title="Clase azi" eyebrow="Program live">
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
                Nicio clasă azi.
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
                    {new Date(s.start_datetime).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>
                      {s.Class_Type?.name || "Clasă"}
                    </div>
                    <div
                      className="mono"
                      style={{ fontSize: 10, color: "var(--text-dim)" }}
                    >
                      {s.confirmed_count || 0}/{s.max_participants}
                    </div>
                  </div>
                  <Progress
                    value={((s.confirmed_count || 0) / s.max_participants) * 100}
                    style={{ width: 60 }}
                  />
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel
          title="Planuri abonament"
          eyebrow="Tipuri"
          action={
            <Btn
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin/memberships")}
            >
              Gestionează →
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
                Niciun plan încă.
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

        <Panel title="Detalii sală">
          {gym ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <div
                  className="eyebrow"
                  style={{ fontSize: 9, marginBottom: 4 }}
                >
                  Nume
                </div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{gym.name}</div>
              </div>
              <div>
                <div
                  className="eyebrow"
                  style={{ fontSize: 9, marginBottom: 4 }}
                >
                  Adresă
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {gym.address}
                </div>
              </div>
              <Btn
                variant="outline"
                size="sm"
                icon={<I.settings />}
                onClick={() => navigate("/admin/settings")}
                style={{ marginTop: 4 }}
              >
                Editează setările
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
                Nicio sală configurată.
              </div>
              <Btn
                variant="primary"
                size="sm"
                icon={<I.plus />}
                onClick={() => navigate("/admin/settings")}
              >
                Creează sala
              </Btn>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
