import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  getMembershipTypesForAdmin,
  createMembershipType,
  updateMembershipType,
  issueMembership,
  getAdminFreezeStatus,
  adminFreezeGymMemberships,
  adminUnfreezeGymMemberships,
} from "../../api/memberships.js";
import { searchClients } from "../../api/reception.js";
import { useToast } from "../../context/ToastContext.jsx";
import TopBar from "../../components/layout/TopBar.jsx";
import Btn from "../../components/ui/Btn.jsx";
import Pill from "../../components/ui/Pill.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Field from "../../components/ui/Field.jsx";
import Input from "../../components/ui/Input.jsx";
import * as I from "../../components/ui/Icons.jsx";
import ExportMenu from "../../components/ui/ExportMenu.jsx";

const EMPTY_FORM = {
  name: "",
  price: "",
  duration_days: 30,
  description: "",
  includes_group_classes: false,
  freeze_days: 3,
};

const COLORS = [
  "var(--accent)",
  "var(--teal)",
  "var(--coral)",
  "#c79bff",
  "#ffd36e",
];

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
      }}
    >
      <div
        style={{
          width: 40,
          height: 22,
          borderRadius: 11,
          background: checked ? "var(--accent)" : "var(--surface-3)",
          position: "relative",
          transition: "background .2s",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 3,
            left: checked ? 21 : 3,
            width: 16,
            height: 16,
            borderRadius: 8,
            background: checked ? "var(--bg)" : "var(--text-dim)",
            transition: "left .2s",
          }}
        />
      </div>
      <span
        style={{
          fontSize: 13,
          color: checked ? "var(--accent)" : "var(--text-dim)",
        }}
      >
        {checked ? "Yes — included" : "No — not included"}
      </span>
    </button>
  );
}

function PlanFormFields({ form, setForm }) {
  return (
    <>
      <Field label="Plan Name">
        <Input
          placeholder="e.g. Monthly Elite"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
        />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="Price (RON)">
          <Input
            type="number"
            placeholder="199"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            required
            min={0}
          />
        </Field>
        <Field label="Duration (days)">
          <Input
            type="number"
            value={form.duration_days}
            onChange={(e) =>
              setForm((f) => ({ ...f, duration_days: e.target.value }))
            }
            min={1}
            required
          />
        </Field>
      </div>
      <Field
        label="Freeze Days"
        hint="Days a member can pause their membership"
      >
        <Input
          type="number"
          value={form.freeze_days}
          onChange={(e) =>
            setForm((f) => ({ ...f, freeze_days: e.target.value }))
          }
          min={0}
        />
      </Field>
      <Field label="Group Classes">
        <Toggle
          checked={form.includes_group_classes}
          onChange={(v) =>
            setForm((f) => ({ ...f, includes_group_classes: v }))
          }
        />
      </Field>
      <Field label="Description" hint="Optional — shown to members">
        <Input
          placeholder="Unlimited access to all classes..."
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
        />
      </Field>
    </>
  );
}

