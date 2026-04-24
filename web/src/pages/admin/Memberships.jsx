import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getMembershipTypesForAdmin, createMembershipType, updateMembershipType, issueMembership } from "../../api/memberships.js";
import { useToast } from "../../context/ToastContext.jsx";
import TopBar from "../../components/layout/TopBar.jsx";
import Btn from "../../components/ui/Btn.jsx";
import Pill from "../../components/ui/Pill.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Field from "../../components/ui/Field.jsx";
import Input from "../../components/ui/Input.jsx";
import * as I from "../../components/ui/Icons.jsx";

export default function AdminMemberships() {
  const { user } = useAuth();
  const toast = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [form, setForm] = useState({ name: "", price: "", duration_days: 30, description: "" });
  const [issueForm, setIssueForm] = useState({ user_id: "", membership_type_id: "" });

  const gymId = user?.gym_id;

  const load = () => {
    if (!gymId) { setLoading(false); return; }
    getMembershipTypesForAdmin(gymId)
      .then((r) => setPlans(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [gymId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createMembershipType({ ...form, gym_id: gymId, price: parseFloat(form.price), duration_days: parseInt(form.duration_days) });
      toast("Plan created");
      setCreateOpen(false);
      setForm({ name: "", price: "", duration_days: 30, description: "" });
      load();
    } catch (err) { toast(err.response?.data?.message || "Failed to create", "coral"); }
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    try {
      await issueMembership({ user_id: parseInt(issueForm.user_id), membership_type_id: parseInt(issueForm.membership_type_id) });
      toast("Membership issued");
      setIssueOpen(false);
      setIssueForm({ user_id: "", membership_type_id: "" });
    } catch (err) { toast(err.response?.data?.message || "Failed to issue", "coral"); }
  };

  const COLORS = ["var(--accent)", "var(--teal)", "var(--coral)", "#c79bff", "#ffd36e"];

  return (
    <>
      <TopBar title="Memberships" eyebrow={`${plans.length} plans · Manage tiers`}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="outline" icon={<I.download />}>Export</Btn>
            <Btn variant="outline" icon={<I.card />} onClick={() => setIssueOpen(true)}>Issue</Btn>
            <Btn variant="primary" icon={<I.plus />} onClick={() => setCreateOpen(true)}>New plan</Btn>
          </div>
        }
      />

      <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 24 }}>
        {loading && <div style={{ textAlign: "center", color: "var(--text-dim)", fontFamily: "var(--mono)", fontSize: 12, padding: "40px 0" }}>Loading...</div>}

        {!loading && !gymId && (
          <div style={{ padding: "64px 0", textAlign: "center", color: "var(--text-dim)" }}>No gym assigned.</div>
        )}

        {plans.length > 0 && (
          <div>
            <div className="eyebrow" style={{ marginBottom: 14 }}>Active Plans</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
              {plans.map((m, i) => {
                const color = COLORS[i % COLORS.length];
                const isElite = i === 0;
                return (
                  <div key={m.membership_type_id} className="card" style={{
                    padding: 20, position: "relative",
                    borderColor: isElite ? "rgba(224,251,76,.4)" : "var(--border)",
                    background: isElite ? "linear-gradient(180deg, rgba(224,251,76,.06), var(--surface))" : "var(--surface)",
                  }}>
                    {isElite && <Pill tone="accent" style={{ position: "absolute", top: 16, right: 16 }}>Top plan</Pill>}
                    <div className="display upper" style={{ fontSize: 14, letterSpacing: 0.04, marginBottom: 8, color: isElite ? "var(--accent)" : "var(--text)" }}>{m.name}</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 12 }}>
                      <div className="display" style={{ fontSize: 30, color: isElite ? "var(--accent)" : "var(--text)" }}>RON {m.price}</div>
                      <div className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>/ {m.duration_days}d</div>
                    </div>
                    {m.description && (
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.4 }}>{m.description}</div>
                    )}
                    <div style={{ display: "flex", gap: 6 }}>
                      <Btn variant="ghost" size="sm" icon={<I.edit />} style={{ flex: 1 }}>Edit</Btn>
                    </div>
                  </div>
                );
              })}

              <button onClick={() => setCreateOpen(true)} style={{
                padding: 20, border: "2px dashed var(--border-strong)", borderRadius: "var(--radius)",
                background: "transparent", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
                color: "var(--text-muted)", minHeight: 160, cursor: "pointer",
              }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)", e.currentTarget.style.color = "var(--accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-strong)", e.currentTarget.style.color = "var(--text-muted)")}
              >
                <I.plus width={24} height={24} />
                <div className="eyebrow">New Plan</div>
              </button>
            </div>
          </div>
        )}

        {!loading && gymId && plans.length === 0 && (
          <div style={{ padding: "64px 0", textAlign: "center" }}>
            <I.card width={32} height={32} style={{ opacity: 0.2, marginBottom: 12 }} />
            <div className="display upper" style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 12 }}>No plans yet</div>
            <Btn variant="primary" icon={<I.plus />} onClick={() => setCreateOpen(true)}>Create first plan</Btn>
          </div>
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Membership Plan">
        <form onSubmit={handleCreate} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Plan Name"><Input placeholder="e.g. Monthly Elite" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Price (RON)"><Input type="number" placeholder="199" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required min={0} /></Field>
            <Field label="Duration (days)"><Input type="number" value={form.duration_days} onChange={(e) => setForm((f) => ({ ...f, duration_days: e.target.value }))} min={1} /></Field>
          </div>
          <Field label="Description" hint="Optional — shown to members">
            <Input placeholder="Unlimited access to all classes..." value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            <Btn variant="outline" type="button" onClick={() => setCreateOpen(false)}>Cancel</Btn>
            <Btn variant="primary" type="submit">Create Plan</Btn>
          </div>
        </form>
      </Modal>

      <Modal open={issueOpen} onClose={() => setIssueOpen(false)} title="Issue Membership">
        <form onSubmit={handleIssue} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Member User ID" hint="The user_id of the member">
            <Input type="number" placeholder="123" value={issueForm.user_id} onChange={(e) => setIssueForm((f) => ({ ...f, user_id: e.target.value }))} required />
          </Field>
          <Field label="Plan">
            <select value={issueForm.membership_type_id} onChange={(e) => setIssueForm((f) => ({ ...f, membership_type_id: e.target.value }))}
              style={{ height: 44, padding: "0 12px", background: "var(--surface-2)", border: "1px solid var(--border-strong)", borderRadius: 10, color: "var(--text)", fontSize: 14, width: "100%" }} required>
              <option value="">— Select plan —</option>
              {plans.map((p) => <option key={p.membership_type_id} value={p.membership_type_id}>{p.name} — RON {p.price}</option>)}
            </select>
          </Field>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            <Btn variant="outline" type="button" onClick={() => setIssueOpen(false)}>Cancel</Btn>
            <Btn variant="primary" type="submit">Issue</Btn>
          </div>
        </form>
      </Modal>
    </>
  );
}
