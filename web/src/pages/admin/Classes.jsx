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
import { getTrainersByGym } from "../../api/gymAdmin.js";
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

const EMPTY_SESSION_FORM = {
  class_type_id: "",
  trainer_id: "",
  start_datetime: "",
  end_datetime: "",
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
      const [sessionsRes, typesRes, trainersRes] = await Promise.all([
        getSessionsByGym(gymId),
        getClassTypesByGym(gymId),
        getTrainersByGym(gymId),
      ]);
      setSessions(sessionsRes.data);
      setClassTypes(typesRes.data);
      setTrainers(trainersRes.data);
    } catch (err) {
      toast(err.response?.data?.message || "Failed to load data", "coral");
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
    try {
      await createClassSession({
        class_type_id: parseInt(sessionForm.class_type_id),
        gym_id: gymId,
        trainer_id: parseInt(sessionForm.trainer_id),
        start_datetime: sessionForm.start_datetime,
        end_datetime: sessionForm.end_datetime,
        max_participants: parseInt(sessionForm.max_participants),
      });
      setCreateOpen(false);
      setSessionForm(EMPTY_SESSION_FORM);
      await load();
      toast("Class created");
    } catch (err) {
      toast(err.response?.data?.message || "Failed to create class", "coral");
    }
  };

  const handleCreateType = async (e) => {
    e.preventDefault();
    try {
      await createClassType({ ...typeForm, gym_id: gymId });
      toast("Class type created");
      setTypeOpen(false);
      setTypeForm(EMPTY_TYPE_FORM);
      getClassTypesByGym(gymId)
        .then((r) => setClassTypes(r.data))
        .catch(() => {});
    } catch (err) {
      toast(err.response?.data?.message || "Failed to create type", "coral");
    }
  };

  const handleCancelSession = async (sessionId) => {
    if (
      !window.confirm(
        "Cancel this class? All enrolled members will be notified.",
      )
    )
      return;
    try {
      await cancelClassSession(sessionId);
      await load();
      toast("Class cancelled");
    } catch (err) {
      toast(err.response?.data?.message || "Failed to cancel", "coral");
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
        title="Classes"
        eyebrow={`Schedule · ${
          sessions.filter((s) => {
            const dk = localDate(s.start_datetime);
            return dk >= localDate(week1[0]) && dk <= localDate(week2[6]);
          }).length
        } sessions across 2 weeks`}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <Btn
              variant="outline"
              icon={<I.plus />}
              onClick={() => setTypeOpen(true)}
            >
              New class type
            </Btn>
            <Btn
              variant="primary"
              icon={<I.plus />}
              onClick={() => setCreateOpen(true)}
            >
              Create class
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
                  {cnt > 0 ? `${cnt} class${cnt > 1 ? "es" : ""}` : "—"}
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
                  {cnt > 0 ? `${cnt} class${cnt > 1 ? "es" : ""}` : "—"}
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
            No gym assigned to your account.
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
            Loading...
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
              No classes scheduled
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
              <div>Time</div>
              <div>Class</div>
              <div>Trainer</div>
              <div>Capacity</div>
              <div>Status</div>
              <div />
            </div>

            {daySessions.map((c) => {
              const fill = (c.confirmed_count || 0) / (c.max_participants || 1);
              const trainerName = c.Trainer
                ? `${c.Trainer.first_name} ${c.Trainer.last_name}`
                : "—";
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
                      {c.Class_Type?.name || "—"}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <Pill tone={fill >= 1 ? "coral" : "accent"}>
                        {fill >= 1 ? "Full" : `${Math.round(fill * 100)}%`}
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
                    {c.status}
                  </Pill>

                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      title="View roster"
                      onClick={() => openEnrollments(c)}
                      style={{ color: "var(--text-dim)", padding: 4 }}
                    >
                      <I.users width={14} height={14} />
                    </button>
                    {c.status !== "cancelled" && (
                      <button
                        title="Cancel class"
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
        title="Create Class"
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
          <Field label="Class Type">
            <select
              value={sessionForm.class_type_id}
              onChange={(e) =>
                setSessionForm((f) => ({ ...f, class_type_id: e.target.value }))
              }
              required
              style={SELECT_STYLE}
            >
              <option value="">— Select class type —</option>
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
                No class types yet.{" "}
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
                  Create one first
                </button>
              </div>
            )}
          </Field>

          <Field label="Trainer">
            <select
              value={sessionForm.trainer_id}
              onChange={(e) =>
                setSessionForm((f) => ({ ...f, trainer_id: e.target.value }))
              }
              required
              style={SELECT_STYLE}
            >
              <option value="">— Select trainer —</option>
              {trainers.map((t) => (
                <option key={t.user_id} value={t.user_id}>
                  {t.first_name} {t.last_name}
                </option>
              ))}
            </select>
          </Field>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <Field label="Start">
              <Input
                type="datetime-local"
                value={sessionForm.start_datetime}
                onChange={(e) =>
                  setSessionForm((f) => ({
                    ...f,
                    start_datetime: e.target.value,
                  }))
                }
                required
              />
            </Field>
            <Field label="End">
              <Input
                type="datetime-local"
                value={sessionForm.end_datetime}
                onChange={(e) =>
                  setSessionForm((f) => ({
                    ...f,
                    end_datetime: e.target.value,
                  }))
                }
                required
              />
            </Field>
          </div>

          <Field label="Max Capacity">
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
              Cancel
            </Btn>
            <Btn variant="primary" type="submit">
              Create
            </Btn>
          </div>
        </form>
      </Modal>

      <Modal
        open={typeOpen}
        onClose={() => setTypeOpen(false)}
        title="New Class Type"
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
          <Field label="Name">
            <Input
              value={typeForm.name}
              onChange={(e) =>
                setTypeForm((f) => ({ ...f, name: e.target.value }))
              }
              placeholder="e.g. HIIT, Yoga, Boxing"
              required
            />
          </Field>
          <Field label="Description">
            <Input
              value={typeForm.description}
              onChange={(e) =>
                setTypeForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Optional short description"
            />
          </Field>
          <Field label="Difficulty">
            <select
              value={typeForm.difficulty_level}
              onChange={(e) =>
                setTypeForm((f) => ({ ...f, difficulty_level: e.target.value }))
              }
              style={SELECT_STYLE}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </Field>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn
              variant="outline"
              type="button"
              onClick={() => setTypeOpen(false)}
            >
              Cancel
            </Btn>
            <Btn variant="primary" type="submit">
              Create
            </Btn>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!enrollOpen}
        onClose={() => setEnrollOpen(null)}
        title="Class Roster"
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
                No enrollments yet.
              </div>
            ) : (
              enrollments.map((e) => {
                const name = e.Client
                  ? `${e.Client.first_name} ${e.Client.last_name}`
                  : `Member #${e.client_id}`;
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
                      {e.status}
                    </Pill>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
