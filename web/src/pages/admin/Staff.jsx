import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getTrainersByGym, createTrainer, deleteTrainer } from "../../api/gymAdmin.js";
import { useToast } from "../../context/ToastContext.jsx";
import TopBar from "../../components/layout/TopBar.jsx";
import Btn from "../../components/ui/Btn.jsx";
import Pill from "../../components/ui/Pill.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Field from "../../components/ui/Field.jsx";
import Input from "../../components/ui/Input.jsx";
import * as I from "../../components/ui/Icons.jsx";

export default function AdminStaff() {
  const { user } = useAuth();
  const toast = useToast();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", first_name: "", last_name: "", phone: "" });

  const gymId = user?.gym_id;

  const load = () => {
    if (!gymId) { setLoading(false); return; }
    getTrainersByGym(gymId)
      .then((r) => setStaff(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [gymId]);

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      await createTrainer({ ...form, gym_id: gymId });
      toast("Trainer invited");
      setInviteOpen(false);
      setForm({ email: "", password: "", first_name: "", last_name: "", phone: "" });
      load();
    } catch (err) { toast(err.response?.data?.message || "Failed to invite", "coral"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this trainer from the gym?")) return;
    try {
      await deleteTrainer(id);
      toast("Trainer removed");
      load();
    } catch (err) { toast(err.response?.data?.message || "Failed", "coral"); }
  };

  const filters = [
    { k: "all", label: "All", count: staff.length },
    { k: "trainer", label: "Trainers", count: staff.filter((s) => s.role === "trainer").length },
  ];

  const filtered = filter === "all" ? staff : staff.filter((s) => s.role === filter);

  return (
    <>
      <TopBar title="Staff" eyebrow={`${staff.length} team members`}
        actions={<Btn variant="primary" icon={<I.plus />} onClick={() => setInviteOpen(true)}>Invite trainer</Btn>} />

      <div style={{ padding: "20px 32px", display: "flex", gap: 8, borderBottom: "1px solid var(--border-soft)" }}>
        {filters.map((f) => (
          <button key={f.k} onClick={() => setFilter(f.k)} style={{
            padding: "8px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600,
            background: filter === f.k ? "var(--accent)" : "transparent",
            color: filter === f.k ? "var(--accent-ink)" : "var(--text-muted)",
            border: `1px solid ${filter === f.k ? "var(--accent)" : "var(--border-strong)"}`,
            textTransform: "uppercase", letterSpacing: 0.06, fontFamily: "var(--display)",
          }}>
            {f.label} <span style={{ opacity: 0.5, marginLeft: 6 }}>{f.count}</span>
          </button>
        ))}
      </div>

      <div style={{ padding: 32, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {loading && <div style={{ gridColumn: "1/-1", textAlign: "center", color: "var(--text-dim)", fontFamily: "var(--mono)", fontSize: 12, padding: "40px 0" }}>Loading...</div>}

        {!loading && filtered.length === 0 && (
          <div style={{ gridColumn: "1/-1", padding: "64px 0", textAlign: "center" }}>
            <I.users width={32} height={32} style={{ opacity: 0.2, marginBottom: 12 }} />
            <div className="display upper" style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 8 }}>
              {gymId ? "No trainers yet" : "No gym assigned"}
            </div>
            {gymId && <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Invite a trainer to get started.</div>}
          </div>
        )}

        {filtered.map((s) => {
          const name = `${s.first_name} ${s.last_name}`;
          return (
            <div key={s.user_id} className="card" style={{ padding: 18 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
                <Avatar name={name} size={48} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{name}</div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>{s.email}</div>
                </div>
                <span className="pulse-dot" style={{ width: 6, height: 6, borderRadius: 3, background: "var(--accent)", marginTop: 6 }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                <div>
                  <div className="eyebrow" style={{ fontSize: 9 }}>Role</div>
                  <div style={{ fontSize: 13, fontWeight: 600, textTransform: "capitalize" }}>{s.role}</div>
                </div>
                <div>
                  <div className="eyebrow" style={{ fontSize: 9 }}>Phone</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{s.phone || "—"}</div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid var(--border-soft)" }}>
                <Pill tone="green">Active</Pill>
                <button onClick={() => handleDelete(s.user_id)} style={{ color: "var(--text-dim)", padding: 4 }}>
                  <I.trash width={14} height={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite Trainer">
        <form onSubmit={handleInvite} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="First Name"><Input value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} required /></Field>
            <Field label="Last Name"><Input value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} required /></Field>
          </div>
          <Field label="Email"><Input icon={<I.mail />} type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required /></Field>
          <Field label="Phone"><Input icon={<I.phone />} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} /></Field>
          <Field label="Temporary Password"><Input icon={<I.lock />} type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required /></Field>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            <Btn variant="outline" type="button" onClick={() => setInviteOpen(false)}>Cancel</Btn>
            <Btn variant="primary" type="submit">Send Invite</Btn>
          </div>
        </form>
      </Modal>
    </>
  );
}
