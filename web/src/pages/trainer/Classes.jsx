import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  getSessionsByGym,
  getSessionEnrollments,
  markAttendance,
} from "../../api/classes.js";
import { useToast } from "../../context/ToastContext.jsx";
import TopBar from "../../components/layout/TopBar.jsx";
import Btn from "../../components/ui/Btn.jsx";
import Pill from "../../components/ui/Pill.jsx";
import Progress from "../../components/ui/Progress.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import * as I from "../../components/ui/Icons.jsx";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function getWeekDates(offset = 0) {
  const now = new Date();
  const day = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

function fmtWeekRange(dates) {
  const s = dates[0],
    e = dates[6];
  return s.getMonth() === e.getMonth()
    ? `${MONTHS[s.getMonth()]} ${s.getDate()} – ${e.getDate()}, ${s.getFullYear()}`
    : `${MONTHS[s.getMonth()]} ${s.getDate()} – ${MONTHS[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
}

const fmtTime = (d) =>
  new Date(d).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

const durationMin = (start, end) =>
  Math.round((new Date(end) - new Date(start)) / 60000);

const localDate = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function getWindowInfo(session, now) {
  const start = new Date(session.start_datetime);
  const end = new Date(session.end_datetime);
  const opensAt = new Date(start.getTime() - 15 * 60_000);
  const closesAt = new Date(end.getTime() + 15 * 60_000);
  return {
    opensAt,
    closesAt,
    isOpen: now >= opensAt && now <= closesAt,
    isBefore: now < opensAt,
  };
}

const STATUS_TONE = {
  scheduled: "outline",
  ongoing: "accent",
  completed: "muted",
  cancelled: "red",
};
const ENROLL_TONE = {
  confirmed: "muted",
  attended: "green",
  no_show: "red",
  waiting_list: "coral",
  cancelled: "muted",
};

export default function TrainerClasses() {
  const { user } = useAuth();
  const toast = useToast();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const todayKey = localDate(new Date());
  const [selectedDay, setSelectedDay] = useState(todayKey);
  const [weekOffset, setWeekOffset] = useState(0);

  const [rosterSession, setRosterSession] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [marking, setMarking] = useState({});
  // Ticks every 30s while modal is open to keep window status live
  const [now, setNow] = useState(() => new Date());

  const gymId = user?.gym_id;
  const trainerId = user?.user_id;
  const week1 = getWeekDates(weekOffset);
  const week2 = getWeekDates(weekOffset + 1);

  useEffect(() => {
    if (!gymId) {
      setLoading(false);
      return;
    }
    getSessionsByGym(gymId)
      .then((r) =>
        setSessions(r.data.filter((s) => s.trainer_id === trainerId)),
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [gymId, trainerId]);

  useEffect(() => {
    if (!rosterSession) return;
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, [rosterSession]);

  const openRoster = async (session) => {
    setRosterSession(session);
    setEnrollments([]);
    setEnrollLoading(true);
    try {
      const r = await getSessionEnrollments(session.session_id);
      setEnrollments(r.data);
    } catch {
      toast("Failed to load roster", "coral");
    } finally {
      setEnrollLoading(false);
    }
  };

  const closeRoster = () => {
    setRosterSession(null);
    setEnrollments([]);
    setNow(new Date());
  };

  const handleMark = async (enrollmentId, status) => {
    setMarking((m) => ({ ...m, [enrollmentId]: true }));
    try {
      await markAttendance(enrollmentId, { status });
      setEnrollments((prev) =>
        prev.map((e) =>
          e.enrollment_id === enrollmentId ? { ...e, status } : e,
        ),
      );
    } catch (err) {
      toast(
        err.response?.data?.message || "Failed to mark attendance",
        "coral",
      );
    } finally {
      setMarking((m) => ({ ...m, [enrollmentId]: false }));
    }
  };

  const daySessions = sessions
    .filter((s) => localDate(s.start_datetime) === selectedDay)
    .sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime));

  const sessionCount = (d) =>
    sessions.filter((s) => localDate(s.start_datetime) === localDate(d)).length;

  const winInfo = rosterSession ? getWindowInfo(rosterSession, now) : null;

  const rosterMembers = enrollments.filter((e) =>
    ["confirmed", "attended", "no_show"].includes(e.status),
  );
  const waitlisted = enrollments.filter((e) => e.status === "waiting_list");

  const attendedCount = enrollments.filter(
    (e) => e.status === "attended",
  ).length;
  const noShowCount = enrollments.filter((e) => e.status === "no_show").length;
  const pendingCount = enrollments.filter(
    (e) => e.status === "confirmed",
  ).length;

  return (
    <>
      <TopBar
        title="My Classes"
        eyebrow={`${sessions.length} session${sessions.length !== 1 ? "s" : ""} scheduled`}
      />

      {/* Calendar nav */}
      <div
        style={{
          padding: "16px 32px 0",
          borderBottom: "1px solid var(--border-soft)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 14,
          }}
        >
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            style={{
              padding: "5px 14px",
              borderRadius: 8,
              fontSize: 12,
              fontFamily: "var(--mono)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              cursor: "pointer",
            }}
          >
            ← Prev
          </button>
          <span
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {fmtWeekRange(week1)} — {fmtWeekRange(week2)}
          </span>
          {weekOffset !== 0 && (
            <button
              onClick={() => {
                setWeekOffset(0);
                setSelectedDay(todayKey);
              }}
              style={{
                padding: "5px 14px",
                borderRadius: 8,
                fontSize: 12,
                fontFamily: "var(--mono)",
                background: "var(--accent)",
                border: "none",
                color: "var(--accent-ink)",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Today
            </button>
          )}
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            style={{
              padding: "5px 14px",
              borderRadius: 8,
              fontSize: 12,
              fontFamily: "var(--mono)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              cursor: "pointer",
            }}
          >
            Next →
          </button>
        </div>

        <div style={{ display: "flex", gap: 4, marginBottom: 2 }}>
          {DAYS.map((d) => (
            <div
              key={d}
              style={{
                flex: 1,
                textAlign: "center",
                fontSize: 9,
                fontWeight: 700,
                fontFamily: "var(--mono)",
                color: "var(--text-dim)",
                letterSpacing: 1,
              }}
            >
              {d}
            </div>
          ))}
        </div>

        {[week1, week2].map((week, wi) => (
          <div
            key={wi}
            style={{
              display: "flex",
              gap: 4,
              marginBottom: wi === 0 ? 4 : 0,
              paddingBottom: wi === 1 ? 16 : 0,
            }}
          >
            {week.map((d, i) => {
              const dk = localDate(d);
              const isSelected = dk === selectedDay;
              const isToday = dk === todayKey;
              const cnt = sessionCount(d);
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(dk)}
                  style={{
                    flex: 1,
                    padding: "10px 6px",
                    borderRadius: 10,
                    textAlign: "center",
                    background: isSelected
                      ? "var(--accent)"
                      : isToday
                        ? "rgba(224,251,76,.08)"
                        : wi === 0
                          ? "var(--surface)"
                          : "var(--surface-2)",
                    border: `1px solid ${isSelected ? "var(--accent)" : isToday ? "var(--accent)" : wi === 0 ? "var(--border)" : "var(--border-soft)"}`,
                    color: isSelected ? "var(--accent-ink)" : "var(--text)",
                    cursor: "pointer",
                  }}
                >
                  <div className="display" style={{ fontSize: 20 }}>
                    {d.getDate()}
                  </div>
                  <div
                    className="mono"
                    style={{
                      fontSize: 9,
                      marginTop: 4,
                      opacity: cnt === 0 ? 0.4 : 0.85,
                      color: isSelected
                        ? "var(--accent-ink)"
                        : cnt > 0
                          ? "var(--accent)"
                          : "var(--text-dim)",
                      fontWeight: cnt > 0 ? 700 : 400,
                    }}
                  >
                    {cnt > 0 ? `${cnt} class${cnt > 1 ? "es" : ""}` : "—"}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Session list */}
      <div style={{ padding: "20px 32px" }}>
        {loading && (
          <div
            style={{
              padding: "64px 0",
              textAlign: "center",
              color: "var(--text-dim)",
              fontFamily: "var(--mono)",
              fontSize: 12,
            }}
          >
            Loading...
          </div>
        )}

        {!loading && daySessions.length === 0 && (
          <div style={{ padding: "64px 0", textAlign: "center" }}>
            <I.calendar
              width={32}
              height={32}
              style={{ opacity: 0.3, marginBottom: 12 }}
            />
            <div
              className="display upper"
              style={{ fontSize: 14, color: "var(--text-muted)" }}
            >
              No classes on this day
            </div>
          </div>
        )}

        {daySessions.length > 0 && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr 130px 80px 52px",
                gap: 16,
                padding: "8px 16px",
                fontSize: 10,
                color: "var(--text-dim)",
                fontFamily: "var(--mono)",
                textTransform: "uppercase",
                letterSpacing: 0.1,
                borderBottom: "1px solid var(--border-soft)",
              }}
            >
              <div>Time</div>
              <div>Class</div>
              <div>Capacity</div>
              <div>Status</div>
              <div />
            </div>

            {daySessions.map((s) => {
              const fill = (s.confirmed_count || 0) / (s.max_participants || 1);
              const win = getWindowInfo(s, new Date());
              return (
                <div
                  key={s.session_id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "80px 1fr 130px 80px 52px",
                    gap: 16,
                    padding: "14px 16px",
                    alignItems: "center",
                    borderBottom: "1px solid var(--border-soft)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(255,255,255,.02)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <div>
                    <div
                      className="mono"
                      style={{ fontSize: 14, fontWeight: 700 }}
                    >
                      {fmtTime(s.start_datetime)}
                    </div>
                    <div
                      className="mono"
                      style={{ fontSize: 10, color: "var(--text-dim)" }}
                    >
                      {durationMin(s.start_datetime, s.end_datetime)} min
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {s.Class_Type?.name || "—"}
                    </div>
                    {win.isOpen && (
                      <div
                        className="mono"
                        style={{
                          fontSize: 10,
                          color: "var(--accent)",
                          marginTop: 3,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <span
                          className="pulse-dot"
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: "var(--accent)",
                            display: "inline-block",
                          }}
                        />
                        Attendance window open
                      </div>
                    )}
                  </div>

                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Progress
                      value={fill * 100}
                      color={fill >= 1 ? "var(--coral)" : "var(--accent)"}
                    />
                    <span
                      className="mono"
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.confirmed_count || 0}/{s.max_participants}
                    </span>
                  </div>

                  <Pill tone={STATUS_TONE[s.status] || "outline"}>
                    {s.status}
                  </Pill>

                  <button
                    title="View roster"
                    onClick={() => openRoster(s)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--accent)";
                      e.currentTarget.style.color = "var(--accent)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.color = "var(--text-muted)";
                    }}
                  >
                    <I.users width={14} height={14} />
                  </button>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Roster modal */}
      <Modal open={!!rosterSession} onClose={closeRoster} title="Class Roster">
        <div style={{ padding: "0 20px 20px" }}>
          {rosterSession && (
            <>
              {/* Session header */}
              <div
                style={{
                  padding: "10px 0 14px",
                  borderBottom: "1px solid var(--border-soft)",
                  marginBottom: 12,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {rosterSession.Class_Type?.name || "Class"}
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "var(--text-dim)",
                    marginTop: 2,
                  }}
                >
                  {fmtTime(rosterSession.start_datetime)} ·{" "}
                  {durationMin(
                    rosterSession.start_datetime,
                    rosterSession.end_datetime,
                  )}{" "}
                  min
                </div>

                {/* Attendance window badge */}
                <div
                  style={{
                    marginTop: 10,
                    padding: "8px 12px",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: winInfo?.isOpen
                      ? "rgba(224,251,76,.07)"
                      : "var(--surface-2)",
                    border: `1px solid ${winInfo?.isOpen ? "rgba(224,251,76,.25)" : "var(--border)"}`,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: winInfo?.isOpen
                        ? "var(--accent)"
                        : "var(--text-dim)",
                      flexShrink: 0,
                      display: "inline-block",
                    }}
                    className={winInfo?.isOpen ? "pulse-dot" : ""}
                  />
                  <span
                    className="mono"
                    style={{
                      fontSize: 11,
                      color: winInfo?.isOpen
                        ? "var(--accent)"
                        : "var(--text-dim)",
                    }}
                  >
                    {winInfo?.isOpen
                      ? `Attendance open · closes at ${fmtTime(winInfo.closesAt)}`
                      : winInfo?.isBefore
                        ? `Marking opens at ${fmtTime(winInfo.opensAt)} (15 min before start)`
                        : "Attendance period closed"}
                  </span>
                </div>
              </div>

              {/* Stats row */}
              {rosterMembers.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    gap: 20,
                    padding: "4px 0 14px",
                    borderBottom: "1px solid var(--border-soft)",
                    marginBottom: 14,
                  }}
                >
                  <div>
                    <div className="eyebrow" style={{ fontSize: 9 }}>
                      Attended
                    </div>
                    <div
                      className="display"
                      style={{ fontSize: 22, color: "var(--accent)" }}
                    >
                      {attendedCount}
                    </div>
                  </div>
                  <div>
                    <div className="eyebrow" style={{ fontSize: 9 }}>
                      No-show
                    </div>
                    <div
                      className="display"
                      style={{ fontSize: 22, color: "var(--coral)" }}
                    >
                      {noShowCount}
                    </div>
                  </div>
                  <div>
                    <div className="eyebrow" style={{ fontSize: 9 }}>
                      Pending
                    </div>
                    <div
                      className="display"
                      style={{ fontSize: 22, color: "var(--text-muted)" }}
                    >
                      {pendingCount}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {enrollLoading && (
              <div
                style={{
                  padding: "32px 0",
                  textAlign: "center",
                  color: "var(--text-dim)",
                  fontFamily: "var(--mono)",
                  fontSize: 12,
                }}
              >
                Loading...
              </div>
            )}

            {!enrollLoading && rosterMembers.length === 0 && (
              <div
                style={{
                  padding: "32px 0",
                  textAlign: "center",
                  color: "var(--text-dim)",
                  fontSize: 13,
                }}
              >
                No confirmed enrollments yet.
              </div>
            )}

            {rosterMembers.map((e) => {
              const name = e.Client
                ? `${e.Client.first_name} ${e.Client.last_name}`
                : `Member #${e.client_id}`;
              const busy = !!marking[e.enrollment_id];
              const canMark = winInfo?.isOpen;

              return (
                <div
                  key={e.enrollment_id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "11px 0",
                    borderBottom: "1px solid var(--border-soft)",
                  }}
                >
                  <Avatar name={name} size={34} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{name}</div>
                    {e.Client?.email && (
                      <div
                        className="mono"
                        style={{ fontSize: 10, color: "var(--text-dim)" }}
                      >
                        {e.Client.email}
                      </div>
                    )}
                  </div>

                  {e.status === "confirmed" ? (
                    canMark ? (
                      <div style={{ display: "flex", gap: 5 }}>
                        <button
                          disabled={busy}
                          onClick={() =>
                            handleMark(e.enrollment_id, "attended")
                          }
                          title="Mark attended"
                          style={{
                            padding: "5px 12px",
                            borderRadius: 7,
                            fontSize: 12,
                            fontWeight: 700,
                            background: "rgba(224,251,76,.12)",
                            border: "1px solid rgba(224,251,76,.3)",
                            color: "var(--accent)",
                            cursor: busy ? "not-allowed" : "pointer",
                            opacity: busy ? 0.5 : 1,
                          }}
                        >
                          ✓
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => handleMark(e.enrollment_id, "no_show")}
                          title="Mark no-show"
                          style={{
                            padding: "5px 12px",
                            borderRadius: 7,
                            fontSize: 12,
                            fontWeight: 700,
                            background: "rgba(255,80,60,.08)",
                            border: "1px solid rgba(255,80,60,.25)",
                            color: "var(--coral)",
                            cursor: busy ? "not-allowed" : "pointer",
                            opacity: busy ? 0.5 : 1,
                          }}
                        >
                          ✗
                        </button>
                      </div>
                    ) : (
                      <Pill tone="muted">Pending</Pill>
                    )
                  ) : (
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <Pill tone={ENROLL_TONE[e.status]}>
                        {e.status === "no_show" ? "No-show" : e.status}
                      </Pill>
                      {canMark && (
                        <button
                          disabled={busy}
                          onClick={() =>
                            handleMark(
                              e.enrollment_id,
                              e.status === "attended" ? "no_show" : "attended",
                            )
                          }
                          title={
                            e.status === "attended"
                              ? "Change to no-show"
                              : "Change to attended"
                          }
                          style={{
                            padding: 4,
                            color: "var(--text-dim)",
                            cursor: busy ? "not-allowed" : "pointer",
                            opacity: busy ? 0.5 : 1,
                          }}
                        >
                          <I.edit width={12} height={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Waitlist section */}
            {waitlisted.length > 0 && (
              <>
                <div
                  className="eyebrow"
                  style={{
                    fontSize: 9,
                    padding: "14px 0 8px",
                    color: "var(--text-dim)",
                  }}
                >
                  Waitlist · {waitlisted.length}
                </div>
                {waitlisted.map((e) => {
                  const name = e.Client
                    ? `${e.Client.first_name} ${e.Client.last_name}`
                    : `Member #${e.client_id}`;
                  return (
                    <div
                      key={e.enrollment_id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 0",
                        borderBottom: "1px solid var(--border-soft)",
                        opacity: 0.6,
                      }}
                    >
                      <Avatar name={name} size={30} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>
                          {name}
                        </div>
                      </div>
                      <Pill tone="coral">Waitlist</Pill>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
