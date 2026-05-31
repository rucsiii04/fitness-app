import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  getSessionsByGym,
  getClassTypesByGym,
  createClassType,
  createClassSession,
  cancelClassSession,
  getSessionEnrollments,
} from "../../api/classes.js";
import { getTrainersByGym, getMyGyms } from "../../api/gymAdmin.js";
import { useToast } from "../../context/ToastContext.jsx";
import TopBar from "../../components/layout/TopBar.jsx";
import Btn from "../../components/ui/Btn.jsx";
import Pill from "../../components/ui/Pill.jsx";
import Progress from "../../components/ui/Progress.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Field from "../../components/ui/Field.jsx";
import Input from "../../components/ui/Input.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import * as I from "../../components/ui/Icons.jsx";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const MONTHS_FULL = [
  "Ianuarie",
  "Februarie",
  "Martie",
  "Aprilie",
  "Mai",
  "Iunie",
  "Iulie",
  "August",
  "Septembrie",
  "Octombrie",
  "Noiembrie",
  "Decembrie",
];
const MONTHS_SHORT = [
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
const DAY_HDR = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"];
const DURATIONS = [30, 45, 60, 90, 120];

function buildWeeksForPicker(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDow = (first.getDay() + 6) % 7;
  const days = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}

function ClassDateTimePicker({
  date,
  hour = 9,
  minute = 0,
  duration = 60,
  minHour = 0,
  maxHour = 23,
  onDate,
  onHour,
  onMinute,
  onDuration,
}) {
  hour = isNaN(hour) || hour == null ? minHour : hour;
  minute = isNaN(minute) || minute == null ? 0 : minute;
  duration = isNaN(duration) || duration == null ? 60 : duration;

  const clampHour = (h) => Math.min(maxHour, Math.max(minHour, h));
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const [calOpen, setCalOpen] = React.useState(false);
  const [calYear, setCalYear] = React.useState(() =>
    date ? parseInt(date.slice(0, 4)) : now.getFullYear(),
  );
  const [calMonth, setCalMonth] = React.useState(() =>
    date ? parseInt(date.slice(5, 7)) - 1 : now.getMonth(),
  );

  const dispDate = date
    ? (() => {
        const [y, mo, d] = date.split("-").map(Number);
        return `${d} ${MONTHS_SHORT[mo - 1]} ${y}`;
      })()
    : "Alege data";

  function prevMonth() {
    if (calMonth === 0) {
      setCalYear((y) => y - 1);
      setCalMonth(11);
    } else setCalMonth((m) => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) {
      setCalYear((y) => y + 1);
      setCalMonth(0);
    } else setCalMonth((m) => m + 1);
  }

  const weeks = buildWeeksForPicker(calYear, calMonth);

  const spinBtn = {
    background: "var(--surface-3)",
    border: "none",
    borderRadius: 5,
    color: "var(--accent)",
    cursor: "pointer",
    width: 30,
    height: 20,
    fontSize: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  // Compute end time display
  const endLabel = (() => {
    if (!date) return null;
    const total = hour * 60 + minute + duration;
    const eh = Math.floor(total / 60) % 24;
    const em = total % 60;
    return `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
  })();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Date picker */}
      <div style={{ position: "relative" }}>
        {calOpen && (
          <div
            style={{ position: "fixed", inset: 0, zIndex: 49 }}
            onClick={() => setCalOpen(false)}
          />
        )}
        <button
          type="button"
          onClick={() => setCalOpen((v) => !v)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            background: "var(--surface-2)",
            border: `1px solid ${calOpen ? "var(--accent)" : "var(--border)"}`,
            borderRadius: 10,
            color: date ? "var(--text)" : "var(--text-dim)",
            fontSize: 14,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <I.calendar
            width={15}
            height={15}
            style={{ color: "var(--text-dim)", flexShrink: 0 }}
          />
          <span style={{ flex: 1 }}>{dispDate}</span>
        </button>
        {calOpen && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              zIndex: 50,
              background: "var(--surface)",
              border: "1px solid var(--border-strong)",
              borderRadius: 14,
              padding: 16,
              minWidth: 268,
              boxShadow: "0 8px 32px rgba(0,0,0,.55)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <button
                type="button"
                onClick={prevMonth}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent)",
                  cursor: "pointer",
                  fontSize: 22,
                  lineHeight: 1,
                  padding: "0 6px",
                }}
              >
                ‹
              </button>
              <span
                style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}
              >
                {MONTHS_FULL[calMonth]} {calYear}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent)",
                  cursor: "pointer",
                  fontSize: 22,
                  lineHeight: 1,
                  padding: "0 6px",
                }}
              >
                ›
              </button>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7,1fr)",
                marginBottom: 4,
              }}
            >
              {DAY_HDR.map((d) => (
                <div
                  key={d}
                  style={{
                    textAlign: "center",
                    fontSize: 9,
                    fontWeight: 700,
                    color: "var(--text-dim)",
                    letterSpacing: 0.5,
                    paddingBottom: 6,
                  }}
                >
                  {d}
                </div>
              ))}
            </div>
            {weeks.map((week, wi) => (
              <div
                key={wi}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7,1fr)",
                }}
              >
                {week.map((day, di) => {
                  if (!day) return <div key={di} />;
                  const dk = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const isSel = dk === date;
                  const isPast = dk < todayKey;
                  return (
                    <button
                      key={di}
                      type="button"
                      onClick={() => {
                        if (!isPast) {
                          onDate(dk);
                          setCalOpen(false);
                        }
                      }}
                      style={{
                        textAlign: "center",
                        padding: "7px 0",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: isSel ? 700 : 400,
                        color: isPast
                          ? "var(--text-dim)"
                          : isSel
                            ? "var(--bg)"
                            : "var(--text)",
                        background: isSel ? "var(--accent)" : "transparent",
                        border: "none",
                        cursor: isPast ? "default" : "pointer",
                        opacity: isPast ? 0.3 : 1,
                      }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Start time */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "10px 16px",
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          borderRadius: 10,
        }}
      >
        <span style={{ fontSize: 12, color: "var(--text-dim)", minWidth: 60 }}>
          Start
        </span>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
          }}
        >
          <button
            type="button"
            onClick={() => onHour(clampHour(hour + 1))}
            style={{ ...spinBtn, opacity: hour >= maxHour ? 0.3 : 1 }}
            disabled={hour >= maxHour}
          >
            ▲
          </button>
          <input
            type="text"
            inputMode="numeric"
            value={String(hour).padStart(2, "0")}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v)) onHour(clampHour(v));
            }}
            onBlur={(e) => {
              const v = parseInt(e.target.value, 10);
              onHour(isNaN(v) ? minHour : clampHour(v));
            }}
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "var(--text)",
              width: 36,
              textAlign: "center",
              background: "transparent",
              border: "none",
              outline: "none",
              cursor: "text",
            }}
          />
          <button
            type="button"
            onClick={() => onHour(clampHour(hour - 1))}
            style={{ ...spinBtn, opacity: hour <= minHour ? 0.3 : 1 }}
            disabled={hour <= minHour}
          >
            ▼
          </button>
        </div>
        <span
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "var(--text-dim)",
            marginBottom: 2,
          }}
        >
          :
        </span>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
          }}
        >
          <button
            type="button"
            onClick={() => onMinute((minute + 5) % 60)}
            style={spinBtn}
          >
            ▲
          </button>
          <input
            type="text"
            inputMode="numeric"
            value={String(minute).padStart(2, "0")}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v)) onMinute(Math.min(59, Math.max(0, v)));
            }}
            onBlur={(e) => {
              const v = parseInt(e.target.value, 10);
              onMinute(isNaN(v) ? 0 : Math.min(59, Math.max(0, v)));
            }}
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "var(--text)",
              width: 36,
              textAlign: "center",
              background: "transparent",
              border: "none",
              outline: "none",
              cursor: "text",
            }}
          />
          <button
            type="button"
            onClick={() => onMinute((minute - 5 + 60) % 60)}
            style={spinBtn}
          >
            ▼
          </button>
        </div>
        {endLabel && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: 12,
              color: "var(--text-dim)",
            }}
          >
            →{" "}
            <span style={{ color: "var(--text)", fontWeight: 600 }}>
              {endLabel}
            </span>
          </span>
        )}
      </div>

      {/* Duration chips */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {DURATIONS.map((d) => {
          const endMin = hour * 60 + minute + d;
          const overflows = endMin > maxHour * 60;
          return (
            <button
              key={d}
              type="button"
              onClick={() => !overflows && onDuration(d)}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                cursor: overflows ? "not-allowed" : "pointer",
                border: `1px solid ${duration === d ? "var(--accent)" : overflows ? "transparent" : "var(--border)"}`,
                background:
                  duration === d ? "rgba(224,251,76,.12)" : "var(--surface-2)",
                color:
                  duration === d
                    ? "var(--accent)"
                    : overflows
                      ? "var(--text-dim)"
                      : "var(--text-dim)",
                opacity: overflows ? 0.3 : 1,
              }}
            >
              {d} min
            </button>
          );
        })}
      </div>
    </div>
  );
}

const SELECT_STYLE = {
  height: 44,
  padding: "0 12px",
  background: "var(--surface-2)",
  border: "1px solid var(--border-strong)",
  borderRadius: 10,
  color: "var(--text)",
  fontSize: 14,
  width: "100%",
};

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

function fmtWeekRange(weekDates) {
  const start = weekDates[0];
  const end = weekDates[6];
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
  const sameMonth = start.getMonth() === end.getMonth();
  return sameMonth
    ? `${MONTHS[start.getMonth()]} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`
    : `${MONTHS[start.getMonth()]} ${start.getDate()} – ${MONTHS[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
}

const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

const durationMin = (start, end) =>
  Math.round((new Date(end) - new Date(start)) / 60000);

const localDate = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const STATUS_TONE = {
  scheduled: "outline",
  ongoing: "accent",
  completed: "muted",
  cancelled: "red",
};
const STATUS_LABEL = {
  scheduled: "Programat",
  ongoing: "În desfășurare",
  completed: "Finalizat",
  cancelled: "Anulat",
};
const ENROLL_LABEL = {
  confirmed: "Confirmat",
  attended: "Prezent",
  no_show: "Absent",
  waiting_list: "Listă așteptare",
  cancelled: "Anulat",
};

const EMPTY_SESSION_FORM = {
  class_type_id: "",
  trainer_id: "",
  date: "",
  start_hour: 9,
  start_min: 0,
  duration: 60,
  max_participants: 20,
};
const EMPTY_TYPE_FORM = {
  name: "",
  description: "",
  difficulty_level: "beginner",
};

export default function AdminClasses() {
  const { user } = useAuth();
  const toast = useToast();

  const [gym, setGym] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [classTypes, setClassTypes] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const todayKey = localDate(new Date());
  const [selectedDay, setSelectedDay] = useState(todayKey);
  const [weekOffset, setWeekOffset] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelNotify, setCancelNotify] = useState(true);

  const [sessionForm, setSessionForm] = useState(EMPTY_SESSION_FORM);
  const [typeForm, setTypeForm] = useState(EMPTY_TYPE_FORM);

  const gymId = user?.gym_id;
  const week1 = getWeekDates(weekOffset);
  const week2 = getWeekDates(weekOffset + 1);

  const load = async () => {
    if (!gymId) {
      setLoading(false);
      return;
    }
    try {
      const [sessionsRes, typesRes, trainersRes, gymsRes] = await Promise.all([
        getSessionsByGym(gymId),
        getClassTypesByGym(gymId),
        getTrainersByGym(gymId),
        getMyGyms(),
      ]);
      setSessions(sessionsRes.data);
      setClassTypes(typesRes.data);
      setTrainers(trainersRes.data.filter((t) => t.role === "trainer"));
      setGym(gymsRes.data[0] ?? null);
    } catch (err) {
      toast(
        err.response?.data?.message || "Eroare la încărcarea datelor",
        "coral",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [gymId]);

  const daySessions = sessions
    .filter((s) => localDate(s.start_datetime) === selectedDay)
    .sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime));

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!sessionForm.date) {
      toast("Alege o dată pentru clasă", "coral");
      return;
    }
    const pad = (n) => String(n).padStart(2, "0");
    const start = new Date(
      `${sessionForm.date}T${pad(sessionForm.start_hour)}:${pad(sessionForm.start_min)}:00`,
    );
    const end = new Date(start.getTime() + sessionForm.duration * 60000);

    if (gym) {
      const [openH, openM] = gym.opening_time
        .slice(0, 5)
        .split(":")
        .map(Number);
      const [closeH, closeM] = gym.closing_time
        .slice(0, 5)
        .split(":")
        .map(Number);
      const openMin = openH * 60 + openM;
      const closeMin = closeH * 60 + closeM;
      const startMin = sessionForm.start_hour * 60 + sessionForm.start_min;
      const endMin = startMin + sessionForm.duration;

      if (startMin < openMin || endMin > closeMin) {
        toast(
          `Clasa trebuie să se încadreze între ${gym.opening_time.slice(0, 5)} și ${gym.closing_time.slice(0, 5)}`,
          "coral",
        );
        return;
      }
    }

    try {
      await createClassSession({
        class_type_id: parseInt(sessionForm.class_type_id),
        gym_id: gymId,
        trainer_id: parseInt(sessionForm.trainer_id),
        start_datetime: start.toISOString(),
        end_datetime: end.toISOString(),
        max_participants: parseInt(sessionForm.max_participants),
      });
      setCreateOpen(false);
      setSessionForm(EMPTY_SESSION_FORM);
      await load();
      toast("Clasă creată");
    } catch (err) {
      toast(err.response?.data?.message || "Eroare la crearea clasei", "coral");
    }
  };

  const handleCreateType = async (e) => {
    e.preventDefault();
    try {
      await createClassType({ ...typeForm, gym_id: gymId });
      toast("Tip de clasă creat");
      setTypeOpen(false);
      setTypeForm(EMPTY_TYPE_FORM);
      getClassTypesByGym(gymId)
        .then((r) => setClassTypes(r.data))
        .catch(() => {});
    } catch (err) {
      toast(
        err.response?.data?.message || "Eroare la crearea tipului",
        "coral",
      );
    }
  };

  const handleCancelSession = (sessionId) => {
    setCancelTarget(sessionId);
    setCancelNotify(true);
  };

  const confirmCancel = async () => {
    try {
      await cancelClassSession(cancelTarget, true);
      setCancelTarget(null);
      await load();
      toast("Clasă anulată");
    } catch (err) {
      toast(err.response?.data?.message || "Eroare la anulare", "coral");
    }
  };

  const openEnrollments = async (session) => {
    setEnrollOpen(session);
    setEnrollments([]);
    try {
      const r = await getSessionEnrollments(session.session_id);
      setEnrollments(r.data);
    } catch {
      setEnrollments([]);
    }
  };

  const sessionCount = (d) =>
    sessions.filter((s) => localDate(s.start_datetime) === localDate(d)).length;

  return (
    <>
      <TopBar
        title="Clase"
        eyebrow={`Program · ${
          sessions.filter((s) => {
            const dk = localDate(s.start_datetime);
            return dk >= localDate(week1[0]) && dk <= localDate(week2[6]);
          }).length
        } sesiuni pe 2 săptămâni`}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <Btn
              variant="outline"
              icon={<I.plus />}
              onClick={() => setTypeOpen(true)}
            >
              Tip clasă nou
            </Btn>
            <Btn
              variant="primary"
              icon={<I.plus />}
              onClick={() => {
                const openHour = gym
                  ? parseInt(gym.opening_time.slice(0, 2))
                  : 9;
                setSessionForm({
                  ...EMPTY_SESSION_FORM,
                  date: selectedDay,
                  start_hour: openHour,
                });
                setCreateOpen(true);
              }}
            >
              Creează clasă
            </Btn>
          </div>
        }
      />

      <div
        style={{
          padding: "16px 32px 0",
          borderBottom: "1px solid var(--border-soft)",
        }}
      >
        {/* Nav row */}
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
              color: "var(--text)",
            }}
          >
            {fmtWeekRange(week1)} - {fmtWeekRange(week2)}
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
              Azi
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
            Următoarea →
          </button>
        </div>

        {/* Day headers */}
        <div
          style={{ display: "flex", gap: 4, marginBottom: 2, paddingBottom: 2 }}
        >
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

        {/* Week 1 */}
        <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
          {week1.map((d, i) => {
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
                      ? "rgba(var(--accent-rgb, 209,255,0),0.08)"
                      : "var(--surface)",
                  border: `1px solid ${isSelected ? "var(--accent)" : isToday ? "var(--accent)" : "var(--border)"}`,
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
                  {cnt > 0 ? `${cnt} ${cnt > 1 ? "clase" : "clasă"}` : "-"}
                </div>
              </button>
            );
          })}
        </div>

        {/* Week 2 */}
        <div style={{ display: "flex", gap: 4, paddingBottom: 16 }}>
          {week2.map((d, i) => {
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
                      ? "rgba(var(--accent-rgb, 209,255,0),0.08)"
                      : "var(--surface-2)",
                  border: `1px solid ${isSelected ? "var(--accent)" : isToday ? "var(--accent)" : "var(--border-soft)"}`,
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
                  {cnt > 0 ? `${cnt} ${cnt > 1 ? "clase" : "clasă"}` : "-"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: "20px 32px" }}>
        {!gymId && !loading && (
          <div
            style={{
              padding: "64px 0",
              textAlign: "center",
              color: "var(--text-dim)",
            }}
          >
            Nicio sală atribuită contului tău.
          </div>
        )}
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
            Se încarcă...
          </div>
        )}
        {!loading && gymId && daySessions.length === 0 && (
          <div
            style={{
              padding: "64px 0",
              textAlign: "center",
              color: "var(--text-dim)",
            }}
          >
            <I.calendar
              width={32}
              height={32}
              style={{ opacity: 0.3, marginBottom: 12 }}
            />
            <div
              className="display upper"
              style={{ fontSize: 14, color: "var(--text-muted)" }}
            >
              Nicio clasă programată
            </div>
          </div>
        )}

        {daySessions.length > 0 && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr 160px 110px 80px 60px",
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
              <div>Oră</div>
              <div>Clasă</div>
              <div>Antrenor</div>
              <div>Capacitate</div>
              <div>Status</div>
              <div />
            </div>

            {daySessions.map((c) => {
              const fill = (c.confirmed_count || 0) / (c.max_participants || 1);
              const trainerName = c.Trainer
                ? `${c.Trainer.first_name} ${c.Trainer.last_name}`
                : "-";
              return (
                <div
                  key={c.session_id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "80px 1fr 160px 110px 80px 60px",
                    gap: 16,
                    padding: "14px 16px",
                    alignItems: "center",
                    borderBottom: "1px solid var(--border-soft)",
                    cursor: "pointer",
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
                      {fmtTime(c.start_datetime)}
                    </div>
                    <div
                      className="mono"
                      style={{ fontSize: 10, color: "var(--text-dim)" }}
                    >
                      {durationMin(c.start_datetime, c.end_datetime)} min
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {c.Class_Type?.name || "-"}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <Pill tone={fill >= 1 ? "coral" : "accent"}>
                        {fill >= 1 ? "Complet" : `${Math.round(fill * 100)}%`}
                      </Pill>
                    </div>
                  </div>

                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Avatar name={trainerName} size={24} />
                    <div
                      style={{
                        fontSize: 12,
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {trainerName}
                    </div>
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
                        width: 44,
                      }}
                    >
                      {c.confirmed_count || 0}/{c.max_participants}
                    </span>
                  </div>

                  <Pill tone={STATUS_TONE[c.status] || "outline"}>
                    {STATUS_LABEL[c.status] || c.status}
                  </Pill>

                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      title="Vezi lista"
                      onClick={() => openEnrollments(c)}
                      style={{ color: "var(--text-dim)", padding: 4 }}
                    >
                      <I.users width={14} height={14} />
                    </button>
                    {c.status !== "cancelled" && (
                      <button
                        title="Anulează clasa"
                        onClick={() => handleCancelSession(c.session_id)}
                        style={{ color: "var(--text-dim)", padding: 4 }}
                      >
                        <I.trash width={14} height={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Creează clasă"
      >
        <form
          onSubmit={handleCreateSession}
          style={{
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <Field label="Tip clasă">
            <select
              value={sessionForm.class_type_id}
              onChange={(e) =>
                setSessionForm((f) => ({ ...f, class_type_id: e.target.value }))
              }
              required
              style={SELECT_STYLE}
            >
              <option value="">- Selectează tipul -</option>
              {classTypes.map((t) => (
                <option key={t.class_type_id} value={t.class_type_id}>
                  {t.name}
                </option>
              ))}
            </select>
            {classTypes.length === 0 && (
              <div
                style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}
              >
                Niciun tip de clasă.{" "}
                <button
                  type="button"
                  onClick={() => {
                    setCreateOpen(false);
                    setTypeOpen(true);
                  }}
                  style={{
                    color: "var(--accent)",
                    textDecoration: "underline",
                    fontSize: 11,
                  }}
                >
                  Creează unul mai întâi
                </button>
              </div>
            )}
          </Field>

          <Field label="Antrenor">
            <select
              value={sessionForm.trainer_id}
              onChange={(e) =>
                setSessionForm((f) => ({ ...f, trainer_id: e.target.value }))
              }
              required
              style={SELECT_STYLE}
            >
              <option value="">- Selectează antrenorul -</option>
              {trainers.map((t) => (
                <option key={t.user_id} value={t.user_id}>
                  {t.first_name} {t.last_name}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Dată & Oră"
            hint={
              gym
                ? `Program sală: ${gym.opening_time.slice(0, 5)} – ${gym.closing_time.slice(0, 5)}`
                : undefined
            }
          >
            <ClassDateTimePicker
              date={sessionForm.date}
              hour={sessionForm.start_hour}
              minute={sessionForm.start_min}
              duration={sessionForm.duration}
              minHour={gym ? parseInt(gym.opening_time.slice(0, 2)) : 0}
              maxHour={gym ? parseInt(gym.closing_time.slice(0, 2)) : 23}
              onDate={(v) => setSessionForm((f) => ({ ...f, date: v }))}
              onHour={(v) => setSessionForm((f) => ({ ...f, start_hour: v }))}
              onMinute={(v) => setSessionForm((f) => ({ ...f, start_min: v }))}
              onDuration={(v) => setSessionForm((f) => ({ ...f, duration: v }))}
            />
          </Field>

          <Field label="Capacitate maximă">
            <Input
              type="number"
              value={sessionForm.max_participants}
              onChange={(e) =>
                setSessionForm((f) => ({
                  ...f,
                  max_participants: e.target.value,
                }))
              }
              min={1}
            />
          </Field>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn
              variant="outline"
              type="button"
              onClick={() => setCreateOpen(false)}
            >
              Anulează
            </Btn>
            <Btn variant="primary" type="submit">
              Creează
            </Btn>
          </div>
        </form>
      </Modal>

      <Modal
        open={typeOpen}
        onClose={() => setTypeOpen(false)}
        title="Tip clasă nou"
      >
        <form
          onSubmit={handleCreateType}
          style={{
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <Field label="Nume">
            <Input
              value={typeForm.name}
              onChange={(e) =>
                setTypeForm((f) => ({ ...f, name: e.target.value }))
              }
              placeholder="ex: HIIT, Yoga, Box"
              required
            />
          </Field>
          <Field label="Descriere">
            <Input
              value={typeForm.description}
              onChange={(e) =>
                setTypeForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Descriere scurtă (opțional)"
            />
          </Field>
          <Field label="Dificultate">
            <select
              value={typeForm.difficulty_level}
              onChange={(e) =>
                setTypeForm((f) => ({ ...f, difficulty_level: e.target.value }))
              }
              style={SELECT_STYLE}
            >
              <option value="beginner">Începător</option>
              <option value="intermediate">Intermediar</option>
              <option value="advanced">Avansat</option>
            </select>
          </Field>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn
              variant="outline"
              type="button"
              onClick={() => setTypeOpen(false)}
            >
              Anulează
            </Btn>
            <Btn variant="primary" type="submit">
              Creează
            </Btn>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!enrollOpen}
        onClose={() => setEnrollOpen(null)}
        title="Lista clasei"
      >
        <div style={{ padding: "0 20px 20px" }}>
          {enrollOpen && (
            <div
              style={{
                padding: "12px 0 16px",
                borderBottom: "1px solid var(--border-soft)",
                marginBottom: 12,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {enrollOpen.Class_Type?.name || "Class"}
              </div>
              <div
                className="mono"
                style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}
              >
                {fmtTime(enrollOpen.start_datetime)} ·{" "}
                {durationMin(
                  enrollOpen.start_datetime,
                  enrollOpen.end_datetime,
                )}{" "}
                min
              </div>
            </div>
          )}

          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {enrollments.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: "var(--text-dim)",
                  padding: "32px 0",
                }}
              >
                Niciun client înscris.
              </div>
            ) : (
              enrollments.map((e) => {
                const name = e.Client
                  ? `${e.Client.first_name} ${e.Client.last_name}`
                  : `Membru #${e.client_id}`;
                const ENROLL_TONE = {
                  confirmed: "muted",
                  attended: "green",
                  no_show: "red",
                  waiting_list: "coral",
                  cancelled: "muted",
                };
                return (
                  <div
                    key={e.enrollment_id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 0",
                      borderBottom: "1px solid var(--border-soft)",
                    }}
                  >
                    <Avatar name={name} size={32} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>
                        {name}
                      </div>
                      {e.Client?.email && (
                        <div
                          className="mono"
                          style={{ fontSize: 10, color: "var(--text-dim)" }}
                        >
                          {e.Client.email}
                        </div>
                      )}
                    </div>
                    <Pill tone={ENROLL_TONE[e.status] || "muted"}>
                      {ENROLL_LABEL[e.status] || e.status}
                    </Pill>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Modal>

      <Modal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Anulează clasa"
      >
        <div
          style={{
            padding: "0 20px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: "var(--text-muted)",
              lineHeight: 1.6,
            }}
          >
            Ești sigur că vrei să anulezi această sesiune? Toți membrii înrolați
            vor pierde locul și vor primi un email de notificare.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="ghost" onClick={() => setCancelTarget(null)}>
              Înapoi
            </Btn>
            <Btn variant="danger" onClick={confirmCancel}>
              Anulează clasa
            </Btn>
          </div>
        </div>
      </Modal>
    </>
  );
}
