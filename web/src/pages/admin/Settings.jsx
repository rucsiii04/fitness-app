import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  getMyGyms,
  createGym,
  updateGym,
  setGymAlert,
  extendMemberships,
  cancelAffectedClasses,
} from "../../api/gymAdmin.js";
import { useToast } from "../../context/ToastContext.jsx";
import TopBar from "../../components/layout/TopBar.jsx";
import Panel from "../../components/ui/Panel.jsx";
import Btn from "../../components/ui/Btn.jsx";
import Field from "../../components/ui/Field.jsx";
import Input from "../../components/ui/Input.jsx";
import Pill from "../../components/ui/Pill.jsx";
import * as I from "../../components/ui/Icons.jsx";

const SETTINGS_SECTIONS = [
  "Profil",
  "Program & Acces",
  "Capacitate & Siguranță",
  "Notificări",
];

export default function AdminSettings() {
  const { user } = useAuth();
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
  const [alertSaving, setAlertSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionResults, setActionResults] = useState({ extend: null, classes: null });

  const load = () =>
    getMyGyms()
      .then((r) => {
        const g = r.data[0];
        if (g) {
          setGym(g);
          setForm({
            name: g.name || "",
            address: g.address || "",
            opening_time: g.opening_time?.slice(0, 5) || "06:00",
            closing_time: g.closing_time?.slice(0, 5) || "22:00",
            max_capacity: g.max_capacity || "",
          });
          setAlertForm({
            message: g.alert_message || "",
            end_at: g.alert_expires_at ? new Date(g.alert_expires_at).toISOString().slice(0, 16) : "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

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
        toast("Te rugăm să setezi capacitatea sălii înainte de salvare", "coral");
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
        await createGym(form);
        toast("Sala a fost creată");
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
        end_at: alertForm.end_at || null,
      };
      await setGymAlert(gym.gym_id, payload);
      toast(alertForm.message ? "Alertă setată" : "Alertă eliminată");
      setActionResults({ extend: null, classes: null });
      load();
    } catch (err) {
      toast(err.response?.data?.message || "Eroare la setarea alertei", "coral");
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
      setActionResults({ extend: null, classes: null });
      load();
    } catch (err) {
      toast(err.response?.data?.message || "Eroare", "coral");
    } finally {
      setAlertSaving(false);
    }
  };

  const handleExtendMemberships = async () => {
    if (!gym) return;
    setActionLoading("extend");
    try {
      const r = await extendMemberships(gym.gym_id);
      setActionResults((p) => ({ ...p, extend: r.data.extended_count }));
    } catch (err) {
      toast(err.response?.data?.message || "Eroare", "coral");
    } finally {
      setActionLoading(null);
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
                  background: section === s ? "rgba(224,251,76,.08)" : "transparent",
                  color: section === s ? "var(--accent)" : "var(--text-muted)",
                  fontSize: 13,
                  fontWeight: 500,
                  borderLeft: section === s ? "2px solid var(--accent)" : "2px solid transparent",
                }}
              >
                {s}
              </button>
            ))}
          </nav>

          <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 640 }}>

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
                      Configurare inițială —{" "}
                    </span>
                    completează{" "}
                    <button
                      onClick={() => setSection("Program & Acces")}
                      style={{ color: "var(--accent)", background: "none", padding: 0, cursor: "pointer", fontSize: 13 }}
                    >
                      Program & Acces
                    </button>{" "}
                    și{" "}
                    <button
                      onClick={() => setSection("Capacitate & Siguranță")}
                      style={{ color: "var(--accent)", background: "none", padding: 0, cursor: "pointer", fontSize: 13 }}
                    >
                      Capacitate & Siguranță
                    </button>{" "}
                    înainte de salvare.
                  </div>
                )}
                <Panel title="Profilul Sălii" eyebrow="Informații publice">
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
              <Panel title="Program de funcționare" eyebrow="Ora de deschidere și închidere zilnică">
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Field label="Deschide la">
                      <Input
                        type="time"
                        value={form.opening_time}
                        onChange={(e) => upd("opening_time", e.target.value)}
                      />
                    </Field>
                    <Field label="Închide la">
                      <Input
                        type="time"
                        value={form.closing_time}
                        onChange={(e) => upd("closing_time", e.target.value)}
                      />
                    </Field>
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
                    Aceste ore sunt folosite pentru a afișa automat un mesaj „Sala închisă"
                    membrilor în afara acestui interval. Poți suprascrie cu o alertă personalizată în{" "}
                    <button
                      onClick={() => setSection("Notificări")}
                      style={{ color: "var(--accent)", background: "none", padding: 0, cursor: "pointer", fontSize: 12 }}
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
                      <span className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>
                        PERSOANE
                      </span>
                    }
                  />
                </Field>
              </Panel>
            )}

            {section === "Notificări" && (
              <>
                {activeAlert && (
                  <div
                    style={{
                      padding: 14,
                      background: "rgba(255,115,81,.08)",
                      border: "1px solid rgba(255,115,81,.3)",
                      borderRadius: 12,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <I.bell
                      width={16}
                      height={16}
                      style={{ color: "var(--coral)", marginTop: 2, flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--coral)", marginBottom: 4 }}>
                        Alertă activă
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text)" }}>
                        {gym.alert_message}
                      </div>
                      {gym.alert_expires_at && (
                        <div className="mono" style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 4 }}>
                          Până la {new Date(gym.alert_expires_at).toLocaleString("ro-RO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </div>
                      )}
                    </div>
                    <Btn variant="ghost" size="sm" onClick={handleClearAlert} disabled={alertSaving}>
                      Șterge
                    </Btn>
                  </div>
                )}

                <Panel title="Alertă Închidere Sală" eyebrow="Vizibilă pentru toți membrii">
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <Field label="Motiv / mesaj">
                      <textarea
                        value={alertForm.message}
                        onChange={(e) => setAlertForm((f) => ({ ...f, message: e.target.value }))}
                        placeholder="ex. Închidere temporară pentru lucrări de întreținere"
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
                    <Field label="Ora estimată de redeschidere" hint="Opțional — folosit și ca expirare a alertei">
                      <Input
                        type="datetime-local"
                        value={alertForm.end_at}
                        onChange={(e) => setAlertForm((f) => ({ ...f, end_at: e.target.value }))}
                      />
                    </Field>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Btn
                        variant="primary"
                        onClick={handleSetAlert}
                        disabled={alertSaving || !gym || !alertForm.message}
                      >
                        {alertSaving ? "Se salvează..." : "Setează alerta"}
                      </Btn>
                      {activeAlert && (
                        <Btn variant="ghost" onClick={handleClearAlert} disabled={alertSaving}>
                          Elimină alerta
                        </Btn>
                      )}
                    </div>
                  </div>
                </Panel>

                {activeAlert && (
                  <Panel title="Acțiuni opționale" eyebrow="Manual — nu se întâmplă automat">
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 16,
                        padding: "12px 14px",
                        borderRadius: 10,
                        background: "var(--surface-2)",
                        border: `1px solid ${actionResults.extend !== null ? "rgba(110,231,183,.3)" : "var(--border-soft)"}`,
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>
                            Extinde toate abonamentele cu +1 zi
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            Adaugă o zi în plus la fiecare abonament activ sau în pauză din această sală.
                          </div>
                        </div>
                        {actionResults.extend !== null ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgb(110,231,183)", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                            <span>✓</span>
                            <span>{actionResults.extend} abonament{actionResults.extend !== 1 ? "e" : ""} extinse</span>
                          </div>
                        ) : (
                          <Btn
                            variant="ghost"
                            size="sm"
                            onClick={handleExtendMemberships}
                            disabled={actionLoading !== null}
                          >
                            {actionLoading === "extend" ? "Se procesează..." : "Aplică"}
                          </Btn>
                        )}
                      </div>

                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 16,
                        padding: "12px 14px",
                        borderRadius: 10,
                        background: "var(--surface-2)",
                        border: `1px solid ${actionResults.classes !== null ? "rgba(110,231,183,.3)" : "var(--border-soft)"}`,
                        opacity: !gym.alert_expires_at ? 0.5 : 1,
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>
                            Anulează cursurile afectate
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            {gym.alert_expires_at
                              ? `Anulează cursurile programate de acum până la ${new Date(gym.alert_expires_at).toLocaleString("ro-RO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}. Anulează și înrolările membrilor.`
                              : "Setează o oră de redeschidere pentru a activa această opțiune."}
                          </div>
                        </div>
                        {actionResults.classes !== null ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgb(110,231,183)", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                            <span>✓</span>
                            <span>{actionResults.classes} curs{actionResults.classes !== 1 ? "uri" : ""} anulate</span>
                          </div>
                        ) : (
                          <Btn
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelClasses}
                            disabled={actionLoading !== null || !gym.alert_expires_at}
                          >
                            {actionLoading === "classes" ? "Se anulează..." : "Aplică"}
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
    </>
  );
}
