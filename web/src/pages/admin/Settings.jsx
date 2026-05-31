import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  getMyGyms,
  createGym,
  updateGym,
  setGymAlert,
  cancelAffectedClasses,
} from "../../api/gymAdmin.js";
import {
  getAdminFreezeStatus,
  adminFreezeGymMemberships,
  adminUnfreezeGymMemberships,
} from "../../api/memberships.js";
import { useToast } from "../../context/ToastContext.jsx";
import TopBar from "../../components/layout/TopBar.jsx";
import Panel from "../../components/ui/Panel.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Btn from "../../components/ui/Btn.jsx";
import Field from "../../components/ui/Field.jsx";
import Input from "../../components/ui/Input.jsx";
import Pill from "../../components/ui/Pill.jsx";
import * as I from "../../components/ui/Icons.jsx";

function TimeSelect({ value, onChange }) {
  const handleChange = (e) => {
    let v = e.target.value.replace(/[^0-9:]/g, "");
    if (v.length === 2 && !v.includes(":") && (value || "").length < 3)
      v += ":";
    if (v.length > 5) return;
    onChange({ target: { value: v } });
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "var(--surface-2)",
        border: "1px solid var(--border-strong)",
        borderRadius: 10,
        padding: "0 14px",
        height: 44,
      }}
    >
      <I.clock
        width={15}
        height={15}
        style={{ color: "var(--text-dim)", flexShrink: 0 }}
      />
      <input
        type="text"
        value={value || ""}
        onChange={handleChange}
        placeholder="00:00"
        maxLength={5}
        style={{
          flex: 1,
          background: "transparent",
          border: "none",
          outline: "none",
          color: "var(--text)",
          fontSize: 15,
          fontFamily: "var(--mono)",
          letterSpacing: 3,
        }}
      />
    </div>
  );
}

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