export default function AdminMemberships() {
  const { user } = useAuth();
  const toast = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [frozenCount, setFrozenCount] = useState(0);
  const [freezeOpen, setFreezeOpen] = useState(false);
  const [unfreezeOpen, setUnfreezeOpen] = useState(false);
  const [freezeWorking, setFreezeWorking] = useState(false);

  const [issueOpen, setIssueOpen] = useState(false);
  const [issueClient, setIssueClient] = useState(null);
  const [issueQuery, setIssueQuery] = useState("");
  const [issueResults, setIssueResults] = useState([]);
  const [issueSearching, setIssueSearching] = useState(false);
  const [issuePlanId, setIssuePlanId] = useState("");
  const [issuePayment, setIssuePayment] = useState("cash");
  const debounceRef = useRef(null);

  const gymId = user?.gym_id;

  const load = () => {
    if (!gymId) {
      setLoading(false);
      return;
    }
    Promise.all([
      getMembershipTypesForAdmin(gymId),
      getAdminFreezeStatus(gymId),
    ])
      .then(([plansRes, freezeRes]) => {
        setPlans(plansRes.data);
        setFrozenCount(freezeRes.data.frozen_count);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [gymId]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (issueQuery.trim().length < 2) {
      setIssueResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIssueSearching(true);
      try {
        const r = await searchClients(issueQuery, gymId);
        setIssueResults(r.data);
      } catch {
        setIssueResults([]);
      } finally {
        setIssueSearching(false);
      }
    }, 300);
  }, [issueQuery, gymId]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(plan) {
    setEditingId(plan.membership_type_id);
    setForm({
      name: plan.name,
      price: String(plan.price),
      duration_days: plan.duration_days,
      description: plan.description || "",
      includes_group_classes: !!plan.includes_group_classes,
      freeze_days: plan.freeze_days ?? 3,
    });
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
  }

  function resetIssue() {
    setIssueClient(null);
    setIssueQuery("");
    setIssueResults([]);
    setIssuePlanId("");
    setIssuePayment("cash");
  }

  const handleAdminFreeze = async () => {
    setFreezeWorking(true);
    try {
      const r = await adminFreezeGymMemberships(gymId);
      toast(r.data.message);
      setFreezeOpen(false);
      load();
    } catch (err) {
      toast(err.response?.data?.message || "Failed to freeze", "coral");
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
      toast(err.response?.data?.message || "Failed to unfreeze", "coral");
    } finally {
      setFreezeWorking(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      duration_days: parseInt(form.duration_days),
      freeze_days: parseInt(form.freeze_days),
      includes_group_classes: form.includes_group_classes,
    };
    try {
      if (editingId) {
        await updateMembershipType(editingId, payload);
        toast("Plan updated");
      } else {
        await createMembershipType({ ...payload, gym_id: gymId });
        toast("Plan created");
      }
      closeForm();
      load();
    } catch (err) {
      toast(err.response?.data?.message || "Failed to save", "coral");
    }
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    if (!issueClient || !issuePlanId) return;
    try {
      await issueMembership({
        client_id: issueClient.user_id,
        membership_type_id: parseInt(issuePlanId),
        payment_method: issuePayment,
      });
      toast("Membership issued");
      setIssueOpen(false);
      resetIssue();
    } catch (err) {
      toast(err.response?.data?.message || "Failed to issue", "coral");
    }
  };

  return (
    <>
      <TopBar
        title="Memberships"
        eyebrow={`${plans.length} plans · Manage tiers`}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <ExportMenu gymId={gymId} />
            <Btn
              variant="outline"
              icon={<I.card />}
              onClick={() => setIssueOpen(true)}
            >
              Issue
            </Btn>
            <Btn variant="primary" icon={<I.plus />} onClick={openCreate}>
              New plan
            </Btn>
          </div>
        }
      />

      <div
        style={{
          padding: 32,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {loading && (
          <div
            style={{
              textAlign: "center",
              color: "var(--text-dim)",
              fontFamily: "var(--mono)",
              fontSize: 12,
              padding: "40px 0",
            }}
          >
            Loading...
          </div>
        )}

        {!loading && !gymId && (
          <div
            style={{
              padding: "64px 0",
              textAlign: "center",
              color: "var(--text-dim)",
            }}
          >
            No gym assigned.
          </div>
        )}

        {gymId && !loading && (
          <div
            className="card"
            style={{
              padding: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              borderColor:
                frozenCount > 0
                  ? "rgba(147,197,253,.4)"
                  : "var(--border)",
              background:
                frozenCount > 0
                  ? "linear-gradient(180deg, rgba(147,197,253,.06), var(--surface))"
                  : "var(--surface)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background:
                    frozenCount > 0
                      ? "rgba(147,197,253,.15)"
                      : "var(--surface-2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {frozenCount > 0 ? (
                  <I.snowflake
                    width={18}
                    height={18}
                    style={{ color: "#93c5fd" }}
                  />
                ) : (
                  <I.building
                    width={18}
                    height={18}
                    style={{ color: "var(--text-dim)" }}
                  />
                )}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color:
                      frozenCount > 0 ? "#93c5fd" : "var(--text)",
                    marginBottom: 2,
                  }}
                >
                  {frozenCount > 0
                    ? `Gym closed — ${frozenCount} membership${frozenCount !== 1 ? "s" : ""} frozen`
                    : "Gym is open"}
                </div>
                <div
                  style={{ fontSize: 12, color: "var(--text-dim)" }}
                >
                  {frozenCount > 0
                    ? "Members are not losing days. Unfreeze when you reopen."
                    : "Freeze all active memberships when the gym closes."}
                </div>
              </div>
            </div>
            <div>
              {frozenCount > 0 ? (
                <Btn
                  variant="outline"
                  icon={<I.unlock />}
                  onClick={() => setUnfreezeOpen(true)}
                >
                  Reopen gym
                </Btn>
              ) : (
                <Btn
                  variant="outline"
                  icon={<I.snowflake />}
                  onClick={() => setFreezeOpen(true)}
                >
                  Close gym
                </Btn>
              )}
            </div>
          </div>
        )}

        {plans.length > 0 && (
          <div>
            <div className="eyebrow" style={{ marginBottom: 14 }}>
              Active Plans
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 14,
              }}
            >
              {plans.map((m, i) => {
                const isElite = i === 0;
                return (
                  <div
                    key={m.membership_type_id}
                    className="card"
                    style={{
                      padding: 20,
                      position: "relative",
                      borderColor: isElite
                        ? "rgba(224,251,76,.4)"
                        : "var(--border)",
                      background: isElite
                        ? "linear-gradient(180deg, rgba(224,251,76,.06), var(--surface))"
                        : "var(--surface)",
                    }}
                  >
                    {isElite && (
                      <Pill
                        tone="accent"
                        style={{ position: "absolute", top: 16, right: 16 }}
                      >
                        Top plan
                      </Pill>
                    )}
                    <div
                      className="display upper"
                      style={{
                        fontSize: 14,
                        letterSpacing: 0.04,
                        marginBottom: 8,
                        color: isElite ? "var(--accent)" : "var(--text)",
                      }}
                    >
                      {m.name}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 4,
                        marginBottom: 10,
                      }}
                    >
                      <div
                        className="display"
                        style={{
                          fontSize: 30,
                          color: isElite ? "var(--accent)" : "var(--text)",
                        }}
                      >
                        RON {m.price}
                      </div>
                      <div
                        className="mono"
                        style={{ fontSize: 11, color: "var(--text-dim)" }}
                      >
                        / {m.duration_days}d
                      </div>
                    </div>

                    {/* feature badges */}
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                        marginBottom: 10,
                      }}
                    >
                      {m.includes_group_classes ? (
                        <Pill tone="teal">Group classes</Pill>
                      ) : (
                        <Pill tone="muted">No group classes</Pill>
                      )}
                      <Pill tone="muted">{m.freeze_days ?? 0} freeze days</Pill>
                    </div>

                    {m.description && (
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text-muted)",
                          marginBottom: 12,
                          lineHeight: 1.4,
                        }}
                      >
                        {m.description}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 6 }}>
                      <Btn
                        variant="ghost"
                        size="sm"
                        icon={<I.edit />}
                        style={{ flex: 1 }}
                        onClick={() => openEdit(m)}
                      >
                        Edit
                      </Btn>
                    </div>
                  </div>
                );
              })}

              <button
                onClick={openCreate}
                style={{
                  padding: 20,
                  border: "2px dashed var(--border-strong)",
                  borderRadius: "var(--radius)",
                  background: "transparent",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  color: "var(--text-muted)",
                  minHeight: 160,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => (
                  (e.currentTarget.style.borderColor = "var(--accent)"),
                  (e.currentTarget.style.color = "var(--accent)")
                )}
                onMouseLeave={(e) => (
                  (e.currentTarget.style.borderColor = "var(--border-strong)"),
                  (e.currentTarget.style.color = "var(--text-muted)")
                )}
              >
                <I.plus width={24} height={24} />
                <div className="eyebrow">New Plan</div>
              </button>
            </div>
          </div>
        )}

        {!loading && gymId && plans.length === 0 && (
          <div style={{ padding: "64px 0", textAlign: "center" }}>
            <I.card
              width={32}
              height={32}
              style={{ opacity: 0.2, marginBottom: 12 }}
            />
            <div
              className="display upper"
              style={{
                fontSize: 14,
                color: "var(--text-muted)",
                marginBottom: 12,
              }}
            >
              No plans yet
            </div>
            <Btn variant="primary" icon={<I.plus />} onClick={openCreate}>
              Create first plan
            </Btn>
          </div>
        )}
      </div>

      {/* Create / Edit plan modal */}
      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editingId ? "Edit Plan" : "New Membership Plan"}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <PlanFormFields form={form} setForm={setForm} />
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "flex-end",
              marginTop: 4,
            }}
          >
            <Btn variant="outline" type="button" onClick={closeForm}>
              Cancel
            </Btn>
            <Btn variant="primary" type="submit">
              {editingId ? "Save changes" : "Create Plan"}
            </Btn>
          </div>
        </form>
      </Modal>

      {/* Freeze memberships modal */}
      <Modal
        open={freezeOpen}
        onClose={() => setFreezeOpen(false)}
        title="Close Gym & Freeze Memberships"
      >
        <div
          style={{
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ fontSize: 14, color: "var(--text-dim)", lineHeight: 1.6 }}>
            All active memberships will be frozen. Members will not lose any
            days while the gym is closed. Their expiry dates will be extended
            automatically when you reopen.
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "flex-end",
            }}
          >
            <Btn
              variant="outline"
              type="button"
              onClick={() => setFreezeOpen(false)}
              disabled={freezeWorking}
            >
              Cancel
            </Btn>
            <Btn
              variant="primary"
              onClick={handleAdminFreeze}
              disabled={freezeWorking}
              icon={<I.snowflake />}
            >
              {freezeWorking ? "Freezing…" : "Freeze all memberships"}
            </Btn>
          </div>
        </div>
      </Modal>

      {/* Unfreeze memberships modal */}
      <Modal
        open={unfreezeOpen}
        onClose={() => setUnfreezeOpen(false)}
        title="Reopen Gym & Unfreeze Memberships"
      >
        <div
          style={{
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ fontSize: 14, color: "var(--text-dim)", lineHeight: 1.6 }}>
            {frozenCount} frozen membership{frozenCount !== 1 ? "s" : ""} will
            be reactivated. Each member's expiry date will be extended by the
            exact number of days the gym was closed. Only admin-frozen
            memberships are affected — any memberships paused by members
            themselves remain unchanged.
          </div>
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "flex-end",
            }}
          >
            <Btn
              variant="outline"
              type="button"
              onClick={() => setUnfreezeOpen(false)}
              disabled={freezeWorking}
            >
              Cancel
            </Btn>
            <Btn
              variant="primary"
              onClick={handleAdminUnfreeze}
              disabled={freezeWorking}
              icon={<I.unlock />}
            >
              {freezeWorking ? "Unfreezing…" : "Reopen & unfreeze"}
            </Btn>
          </div>
        </div>
      </Modal>

      {/* Issue membership modal */}
      <Modal
        open={issueOpen}
        onClose={() => {
          setIssueOpen(false);
          resetIssue();
        }}
        title="Issue Membership"
      >
        <form
          onSubmit={handleIssue}
          style={{
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <Field label="Member">
            {issueClient ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  background: "rgba(224,251,76,.06)",
                  border: "1px solid rgba(224,251,76,.2)",
                  borderRadius: 10,
                }}
              >
                <Avatar
                  name={`${issueClient.first_name} ${issueClient.last_name}`}
                  size={28}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {issueClient.first_name} {issueClient.last_name}
                  </div>
                  <div
                    className="mono"
                    style={{ fontSize: 10, color: "var(--text-dim)" }}
                  >
                    {issueClient.email}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIssueClient(null);
                    setIssueQuery("");
                  }}
                  style={{ color: "var(--text-dim)", display: "flex" }}
                >
                  <I.close width={14} height={14} />
                </button>
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "var(--surface-2)",
                    border: "1px solid var(--border-strong)",
                    borderRadius: 10,
                    padding: "0 12px",
                    height: 40,
                  }}
                >
                  <I.search
                    width={14}
                    height={14}
                    style={{ color: "var(--text-dim)", flexShrink: 0 }}
                  />
                  <input
                    value={issueQuery}
                    onChange={(e) => setIssueQuery(e.target.value)}
                    placeholder="Search by email…"
                    style={{
                      flex: 1,
                      background: "none",
                      border: "none",
                      outline: "none",
                      fontSize: 13,
                      color: "var(--text)",
                    }}
                    autoFocus
                  />
                  {issueSearching && (
                    <I.clock
                      width={13}
                      height={13}
                      style={{ color: "var(--text-dim)", flexShrink: 0 }}
                    />
                  )}
                </div>
                {issueResults.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 4px)",
                      left: 0,
                      right: 0,
                      background: "var(--surface)",
                      border: "1px solid var(--border-strong)",
                      borderRadius: 10,
                      overflow: "hidden",
                      zIndex: 10,
                    }}
                  >
                    {issueResults.map((c) => (
                      <button
                        key={c.user_id}
                        type="button"
                        onClick={() => {
                          setIssueClient(c);
                          setIssueQuery("");
                          setIssueResults([]);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          width: "100%",
                          padding: "10px 12px",
                          background: "none",
                          border: "none",
                          borderBottom: "1px solid var(--border)",
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "var(--surface-2)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "none")
                        }
                      >
                        <Avatar
                          name={`${c.first_name} ${c.last_name}`}
                          size={26}
                        />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>
                            {c.first_name} {c.last_name}
                          </div>
                          <div
                            className="mono"
                            style={{ fontSize: 10, color: "var(--text-dim)" }}
                          >
                            {c.email}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {issueQuery.trim().length >= 2 &&
                  !issueSearching &&
                  issueResults.length === 0 && (
                    <div
                      className="mono"
                      style={{
                        marginTop: 6,
                        fontSize: 11,
                        color: "var(--text-dim)",
                        textAlign: "center",
                      }}
                    >
                      No members found
                    </div>
                  )}
              </div>
            )}
          </Field>

          <Field label="Plan">
            <select
              value={issuePlanId}
              onChange={(e) => setIssuePlanId(e.target.value)}
              style={{
                height: 44,
                padding: "0 12px",
                background: "var(--surface-2)",
                border: "1px solid var(--border-strong)",
                borderRadius: 10,
                color: "var(--text)",
                fontSize: 14,
                width: "100%",
              }}
              required
            >
              <option value="">— Select plan —</option>
              {plans.map((p) => (
                <option key={p.membership_type_id} value={p.membership_type_id}>
                  {p.name} — RON {p.price}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Payment Method">
            <div style={{ display: "flex", gap: 8 }}>
              {["cash", "card"].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setIssuePayment(method)}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 10,
                    border: `1px solid ${issuePayment === method ? "var(--accent)" : "var(--border-strong)"}`,
                    background:
                      issuePayment === method
                        ? "rgba(224,251,76,.1)"
                        : "var(--surface-2)",
                    color:
                      issuePayment === method
                        ? "var(--accent)"
                        : "var(--text-dim)",
                    fontSize: 13,
                    fontWeight: issuePayment === method ? 700 : 400,
                    cursor: "pointer",
                    textTransform: "capitalize",
                    letterSpacing: 0.5,
                  }}
                >
                  {method === "cash" ? "Cash" : "Card"}
                </button>
              ))}
            </div>
          </Field>

          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "flex-end",
              marginTop: 4,
            }}
          >
            <Btn
              variant="outline"
              type="button"
              onClick={() => {
                setIssueOpen(false);
                resetIssue();
              }}
            >
              Cancel
            </Btn>
            <Btn
              variant="primary"
              type="submit"
              disabled={!issueClient || !issuePlanId}
            >
              Issue
            </Btn>
          </div>
        </form>
      </Modal>
    </>
  );
}
