import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getAttendanceStats } from "../../api/gymAdmin.js";
import { scanQR } from "../../api/reception.js";
import TopBar from "../../components/layout/TopBar.jsx";
import Panel from "../../components/ui/Panel.jsx";
import Btn from "../../components/ui/Btn.jsx";
import Pill from "../../components/ui/Pill.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import Progress from "../../components/ui/Progress.jsx";
import HourlyBarChart from "../../components/ui/HourlyBarChart.jsx";
import ExportMenu from "../../components/ui/ExportMenu.jsx";
import Modal from "../../components/ui/Modal.jsx";
import QrScanner from "../../components/ui/QrScanner.jsx";
import * as I from "../../components/ui/Icons.jsx";

const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function KPICard({ label, value, delta, tone = "neutral" }) {
  const colors = {
    neutral: "var(--text)",
    accent: "var(--accent)",
    coral: "var(--coral)",
  };
  return (
    <div className="card" style={{ padding: 18 }}>
      <div className="eyebrow" style={{ marginBottom: 10 }}>
        {label}
      </div>
      <div
        className="display"
        style={{ fontSize: 28, color: colors[tone], lineHeight: 1 }}
      >
        {value}
      </div>
      <div
        className="mono"
        style={{ fontSize: 10, color: "var(--accent)", marginTop: 10 }}
      >
        {delta}
      </div>
    </div>
  );
}

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeSince(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h`;
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function ScanContent({ gymId, onCheckedIn }) {
  const [phase, setPhase] = useState("scanning"); 
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleScan = useCallback(async (token) => {
    setPhase("loading");
    try {
      const res = await scanQR(token);
      setResult(res.data.client);
      setError(null);
      onCheckedIn?.();
    } catch (err) {
      setResult(null);
      setError(err.response?.data?.message || "Scan failed");
    }
    setPhase("done");
  }, [onCheckedIn]);

  function reset() {
    setPhase("scanning");
    setResult(null);
    setError(null);
  }

  return (
    <div style={{ padding: 24 }}>
      {phase === "scanning" && <QrScanner onScan={handleScan} />}

      {phase === "loading" && (
        <div
          style={{
            padding: 48,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: "2px solid var(--accent)",
              borderTopColor: "transparent",
              animation: "spin 0.7s linear infinite",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--text-dim)",
              textTransform: "uppercase",
              letterSpacing: 0.1,
            }}
          >
            Validating…
          </div>
        </div>
      )}

      {phase === "done" && (
        <div
          style={{
            borderRadius: 12,
            border: `1px solid ${result ? "rgba(125,216,125,.3)" : "rgba(255,85,102,.3)"}`,
            background: result
              ? "rgba(125,216,125,.06)"
              : "rgba(255,85,102,.06)",
            padding: 28,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              background: result
                ? "rgba(125,216,125,.15)"
                : "rgba(255,85,102,.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: result ? "var(--green)" : "var(--red)",
            }}
          >
            {result ? (
              <I.check width={24} height={24} />
            ) : (
              <I.close width={24} height={24} />
            )}
          </div>

          {result ? (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  justifyContent: "center",
                  marginBottom: 10,
                }}
              >
                <Avatar name={result.name} size={34} />
                <div className="display" style={{ fontSize: 18 }}>
                  {result.name}
                </div>
              </div>
              <div
                style={{ display: "flex", gap: 8, justifyContent: "center" }}
              >
                <Pill tone="green">{result.membership_type}</Pill>
                <Pill tone="muted">Expires {fmtDate(result.expires_at)}</Pill>
              </div>
            </div>
          ) : (
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontFamily: "var(--mono)",
                  textTransform: "uppercase",
                  color: "var(--red)",
                  letterSpacing: 0.1,
                  marginBottom: 6,
                }}
              >
                Access Denied
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                {error}
              </div>
            </div>
          )}

          <Btn variant="outline" size="sm" icon={<I.qr />} onClick={reset}>
            Scan Another
          </Btn>
        </div>
      )}
    </div>
  );
}

function todayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function AdminAttendance() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanOpen, setScanOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const gymId = user?.gym_id;

  function refetch(date) {
    if (!gymId) return;
    getAttendanceStats(gymId, date).then((r) => setStats(r.data)).catch(() => {});
  }

  useEffect(() => {
    if (!gymId) {
      setLoading(false);
      return;
    }
    getAttendanceStats(gymId, selectedDate)
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [gymId]);

  function handleDateChange(e) {
    const d = e.target.value;
    if (!d) return;
    setSelectedDate(d);
    refetch(d);
  }

  const hourly = stats?.hourly || Array(24).fill(0);
  const daily = stats?.daily || Array(7).fill(0);
  const maxDaily = Math.max(...daily, 1);

  return (
    <>
      <TopBar
        title="Attendance"
        eyebrow="Check-in analytics"
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <ExportMenu gymId={gymId} />
            <Btn
              variant="primary"
              icon={<I.qr />}
              onClick={() => setScanOpen(true)}
            >
              Scan QR
            </Btn>
          </div>
        }
      />

      <Modal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        title="QR Check-in"
        width={480}
      >
        {scanOpen && <ScanContent gymId={gymId} onCheckedIn={() => refetch(selectedDate)} />}
      </Modal>

      {loading ? (
        <div
          style={{
            padding: "64px 32px",
            textAlign: "center",
            color: "var(--text-dim)",
            fontFamily: "var(--mono)",
            fontSize: 12,
          }}
        >
          Loading...
        </div>
      ) : !gymId ? (
        <div
          style={{
            padding: "64px 32px",
            textAlign: "center",
            color: "var(--text-dim)",
          }}
        >
          No gym assigned.
        </div>
      ) : (
        <div
          style={{
            padding: 32,
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 16,
            }}
          >
            <KPICard
              label="Today"
              value={stats?.today ?? 0}
              delta="Check-ins today"
              tone="accent"
            />
            <KPICard
              label="This Week"
              value={stats?.thisWeek ?? 0}
              delta="Total this week"
            />
            <KPICard
              label="Unique Members"
              value={stats?.uniqueThisWeek ?? 0}
              delta="This week"
              tone="coral"
            />
            <KPICard
              label="Avg / Day"
              value={stats?.avgPerDay ?? 0}
              delta="This week"
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr",
              gap: 20,
            }}
          >
            <Panel
              title={`Hourly Check-ins · ${selectedDate === todayStr() ? "Today" : fmtDate(selectedDate + "T00:00:00")}`}
              eyebrow={`${stats?.hourlyTotal ?? 0} check-ins · 00:00 – 23:59`}
              action={
                <input
                  type="date"
                  value={selectedDate}
                  max={todayStr()}
                  onChange={handleDateChange}
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border-strong)",
                    borderRadius: 8,
                    color: "var(--text)",
                    fontSize: 12,
                    fontFamily: "var(--mono)",
                    padding: "4px 8px",
                    cursor: "pointer",
                    outline: "none",
                  }}
                />
              }
            >
              <div style={{ padding: "8px 0 4px" }}>
                <HourlyBarChart
                  data={hourly}
                  height={200}
                  isToday={selectedDate === todayStr()}
                />
              </div>
            </Panel>

            <Panel title="Peak Days" eyebrow="This week">
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {DAYS_SHORT.map((d, i) => (
                  <div
                    key={d}
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      className="mono"
                      style={{
                        fontSize: 12,
                        width: 32,
                        color: "var(--text-muted)",
                      }}
                    >
                      {d}
                    </div>
                    <Progress
                      value={(daily[i] / maxDaily) * 100}
                      color={`rgba(224, 251, 76, ${daily[i] / maxDaily})`}
                      height={14}
                    />
                    <div
                      className="mono"
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        width: 44,
                        textAlign: "right",
                      }}
                    >
                      {daily[i]}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <Panel
            title="Recent Check-ins"
            eyebrow="Latest entries"
          >
            {!stats?.recent || stats.recent.length === 0 ? (
              <div
                style={{
                  padding: "32px 0",
                  textAlign: "center",
                  color: "var(--text-dim)",
                  fontSize: 13,
                }}
              >
                No check-ins recorded yet.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr",
                  gap: 10,
                }}
              >
                {stats.recent.map((x, i) => (
                  <div
                    key={i}
                    style={{
                      padding: 12,
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      borderLeft: "2px solid var(--accent)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 6,
                      }}
                    >
                      <Avatar name={x.name} size={22} />
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          flex: 1,
                          minWidth: 0,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {x.name}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span
                        className="mono"
                        style={{ fontSize: 10, color: "var(--text-dim)" }}
                      >
                        {fmtTime(x.entry_time)}
                      </span>
                      <span
                        className="mono"
                        style={{ fontSize: 10, color: "var(--text-dim)" }}
                      >
                        {timeSince(x.entry_time)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                marginTop: 16,
                padding: 14,
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <I.qr width={20} height={20} style={{ color: "var(--accent)" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>QR Check-in</div>
                <div
                  className="mono"
                  style={{ fontSize: 11, color: "var(--text-dim)" }}
                >
                  Scan a member's QR code to check in
                </div>
              </div>
              <Btn
                variant="outline"
                size="sm"
                icon={<I.qr />}
                onClick={() => setScanOpen(true)}
              >
                Scan QR
              </Btn>
            </div>
          </Panel>
        </div>
      )}
    </>
  );
}