function buildWeeks(year, month) {
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

function DateTimePicker({ value, onChange }) {
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const selDate = value ? value.slice(0, 10) : null;
  const selHour = value ? parseInt(value.slice(11, 13)) || 0 : 9;
  const selMin = value ? parseInt(value.slice(14, 16)) || 0 : 0;

  const [calOpen, setCalOpen] = React.useState(false);
  const [calYear, setCalYear] = React.useState(() =>
    selDate ? parseInt(selDate.slice(0, 4)) : now.getFullYear(),
  );
  const [calMonth, setCalMonth] = React.useState(() =>
    selDate ? parseInt(selDate.slice(5, 7)) - 1 : now.getMonth(),
  );

  function iso(date, h, m) {
    return `${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  function pickDate(dk) {
    onChange(iso(dk, selHour, selMin));
    setCalOpen(false);
  }
  function setHour(h) {
    if (selDate) onChange(iso(selDate, ((h % 24) + 24) % 24, selMin));
  }
  function setMin(m) {
    if (selDate) onChange(iso(selDate, selHour, ((m % 60) + 60) % 60));
  }
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

  const dispDate = selDate
    ? (() => {
        const [y, mo, d] = selDate.split("-").map(Number);
        return `${d} ${MONTHS_SHORT[mo - 1]} ${y}`;
      })()
    : "Alege data";

  const weeks = buildWeeks(calYear, calMonth);

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Date button + calendar dropdown */}
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
            color: selDate ? "var(--text)" : "var(--text-dim)",
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
          {selDate && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              style={{
                color: "var(--text-dim)",
                cursor: "pointer",
                fontSize: 18,
                lineHeight: 1,
                paddingLeft: 4,
              }}
            >
              ×
            </span>
          )}
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
            {/* Month nav */}
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

            {/* Day headers */}
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

            {/* Day grid */}
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
                  const isSel = dk === selDate;
                  const isPast = dk < todayKey;
                  return (
                    <button
                      key={di}
                      type="button"
                      onClick={() => !isPast && pickDate(dk)}
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

      {/* Time spinner - only when date is selected */}
      {selDate && (
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
          <span style={{ fontSize: 12, color: "var(--text-dim)" }}>Ora</span>

          {/* Hour */}
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
              onClick={() => setHour(selHour + 1)}
              style={spinBtn}
            >
              ▲
            </button>
            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "var(--text)",
                minWidth: 32,
                textAlign: "center",
              }}
            >
              {String(selHour).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={() => setHour(selHour - 1)}
              style={spinBtn}
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

          {/* Minute */}
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
              onClick={() => setMin(selMin + 5)}
              style={spinBtn}
            >
              ▲
            </button>
            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "var(--text)",
                minWidth: 32,
                textAlign: "center",
              }}
            >
              {String(selMin).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={() => setMin(selMin - 5)}
              style={spinBtn}
            >
              ▼
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const SETTINGS_SECTIONS = [
  "Profil",
  "Program & Acces",
  "Capacitate & Siguranță",
  "Notificări",
];

export default function AdminSettings() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [section, setSection] = useState("Profil");
  const [gym, setGym] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    address: "",
    opening_time: "06:00",
    closing_time: "22:00",
    max_capacity: "",
  });

  const [alertForm, setAlertForm] = useState({ message: "", end_at: "" });
  const [hasExpiry, setHasExpiry] = useState(false);
  const [alertSaving, setAlertSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionResults, setActionResults] = useState({ classes: null });

  const gymId = user?.gym_id;
  const [frozenCount, setFrozenCount] = useState(0);
  const [freezeOpen, setFreezeOpen] = useState(false);
  const [unfreezeOpen, setUnfreezeOpen] = useState(false);
  const [freezeWorking, setFreezeWorking] = useState(false);

  const load = () => {
    const proms = [getMyGyms()];
    if (gymId) {
      proms.push(
        getAdminFreezeStatus(gymId).catch(() => ({
          data: { frozen_count: 0 },
        })),
      );
    }
    Promise.all(proms)
      .then(([gymsRes, freezeRes]) => {
        const g = gymsRes.data[0];
        if (g) {
          setGym(g);
          setForm({
            name: g.name || "",
            address: g.address || "",
            opening_time: g.opening_time?.slice(0, 5) || "06:00",
            closing_time: g.closing_time?.slice(0, 5) || "22:00",
            max_capacity: g.max_capacity || "",
          });
          const loadedEndAt = g.alert_expires_at
            ? new Date(g.alert_expires_at).toISOString().slice(0, 16)
            : "";
          setAlertForm({
            message: g.alert_message || "",
            end_at: loadedEndAt,
          });
          setHasExpiry(!!loadedEndAt);
        }
        if (freezeRes) setFrozenCount(freezeRes.data.frozen_count ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    if (!gym) {
      if (!form.name || !form.address) {
        toast("Te rugăm să completezi numele și adresa sălii", "coral");
        setSection("Profil");
        return;
      }
      if (!form.max_capacity) {
        toast(
          "Te rugăm să setezi capacitatea sălii înainte de salvare",
          "coral",
        );
        setSection("Capacitate & Siguranță");
        return;
      }
    }
    setSaving(true);
    try {
      if (gym) {
        await updateGym(gym.gym_id, form);
        toast("Setările sălii au fost salvate");
      } else {
        const created = await createGym(form);
        toast("Sala a fost creată");
        if (created.data.geocoded === false) {
          toast(
            "Adresa nu a putut fi geocodată - locația pe hartă va lipsi. Verifică adresa și salvează din nou.",
            "coral",
          );
        }
        await refreshUser();
        load();
      }
    } catch (err) {
      toast(err.response?.data?.message || "Eroare la salvare", "coral");
    } finally {
      setSaving(false);
    }
  };

  const handleSetAlert = async () => {
    if (!gym) return;
    setAlertSaving(true);
    try {
      const payload = {
        message: alertForm.message || null,
        end_at: hasExpiry ? alertForm.end_at || null : null,
      };
      await setGymAlert(gym.gym_id, payload);
      toast(alertForm.message ? "Alertă setată" : "Alertă eliminată");
      setActionResults({ classes: null });
      load();
    } catch (err) {
      toast(
        err.response?.data?.message || "Eroare la setarea alertei",
        "coral",
      );
    } finally {
      setAlertSaving(false);
    }
  };

  const handleClearAlert = async () => {
    if (!gym) return;
    setAlertSaving(true);
    try {
      await setGymAlert(gym.gym_id, { message: null });
      toast("Alertă eliminată");
      setAlertForm({ message: "", end_at: "" });
      setHasExpiry(false);
      setActionResults({ classes: null });
      load();
    } catch (err) {
      toast(err.response?.data?.message || "Eroare", "coral");
    } finally {
      setAlertSaving(false);
    }
  };

  const handleCancelClasses = async () => {
    if (!gym) return;
    setActionLoading("classes");
    try {
      const r = await cancelAffectedClasses(gym.gym_id);
      setActionResults((p) => ({ ...p, classes: r.data.cancelled_count }));
    } catch (err) {
      toast(err.response?.data?.message || "Eroare", "coral");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAdminFreeze = async () => {
    setFreezeWorking(true);
    try {
      const r = await adminFreezeGymMemberships(gymId);
      toast(r.data.message);
      setFreezeOpen(false);
      load();
    } catch (err) {
      toast(err.response?.data?.message || "Eroare la înghețare", "coral");
    } finally {
      setFreezeWorking(false);
    }
  };

  const handleAdminUnfreeze = async () => {
    setFreezeWorking(true);
    try {
      const r = await adminUnfreezeGymMemberships(gymId);
      toast(r.data.message);
      setUnfreezeOpen(false);
      load();
    } catch (err) {
      toast(err.response?.data?.message || "Eroare la dezghețare", "coral");
    } finally {
      setFreezeWorking(false);
    }
  };

  const upd = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const activeAlert =
    gym?.alert_message &&
    (!gym.alert_expires_at || new Date(gym.alert_expires_at) > new Date());

  return (
    <>
      <TopBar
        title="Setări Sală"
        eyebrow="Profil & operațiuni"
        actions={
          section !== "Notificări" ? (
            <Btn variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? "Se salvează..." : "Salvează modificările"}
            </Btn>
          ) : null
        }
      />

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
          Se încarcă...
        </div>
      ) : (
        <div
          style={{
            padding: 32,
            display: "grid",
            gridTemplateColumns: "240px 1fr",
            gap: 32,
          }}
        >
          <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {SETTINGS_SECTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setSection(s)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  textAlign: "left",
                  background:
                    section === s ? "rgba(224,251,76,.08)" : "transparent",
                  color: section === s ? "var(--accent)" : "var(--text-muted)",
                  fontSize: 13,
                  fontWeight: 500,
                  borderLeft:
                    section === s
                      ? "2px solid var(--accent)"
                      : "2px solid transparent",
                }}
              >
                {s}
              </button>
            ))}
          </nav>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 24,
              maxWidth: 640,
            }}
          >
            {section === "Profil" && (
              <>
                {!gym && (
                  <div
                    style={{
                      padding: "12px 16px",
                      background: "rgba(224,251,76,.06)",
                      border: "1px solid rgba(224,251,76,.2)",
                      borderRadius: 10,
                      fontSize: 13,
                      color: "var(--text-muted)",
                      lineHeight: 1.6,
                    }}
                  >
                    <span style={{ color: "var(--accent)", fontWeight: 600 }}>
                      Configurare inițială -{" "}
                    </span>
                    completează{" "}
                    <button
                      onClick={() => setSection("Program & Acces")}
                      style={{
                        color: "var(--accent)",
                        background: "none",
                        padding: 0,
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      Program & Acces
                    </button>{" "}
                    și{" "}
                    <button
                      onClick={() => setSection("Capacitate & Siguranță")}
                      style={{
                        color: "var(--accent)",
                        background: "none",
                        padding: 0,
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      Capacitate & Siguranță
                    </button>{" "}
                    înainte de salvare.
                  </div>
                )}
                <Panel title="Profilul Sălii" eyebrow="Informații publice">
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 14,
                    }}
                  >
                    <Field label="Numele sălii">
                      <Input
                        value={form.name}
                        onChange={(e) => upd("name", e.target.value)}
                        placeholder="Stayfit Titulescu"
                      />
                    </Field>
                    <Field label="Adresă">
                      <Input
                        icon={<I.pin />}
                        value={form.address}
                        onChange={(e) => upd("address", e.target.value)}
                        placeholder="Str. Exemplu nr. 1"
                      />
                    </Field>
                  </div>
                </Panel>
              </>
            )}

            {section === "Program & Acces" && (
              <Panel
                title="Program de funcționare"
                eyebrow="Ora de deschidere și închidere zilnică"
              >
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 14 }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 10,
                    }}
                  >
                    <Field label="Deschide la">
                      <TimeSelect
                        value={form.opening_time}
                        onChange={(e) => upd("opening_time", e.target.value)}
                      />
                    </Field>
                    <Field label="Închide la">
                      <TimeSelect
                        value={form.closing_time}
                        onChange={(e) => upd("closing_time", e.target.value)}
                      />
                    </Field>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                    Format: HH:MM
                  </div>
                  <div
                    style={{
                      padding: 12,
                      background: "var(--surface-2)",
                      border: "1px solid var(--border-soft)",
                      borderRadius: 10,
                      fontSize: 12,
                      color: "var(--text-muted)",
                      lineHeight: 1.6,
                    }}
                  >
                    Aceste ore sunt folosite pentru a afișa automat un mesaj
                    „Sala închisă" membrilor în afara acestui interval. Poți
                    suprascrie cu o alertă personalizată în{" "}
                    <button
                      onClick={() => setSection("Notificări")}
                      style={{
                        color: "var(--accent)",
                        background: "none",
                        padding: 0,
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      Notificări
                    </button>
                    .
                  </div>
                </div>
              </Panel>
            )}

            {section === "Capacitate & Siguranță" && (
              <Panel title="Capacitate & Siguranță" eyebrow="Capacitate maximă">
                <Field label="Capacitate totală a sălii">
                  <Input
                    type="number"
                    value={form.max_capacity}
                    onChange={(e) => upd("max_capacity", e.target.value)}
                    placeholder="180"
                    right={
                      <span
                        className="mono"
                        style={{ fontSize: 11, color: "var(--text-dim)" }}
                      >
                        PERSOANE
                      </span>
                    }
                  />
                </Field>
              </Panel>
            )}

            {section === "Notificări" && (
              <>
                <div
                  style={{
                    padding: 14,
                    background: activeAlert
                      ? "rgba(255,115,81,.08)"
                      : "var(--surface-2)",
                    border: `1px solid ${activeAlert ? "rgba(255,115,81,.3)" : "var(--border-soft)"}`,
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                  }}
                >
                  <I.bell
                    width={16}
                    height={16}
                    style={{
                      color: activeAlert ? "var(--coral)" : "var(--text-dim)",
                      marginTop: 2,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: activeAlert ? "var(--coral)" : "var(--text-dim)",
                        marginBottom: 4,
                      }}
                    >
                      {activeAlert ? "Alertă activă" : "Nicio alertă activă"}
                    </div>
                    {activeAlert && (
                      <>
                        <div style={{ fontSize: 13, color: "var(--text)" }}>
                          {gym.alert_message}
                        </div>
                        {gym.alert_expires_at && (
                          <div
                            className="mono"
                            style={{
                              fontSize: 10,
                              color: "var(--text-dim)",
                              marginTop: 4,
                            }}
                          >
                            Expiră la{" "}
                            {new Date(gym.alert_expires_at).toLocaleString(
                              "ro-RO",
                              {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              },
                            )}
                          </div>
                        )}
                        {!gym.alert_expires_at && (
                          <div
                            className="mono"
                            style={{
                              fontSize: 10,
                              color: "var(--text-dim)",
                              marginTop: 4,
                            }}
                          >
                            Fără dată de expirare - trebuie eliminată manual
                          </div>
                        )}
                      </>
                    )}
                    {!activeAlert && (
                      <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                        Membrii nu văd nicio alertă în acest moment.
                      </div>
                    )}
                  </div>
                  {activeAlert && (
                    <Btn
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAlert}
                      disabled={alertSaving}
                    >
                      Elimină
                    </Btn>
                  )}
                </div>

                <Panel
                  title="Alertă / Notificare"
                  eyebrow="Vizibilă pentru toți membrii"
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 14,
                    }}
                  >
                    <Field label="Mesaj">
                      <textarea
                        value={alertForm.message}
                        onChange={(e) =>
                          setAlertForm((f) => ({
                            ...f,
                            message: e.target.value,
                          }))
                        }
                        placeholder="ex. Sala va fi închisă mâine, eveniment special sâmbătă, lucrări în desfășurare..."
                        style={{
                          width: "100%",
                          minHeight: 80,
                          padding: 12,
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                          borderRadius: 10,
                          color: "var(--text)",
                          fontSize: 14,
                          resize: "vertical",
                          outline: "none",
                          fontFamily: "var(--sans)",
                        }}
                      />
                    </Field>
                    <div>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          cursor: "pointer",
                          userSelect: "none",
                        }}
                      >
                        <div
                          onClick={() => {
                            const next = !hasExpiry;
                            setHasExpiry(next);
                            if (!next)
                              setAlertForm((f) => ({ ...f, end_at: "" }));
                          }}
                          style={{
                            width: 36,
                            height: 20,
                            borderRadius: 10,
                            flexShrink: 0,
                            background: hasExpiry
                              ? "var(--accent)"
                              : "var(--surface-3)",
                            border: `1px solid ${hasExpiry ? "var(--accent)" : "var(--border)"}`,
                            position: "relative",
                            transition: "background .2s",
                            cursor: "pointer",
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              top: 2,
                              left: hasExpiry ? 17 : 2,
                              width: 14,
                              height: 14,
                              borderRadius: "50%",
                              background: hasExpiry
                                ? "var(--bg)"
                                : "var(--text-dim)",
                              transition: "left .2s",
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: 13,
                            color: "var(--text-muted)",
                            fontWeight: 500,
                          }}
                        >
                          Setează dată de expirare
                        </span>
                      </label>
                      {hasExpiry && (
                        <div style={{ marginTop: 10 }}>
                          <DateTimePicker
                            value={alertForm.end_at}
                            onChange={(v) =>
                              setAlertForm((f) => ({ ...f, end_at: v }))
                            }
                          />
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--text-dim)",
                              marginTop: 6,
                            }}
                          >
                            Alerta dispare automat după această dată/oră.
                          </div>
                        </div>
                      )}
                    </div>
                    <Btn
                      variant="primary"
                      onClick={handleSetAlert}
                      disabled={alertSaving || !gym || !alertForm.message}
                    >
                      {alertSaving ? "Se salvează..." : "Setează alerta"}
                    </Btn>
                  </div>
                </Panel>

                <Panel
                  title="Stare abonamente"
                  eyebrow="Închidere temporară sală"
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          flexShrink: 0,
                          background:
                            frozenCount > 0
                              ? "rgba(147,197,253,.15)"
                              : "var(--surface-2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {frozenCount > 0 ? (
                          <I.snowflake
                            width={16}
                            height={16}
                            style={{ color: "#93c5fd" }}
                          />
                        ) : (
                          <I.building
                            width={16}
                            height={16}
                            style={{ color: "var(--text-dim)" }}
                          />
                        )}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: frozenCount > 0 ? "#93c5fd" : "var(--text)",
                            marginBottom: 3,
                          }}
                        >
                          {frozenCount > 0
                            ? `${frozenCount} abonament${frozenCount !== 1 ? "e" : ""} înghețat${frozenCount !== 1 ? "e" : ""}`
                            : "Sala este deschisă"}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                          {frozenCount > 0
                            ? "Membrii nu pierd zile. Apasă pentru a dezgheța."
                            : "Îngheață toate abonamentele active la închiderea sălii."}
                        </div>
                      </div>
                    </div>
                    {frozenCount > 0 ? (
                      <Btn
                        variant="outline"
                        size="sm"
                        onClick={() => setUnfreezeOpen(true)}
                        disabled={freezeWorking || !gymId}
                      >
                        Dezgheață abonamente
                      </Btn>
                    ) : (
                      <Btn
                        variant="outline"
                        size="sm"
                        onClick={() => setFreezeOpen(true)}
                        disabled={freezeWorking || !gymId}
                      >
                        Îngheață abonamente
                      </Btn>
                    )}
                  </div>
                </Panel>

                {gym && (
                  <Panel
                    title="Acțiuni opționale"
                    eyebrow="Manual - nu se întâmplă automat"
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 16,
                          padding: "12px 14px",
                          borderRadius: 10,
                          background: "var(--surface-2)",
                          border: `1px solid ${actionResults.classes !== null ? "rgba(110,231,183,.3)" : "var(--border-soft)"}`,
                          opacity: !gym?.alert_expires_at ? 0.5 : 1,
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "var(--text)",
                              marginBottom: 2,
                            }}
                          >
                            Anulează cursurile afectate
                          </div>
                          <div
                            style={{ fontSize: 11, color: "var(--text-muted)" }}
                          >
                            {gym?.alert_expires_at
                              ? `Anulează cursurile programate de acum până la ${new Date(gym.alert_expires_at).toLocaleString("ro-RO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false })}. Anulează și înrolările membrilor.`
                              : "Setează o dată de expirare a alertei pentru a activa această opțiune."}
                          </div>
                        </div>
                        {actionResults.classes !== null ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              color: "rgb(110,231,183)",
                              fontSize: 12,
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                            }}
                          >
                            <span>✓</span>
                            <span>
                              {actionResults.classes} curs
                              {actionResults.classes !== 1 ? "uri" : ""} anulate
                            </span>
                          </div>
                        ) : (
                          <Btn
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelClasses}
                            disabled={
                              actionLoading !== null || !gym?.alert_expires_at
                            }
                          >
                            {actionLoading === "classes"
                              ? "Se anulează..."
                              : "Aplică"}
                          </Btn>
                        )}
                      </div>
                    </div>
                  </Panel>
                )}
              </>
            )}
          </div>
        </div>
      )}
      <Modal
        open={freezeOpen}
        onClose={() => setFreezeOpen(false)}
        title="Îngheață abonamentele sălii"
      >
        <div
          style={{
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div
            style={{ fontSize: 14, color: "var(--text-dim)", lineHeight: 1.6 }}
          >
            Toate abonamentele active vor fi înghețate. Membrii nu vor pierde
            zile cât timp sala este închisă. Datele de expirare vor fi extinse
            automat la redeschidere.
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn
              variant="outline"
              onClick={() => setFreezeOpen(false)}
              disabled={freezeWorking}
            >
              Anulează
            </Btn>
            <Btn
              variant="primary"
              onClick={handleAdminFreeze}
              disabled={freezeWorking}
              icon={<I.snowflake />}
            >
              {freezeWorking ? "Se procesează..." : "Îngheață abonamentele"}
            </Btn>
          </div>
        </div>
      </Modal>

      <Modal
        open={unfreezeOpen}
        onClose={() => setUnfreezeOpen(false)}
        title="Redeschide sala & dezgheață abonamentele"
      >
        <div
          style={{
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div
            style={{ fontSize: 14, color: "var(--text-dim)", lineHeight: 1.6 }}
          >
            {frozenCount} abonament{frozenCount !== 1 ? "e" : ""} vor fi
            reactivat{frozenCount !== 1 ? "e" : ""}. Fiecare dată de expirare va
            fi extinsă cu numărul exact de zile cât sala a fost închisă.
            Abonamentele puse în pauză de membri rămân neschimbate.
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn
              variant="outline"
              onClick={() => setUnfreezeOpen(false)}
              disabled={freezeWorking}
            >
              Anulează
            </Btn>
            <Btn
              variant="primary"
              onClick={handleAdminUnfreeze}
              disabled={freezeWorking}
              icon={<I.unlock />}
            >
              {freezeWorking ? "Se procesează..." : "Redeschide & dezgheață"}
            </Btn>
          </div>
        </div>
      </Modal>
    </>
  );
}
