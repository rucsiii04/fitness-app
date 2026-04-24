import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getMyGyms, createGym, updateGym, setGymAlert } from "../../api/gymAdmin.js";
import { useToast } from "../../context/ToastContext.jsx";
import TopBar from "../../components/layout/TopBar.jsx";
import Panel from "../../components/ui/Panel.jsx";
import Btn from "../../components/ui/Btn.jsx";
import Field from "../../components/ui/Field.jsx";
import Input from "../../components/ui/Input.jsx";
import Pill from "../../components/ui/Pill.jsx";
import * as I from "../../components/ui/Icons.jsx";

const SETTINGS_SECTIONS = ["Profile", "Hours & Access", "Capacity & Safety", "Notifications"];

export default function AdminSettings() {
  const { user } = useAuth();
  const toast = useToast();
  const [section, setSection] = useState("Profile");
  const [gym, setGym] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "", address: "", opening_time: "06:00", closing_time: "22:00", max_capacity: "",
  });

  const [alertForm, setAlertForm] = useState({ message: "", days: "" });
  const [alertSaving, setAlertSaving] = useState(false);

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
          setAlertForm({ message: g.alert_message || "", days: "" });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (gym) {
        await updateGym(gym.gym_id, form);
        toast("Gym settings saved");
      } else {
        await createGym(form);
        toast("Gym created");
        load();
      }
    } catch (err) {
      toast(err.response?.data?.message || "Failed to save", "coral");
    } finally {
      setSaving(false);
    }
  };

  const handleSetAlert = async () => {
    if (!gym) return;
    setAlertSaving(true);
    try {
      const payload = { message: alertForm.message };
      if (alertForm.days) payload.days = parseInt(alertForm.days);
      await setGymAlert(gym.gym_id, payload);
      toast(alertForm.message ? "Alert set" : "Alert cleared");
      load();
    } catch (err) {
      toast(err.response?.data?.message || "Failed to set alert", "coral");
    } finally {
      setAlertSaving(false);
    }
  };

  const handleClearAlert = async () => {
    if (!gym) return;
    setAlertSaving(true);
    try {
      await setGymAlert(gym.gym_id, { message: null });
      toast("Alert cleared");
      setAlertForm({ message: "", days: "" });
      load();
    } catch (err) {
      toast(err.response?.data?.message || "Failed", "coral");
    } finally {
      setAlertSaving(false);
    }
  };

  const upd = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const activeAlert = gym?.alert_message && (!gym.alert_expires_at || new Date(gym.alert_expires_at) > new Date());

  return (
    <>
      <TopBar title="Gym Settings" eyebrow="Profile & operations"
        actions={
          section !== "Notifications"
            ? <Btn variant="primary" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save changes"}</Btn>
            : null
        }
      />

      {loading ? (
        <div style={{ padding: "64px 32px", textAlign: "center", color: "var(--text-dim)", fontFamily: "var(--mono)", fontSize: 12 }}>Loading...</div>
      ) : (
        <div style={{ padding: 32, display: "grid", gridTemplateColumns: "240px 1fr", gap: 32 }}>
          {/* Side nav */}
          <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {SETTINGS_SECTIONS.map((s) => (
              <button key={s} onClick={() => setSection(s)} style={{
                padding: "10px 14px", borderRadius: 10, textAlign: "left",
                background: section === s ? "rgba(224,251,76,.08)" : "transparent",
                color: section === s ? "var(--accent)" : "var(--text-muted)",
                fontSize: 13, fontWeight: 500,
                borderLeft: section === s ? "2px solid var(--accent)" : "2px solid transparent",
              }}>{s}</button>
            ))}
          </nav>

          <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 640 }}>

            {section === "Profile" && (
              <Panel title="Gym Profile" eyebrow="Public information">
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <Field label="Gym Name">
                    <Input value={form.name} onChange={(e) => upd("name", e.target.value)} placeholder="Stayfit Titulescu" />
                  </Field>
                  <Field label="Address">
                    <Input icon={<I.pin />} value={form.address} onChange={(e) => upd("address", e.target.value)} placeholder="Str. Exemplu nr. 1" />
                  </Field>
                </div>
              </Panel>
            )}

            {section === "Hours & Access" && (
              <Panel title="Operating Hours" eyebrow="Daily open & close time">
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <Field label="Opens at">
                      <Input type="time" value={form.opening_time} onChange={(e) => upd("opening_time", e.target.value)} />
                    </Field>
                    <Field label="Closes at">
                      <Input type="time" value={form.closing_time} onChange={(e) => upd("closing_time", e.target.value)} />
                    </Field>
                  </div>
                  <div style={{ padding: 12, background: "var(--surface-2)", border: "1px solid var(--border-soft)", borderRadius: 10, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
                    These hours are used to automatically show a "Gym closed" notice to members outside of this window. You can override it with a custom alert in <button onClick={() => setSection("Notifications")} style={{ color: "var(--accent)", background: "none", padding: 0, cursor: "pointer", fontSize: 12 }}>Notifications</button>.
                  </div>
                </div>
              </Panel>
            )}

            {section === "Capacity & Safety" && (
              <Panel title="Capacity & Safety" eyebrow="Max occupancy">
                <Field label="Total floor capacity">
                  <Input
                    type="number"
                    value={form.max_capacity}
                    onChange={(e) => upd("max_capacity", e.target.value)}
                    placeholder="180"
                    right={<span className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>PEOPLE</span>}
                  />
                </Field>
              </Panel>
            )}

            {section === "Notifications" && (
              <>
                {activeAlert && (
                  <div style={{ padding: 14, background: "rgba(255,115,81,.08)", border: "1px solid rgba(255,115,81,.3)", borderRadius: 12, display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <I.bell width={16} height={16} style={{ color: "var(--coral)", marginTop: 2, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--coral)", marginBottom: 4 }}>Active alert</div>
                      <div style={{ fontSize: 13, color: "var(--text)" }}>{gym.alert_message}</div>
                      {gym.alert_expires_at && (
                        <div className="mono" style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 4 }}>
                          Expires {new Date(gym.alert_expires_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                      )}
                    </div>
                    <Btn variant="ghost" size="sm" onClick={handleClearAlert} disabled={alertSaving}>Clear</Btn>
                  </div>
                )}

                <Panel title="Gym Closure Alert" eyebrow="Shown to all members">
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <Field label="Alert message" hint="Leave blank and save to clear any existing alert">
                      <textarea
                        value={alertForm.message}
                        onChange={(e) => setAlertForm((f) => ({ ...f, message: e.target.value }))}
                        placeholder="e.g. Closed for maintenance on 25 Dec. See you on 26 Dec!"
                        style={{ width: "100%", minHeight: 80, padding: 12, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 14, resize: "vertical", outline: "none", fontFamily: "var(--sans)" }}
                      />
                    </Field>
                    <Field label="Expires after (days)" hint="Optional — leave blank for no expiry">
                      <Input
                        type="number"
                        value={alertForm.days}
                        onChange={(e) => setAlertForm((f) => ({ ...f, days: e.target.value }))}
                        placeholder="e.g. 3"
                        right={<span className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>DAYS</span>}
                      />
                    </Field>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Btn variant="primary" onClick={handleSetAlert} disabled={alertSaving || !gym}>
                        {alertSaving ? "Saving..." : alertForm.message ? "Set alert" : "Clear alert"}
                      </Btn>
                      {activeAlert && (
                        <Btn variant="ghost" onClick={handleClearAlert} disabled={alertSaving}>Remove alert</Btn>
                      )}
                    </div>
                  </div>
                </Panel>
              </>
            )}

          </div>
        </div>
      )}
    </>
  );
}
