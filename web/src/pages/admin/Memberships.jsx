import React, { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  getMembershipTypesForAdmin,
  createMembershipType,
  updateMembershipType,
  issueMembership,
  getGymMemberships,
  cancelMembership,
} from "../../api/memberships.js";
import { searchClients } from "../../api/reception.js";
import { getClientNoShows, clearClientNoShows } from "../../api/gymAdmin.js";
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

const MEMBER_COLUMNS = [
  { key: "client", label: "Client" },
  { key: "plan", label: "Plan" },
  { key: "status", label: "Status" },
  { key: "end_date", label: "Valabil până la" },
  { key: "payment", label: "Plată" },
  { key: "actions", label: "" },
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
        {checked ? "Da - inclusă" : "Nu - neinclusă"}
      </span>
    </button>
  );
}

function PlanFormFields({ form, setForm }) {
  return (
    <>
      <Field label="Nume plan">
        <Input
          placeholder="ex: Lunar Elite"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
        />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="Preț (RON)">
          <Input
            type="number"
            placeholder="199"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            required
            min={0}
          />
        </Field>
        <Field label="Durată (zile)">
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
        label="Zile de pauză"
        hint="Zile în care membrul poate suspenda abonamentul"
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
      <Field label="Clase de grup">
        <Toggle
          checked={form.includes_group_classes}
          onChange={(v) =>
            setForm((f) => ({ ...f, includes_group_classes: v }))
          }
        />
      </Field>
      <Field label="Descriere" hint="Opțional - vizibil pentru membri">
        <Input
          placeholder="Acces nelimitat la toate clasele..."
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
        />
      </Field>
    </>
  );
}

const STATUS_LABEL = {
  active: "Activ",
  paused: "Pauză",
  expired: "Expirat",
  cancelled: "Anulat",
};
const STATUS_TONE = {
  active: "green",
  paused: "accent",
  expired: "muted",
  cancelled: "coral",
};
const PAYMENT_LABEL = { cash: "Cash", card: "Card" };

function formatDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminMemberships() {
  const { user } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState("plans"); // 'plans' | 'members'

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // members tab
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // no-show modal
  const [cancelTarget, setCancelTarget] = useState(null); // { membershipId, name }
  const [cancelledDetail, setCancelledDetail] = useState(null); // { name, reason, plan, date }
  const [cancelReason, setCancelReason] = useState("");
  const [noShowClient, setNoShowClient] = useState(null); // { clientId, name }
  const [noShowData, setNoShowData] = useState(null); // { count, blocked, no_shows }
  const [noShowLoading, setNoShowLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [membersStatus, setMembersStatus] = useState("active,paused");
  const [membersSearch, setMembersSearch] = useState("");
  const [sortKey, setSortKey] = useState("end_date");
  const [sortDir, setSortDir] = useState("asc");

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

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
    getMembershipTypesForAdmin(gymId)
      .then((plansRes) => {
        setPlans(plansRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const loadMembers = (status) => {
    if (!gymId) return;
    setMembersLoading(true);
    getGymMemberships(gymId, status)
      .then((r) => setMembers(r.data))
      .catch(() => setMembers([]))
      .finally(() => setMembersLoading(false));
  };

  useEffect(() => {
    load();
  }, [gymId]);

  useEffect(() => {
    if (tab === "members" && gymId) {
      loadMembers(membersStatus);
    }
  }, [tab, gymId, membersStatus]);

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
        toast("Plan actualizat");
      } else {
        await createMembershipType({ ...payload, gym_id: gymId });
        toast("Plan creat");
      }
      closeForm();
      load();
    } catch (err) {
      toast(err.response?.data?.message || "Eroare la salvare", "coral");
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
      toast("Abonament emis");
      setIssueOpen(false);
      resetIssue();
    } catch (err) {
      toast(err.response?.data?.message || "Eroare la emitere", "coral");
    }
  };

  // filtered members for search
  const filteredMembers =
    membersSearch.trim().length < 1
      ? members
      : members.filter((m) => {
          const q = membersSearch.toLowerCase();
          const name =
            `${m.User?.first_name ?? ""} ${m.User?.last_name ?? ""}`.toLowerCase();
          const email = (m.User?.email ?? "").toLowerCase();
          const plan = (m.Membership_Type?.name ?? "").toLowerCase();
          return name.includes(q) || email.includes(q) || plan.includes(q);
        });

  const statusSortable = membersStatus === ""; // only in "Toți"

  function handleSort(key) {
    if (key === "status" && !statusSortable) return;
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  // reset status sort when leaving "Toți"
  useEffect(() => {
    if (sortKey === "status" && membersStatus !== "") {
      setSortKey("end_date");
      setSortDir("asc");
    }
  }, [membersStatus]);

  const effectiveSortKey =
    sortKey === "status" && !statusSortable ? "end_date" : sortKey;

  const sortedMembers = useMemo(() => {
    const arr = [...filteredMembers];
    arr.sort((a, b) => {
      let aVal, bVal;
      switch (effectiveSortKey) {
        case "client":
          aVal =
            `${a.User?.first_name ?? ""} ${a.User?.last_name ?? ""}`.toLowerCase();
          bVal =
            `${b.User?.first_name ?? ""} ${b.User?.last_name ?? ""}`.toLowerCase();
          break;
        case "plan":
          aVal = (a.Membership_Type?.name ?? "").toLowerCase();
          bVal = (b.Membership_Type?.name ?? "").toLowerCase();
          break;
        case "status":
          aVal = a.status ?? "";
          bVal = b.status ?? "";
          break;
        case "end_date":
          aVal = a.end_date ? new Date(a.end_date).getTime() : 0;
          bVal = b.end_date ? new Date(b.end_date).getTime() : 0;
          break;
        case "payment":
          aVal = a.payment_method ?? "";
          bVal = b.payment_method ?? "";
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filteredMembers, effectiveSortKey, sortDir]);

  const memberStatusTabs = [
    { key: "active,paused", label: "Activi" },
    { key: "expired", label: "Expirați" },
    { key: "cancelled", label: "Anulați" },
    { key: "", label: "Toți" },
  ];

  const handleCancelMembership = async () => {
    if (!cancelTarget || !cancelReason.trim()) return;
    try {
      await cancelMembership(cancelTarget.membershipId, cancelReason.trim());
      toast("Abonamentul a fost anulat");
      setCancelTarget(null);
      setCancelReason("");
      loadMembers();
    } catch (err) {
      toast(err.response?.data?.message || "Eroare la anulare", "coral");
    }
  };

  const openNoShowModal = async (clientId, name) => {
    setNoShowClient({ clientId, name });
    setNoShowData(null);
    setNoShowLoading(true);
    try {
      const r = await getClientNoShows(clientId);
      setNoShowData(r.data);
    } catch {
      setNoShowData({ count: 0, blocked: false, no_shows: [] });
    } finally {
      setNoShowLoading(false);
    }
  };

  const handleClearNoShows = async () => {
    if (!noShowClient) return;
    setClearing(true);
    try {
      await clearClientNoShows(noShowClient.clientId);
      setNoShowData((prev) => ({
        ...prev,
        count: 0,
        blocked: false,
        no_shows: [],
      }));
      toast(`Absențele lui ${noShowClient.name} de la sala ta au fost șterse.`);
    } catch (err) {
      toast(
        err.response?.data?.message || "Eroare la ștergerea istoricului.",
        "coral",
      );
    } finally {
      setClearing(false);
    }
  };

  return (
    <>
      <TopBar
        title="Abonamente"
        eyebrow={
          tab === "plans"
            ? `${plans.length} planuri disponibile`
            : `${members.length} clienți`
        }
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            {/* Tab switcher */}
            <div
              style={{
                display: "flex",
                background: "var(--surface-2)",
                border: "1px solid var(--border-strong)",
                borderRadius: 10,
                padding: 3,
                gap: 2,
              }}
            >
              {[
                { key: "plans", label: "Planuri" },
                { key: "members", label: "Clienți" },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "var(--display)",
                    textTransform: "uppercase",
                    letterSpacing: 0.04,
                    background: tab === t.key ? "var(--accent)" : "transparent",
                    color:
                      tab === t.key ? "var(--accent-ink)" : "var(--text-muted)",
                    border: "none",
                    cursor: "pointer",
                    transition: "background .15s, color .15s",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <ExportMenu gymId={gymId} />
            <Btn
              variant="outline"
              icon={<I.card />}
              onClick={() => setIssueOpen(true)}
            >
              Abonament nou
            </Btn>
            {tab === "plans" && (
              <Btn variant="primary" icon={<I.plus />} onClick={openCreate}>
                Plan nou
              </Btn>
            )}
          </div>
        }
      />

      {/* ── MEMBERS TAB ── */}
      {tab === "members" && (
        <div
          style={{
            padding: 32,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* Status filter + search */}
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", gap: 6 }}>
              {memberStatusTabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setMembersStatus(t.key)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: "var(--display)",
                    textTransform: "uppercase",
                    letterSpacing: 0.06,
                    background:
                      membersStatus === t.key ? "var(--accent)" : "transparent",
                    color:
                      membersStatus === t.key
                        ? "var(--accent-ink)"
                        : "var(--text-muted)",
                    border: `1px solid ${membersStatus === t.key ? "var(--accent)" : "var(--border-strong)"}`,
                    cursor: "pointer",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {/* Search box */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "var(--surface-2)",
                border: "1px solid var(--border-strong)",
                borderRadius: 10,
                padding: "0 12px",
                height: 36,
                flex: "0 0 220px",
              }}
            >
              <I.search
                width={13}
                height={13}
                style={{ color: "var(--text-dim)", flexShrink: 0 }}
              />
              <input
                value={membersSearch}
                onChange={(e) => setMembersSearch(e.target.value)}
                placeholder="Caută client sau plan…"
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  outline: "none",
                  fontSize: 12,
                  color: "var(--text)",
                }}
              />
              {membersSearch && (
                <button
                  onClick={() => setMembersSearch("")}
                  style={{
                    color: "var(--text-dim)",
                    display: "flex",
                    padding: 0,
                  }}
                >
                  <I.close width={12} height={12} />
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          {membersLoading ? (
            <div
              style={{
                textAlign: "center",
                color: "var(--text-dim)",
                fontFamily: "var(--mono)",
                fontSize: 12,
                padding: "40px 0",
              }}
            >
              Se încarcă...
            </div>
          ) : filteredMembers.length === 0 ? (
            <div style={{ padding: "64px 0", textAlign: "center" }}>
              <I.users
                width={32}
                height={32}
                style={{ opacity: 0.2, marginBottom: 12 }}
              />
              <div
                className="display upper"
                style={{ fontSize: 14, color: "var(--text-muted)" }}
              >
                Niciun abonament găsit
              </div>
            </div>
          ) : (
            <div className="card" style={{ overflow: "hidden", padding: 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-soft)" }}>
                    {MEMBER_COLUMNS.map((col) => {
                      const disabled = col.key === "status" && !statusSortable;
                      const active = !disabled && effectiveSortKey === col.key;
                      return (
                        <th
                          key={col.key}
                          onClick={() => handleSort(col.key)}
                          style={{
                            padding: "12px 16px",
                            textAlign: "left",
                            fontSize: 9,
                            fontFamily: "var(--display)",
                            textTransform: "uppercase",
                            letterSpacing: 0.08,
                            color: active ? "var(--accent)" : "var(--text-dim)",
                            fontWeight: 700,
                            background: "var(--surface)",
                            cursor: disabled ? "default" : "pointer",
                            userSelect: "none",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            {col.label}
                            {!disabled && (
                              <I.arrowUp
                                width={10}
                                height={10}
                                style={{
                                  opacity: active ? 1 : 0.25,
                                  transform:
                                    active && sortDir === "desc"
                                      ? "rotate(180deg)"
                                      : "rotate(0deg)",
                                  transition: "transform .15s, opacity .15s",
                                  flexShrink: 0,
                                }}
                              />
                            )}
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {sortedMembers.map((m, idx) => {
                    const client = m.User || {};
                    const plan = m.Membership_Type || {};
                    const name =
                      `${client.first_name ?? ""} ${client.last_name ?? ""}`.trim() ||
                      "-";
                    const isActive = m.status === "active" || m.status === "paused";
                    const isCancelled = m.status === "cancelled";
                    const isClickable = isActive || isCancelled;
                    return (
                      <tr
                        key={m.membership_id}
                        onClick={() => {
                          if (isActive) openNoShowModal(client.user_id, name);
                          else if (isCancelled) setCancelledDetail({ name, reason: m.cancelled_reason, plan: plan.name, date: m.end_date });
                        }}
                        style={{
                          borderBottom:
                            idx < sortedMembers.length - 1
                              ? "1px solid var(--border-soft)"
                              : "none",
                          cursor: isClickable ? "pointer" : "default",
                          opacity: m.status === "cancelled" || m.status === "expired" ? 0.55 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (isClickable) e.currentTarget.style.background = "var(--surface-2)";
                        }}
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        {/* Client */}
                        <td style={{ padding: "12px 16px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <Avatar name={name} size={32} />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600 }}>
                                {name}
                              </div>
                              <div
                                className="mono"
                                style={{
                                  fontSize: 10,
                                  color: "var(--text-dim)",
                                }}
                              >
                                {client.email ?? "-"}
                              </div>
                            </div>
                          </div>
                        </td>
                        {/* Plan */}
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>
                            {plan.name ?? "-"}
                          </div>
                          <div
                            className="mono"
                            style={{ fontSize: 10, color: "var(--text-dim)" }}
                          >
                            RON {plan.price ?? "-"} ·{" "}
                            {plan.duration_days ?? "-"}z
                          </div>
                        </td>
                        {/* Status */}
                        <td style={{ padding: "12px 16px" }}>
                          <Pill tone={STATUS_TONE[m.status] ?? "muted"}>
                            {STATUS_LABEL[m.status] ?? m.status}
                          </Pill>
                        </td>
                        {/* End date */}
                        <td style={{ padding: "12px 16px" }}>
                          <div
                            className="mono"
                            style={{
                              fontSize: 12,
                              color:
                                m.status === "expired" ||
                                m.status === "cancelled"
                                  ? "var(--text-dim)"
                                  : "var(--text)",
                            }}
                          >
                            {formatDate(m.end_date)}
                          </div>
                        </td>
                        {/* Payment */}
                        <td style={{ padding: "12px 16px" }}>
                          <div
                            style={{ fontSize: 12, color: "var(--text-muted)" }}
                          >
                            {PAYMENT_LABEL[m.payment_method] ??
                              m.payment_method ??
                              "-"}
                          </div>
                        </td>
                        {/* Actions */}
                        <td style={{ padding: "12px 16px" }} onClick={(e) => e.stopPropagation()}>
                          {(m.status === "active" || m.status === "paused") && (
                            <button
                              onClick={() => setCancelTarget({ membershipId: m.membership_id, name })}
                              style={{
                                background: "transparent",
                                border: "1px solid rgba(255,85,102,.3)",
                                borderRadius: 6,
                                color: "var(--red)",
                                fontSize: 11,
                                fontFamily: "var(--mono)",
                                padding: "4px 10px",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Anulează
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── PLANS TAB ── */}
      {tab === "plans" && (
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
              Se încarcă...
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
              Nicio sală atribuită.
            </div>
          )}

          {plans.length > 0 && (
            <div>
              <div className="eyebrow" style={{ marginBottom: 14 }}>
                Planuri active
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
                          <Pill tone="teal">Clase de grup</Pill>
                        ) : (
                          <Pill tone="muted">Fără clase de grup</Pill>
                        )}
                        <Pill tone="muted">
                          {m.freeze_days ?? 0} zile pauză
                        </Pill>
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
                          Editează
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
                    (e.currentTarget.style.borderColor =
                      "var(--border-strong)"),
                    (e.currentTarget.style.color = "var(--text-muted)")
                  )}
                >
                  <I.plus width={24} height={24} />
                  <div className="eyebrow">Plan nou</div>
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
                Niciun plan încă
              </div>
              <Btn variant="primary" icon={<I.plus />} onClick={openCreate}>
                Creează primul plan
              </Btn>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit plan modal */}
      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editingId ? "Editează planul" : "Plan de abonament nou"}
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
              Anulează
            </Btn>
            <Btn variant="primary" type="submit">
              {editingId ? "Salvează modificările" : "Creează planul"}
            </Btn>
          </div>
        </form>
      </Modal>

      {/* Issue membership modal */}
      <Modal
        open={issueOpen}
        onClose={() => {
          setIssueOpen(false);
          resetIssue();
        }}
        title="Emite abonament"
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
          <Field label="Membru">
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
                    placeholder="Caută după email…"
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
                      Niciun membru găsit
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
              <option value="">- Selectează planul -</option>
              {plans.map((p) => (
                <option key={p.membership_type_id} value={p.membership_type_id}>
                  {p.name} - RON {p.price}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Metodă de plată">
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
              Anulează
            </Btn>
            <Btn
              variant="primary"
              type="submit"
              disabled={!issueClient || !issuePlanId}
            >
              Emite
            </Btn>
          </div>
        </form>
      </Modal>

      {/* ── CANCELLED DETAIL MODAL ── */}
      <Modal
        open={!!cancelledDetail}
        onClose={() => setCancelledDetail(null)}
        title={cancelledDetail?.name ?? ""}
        width={400}
      >
        <div style={{ padding: "20px 24px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(255,85,102,.08)", border: "1px solid rgba(255,85,102,.2)" }}>
            <div className="eyebrow" style={{ fontSize: 10, color: "var(--red)", marginBottom: 6 }}>Abonament anulat</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{cancelledDetail?.plan}</div>
            {cancelledDetail?.date && (
              <div className="mono" style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 4 }}>
                Anulat pe {formatDate(cancelledDetail.date)}
              </div>
            )}
          </div>
          <div>
            <div className="eyebrow" style={{ fontSize: 10, marginBottom: 6 }}>Motiv anulare</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
              {cancelledDetail?.reason || "Niciun motiv specificat."}
            </div>
          </div>
          <Btn variant="outline" style={{ alignSelf: "flex-end" }} onClick={() => setCancelledDetail(null)}>
            Închide
          </Btn>
        </div>
      </Modal>

      {/* ── CANCEL MEMBERSHIP MODAL ── */}
      <Modal
        open={!!cancelTarget}
        onClose={() => { setCancelTarget(null); setCancelReason(""); }}
        title="Anulează abonament"
        width={420}
      >
        <div style={{ padding: "20px 24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
          <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.7, textAlign: "center", margin: 0 }}>
            Anulezi abonamentul lui{" "}
            <strong style={{ color: "var(--text)" }}>{cancelTarget?.name}</strong>.
            <br />Acțiunea este ireversibilă.
          </p>
          <Field label="Motiv anulare">
            <Input
              placeholder="ex: cerere client, fraudă, etc."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              autoFocus
            />
          </Field>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="ghost" style={{ flex: 1, justifyContent: "center" }} onClick={() => { setCancelTarget(null); setCancelReason(""); }}>
              Renunță
            </Btn>
            <Btn
              variant="primary"
              style={{ flex: 1, justifyContent: "center", background: "var(--red)", borderColor: "var(--red)" }}
              icon={<I.close />}
              disabled={!cancelReason.trim()}
              onClick={handleCancelMembership}
            >
              Anulează
            </Btn>
          </div>
        </div>
      </Modal>

      {/* ── NO-SHOW MODAL ── */}
      <Modal
        open={!!noShowClient}
        onClose={() => setNoShowClient(null)}
        title={noShowClient?.name ?? ""}
      >
        <div style={{ padding: "0 20px 24px", minWidth: 340 }}>
          {noShowLoading ? (
            <div
              style={{
                padding: "40px 0",
                textAlign: "center",
                color: "var(--text-dim)",
                fontFamily: "var(--mono)",
                fontSize: 12,
              }}
            >
              Se încarcă...
            </div>
          ) : noShowData ? (
            <>
              {/* Cancelled banner */}
              {noShowData.membership_status === "cancelled" && (
                <div style={{ padding: "12px 14px", borderRadius: 10, marginBottom: 20, background: "rgba(255,85,102,.08)", border: "1px solid rgba(255,85,102,.25)" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--red)", fontFamily: "var(--display)", textTransform: "uppercase", letterSpacing: 0.04, marginBottom: 4 }}>
                    Abonament anulat
                  </div>
                  {noShowData.cancelled_reason && (
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      Motiv: {noShowData.cancelled_reason}
                    </div>
                  )}
                </div>
              )}

              {/* Blocked banner */}
              {noShowData.membership_status !== "cancelled" && (noShowData.blocked ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 14px",
                    borderRadius: 10,
                    marginBottom: 20,
                    background: "rgba(255,80,60,.08)",
                    border: "1px solid rgba(255,80,60,.25)",
                  }}
                >
                  <I.close
                    width={14}
                    height={14}
                    style={{ color: "var(--coral)", flexShrink: 0 }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--coral)",
                        fontFamily: "var(--display)",
                        textTransform: "uppercase",
                        letterSpacing: 0.04,
                      }}
                    >
                      Înscrierea blocată
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-dim)",
                        marginTop: 2,
                      }}
                    >
                      {noShowData.count} absențe nemotivate - limita este 3
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 14px",
                    borderRadius: 10,
                    marginBottom: 20,
                    background: "rgba(224,251,76,.06)",
                    border: "1px solid rgba(224,251,76,.2)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--accent)",
                      fontFamily: "var(--display)",
                      textTransform: "uppercase",
                      letterSpacing: 0.04,
                    }}
                  >
                    Activ · {noShowData.count} absențe
                  </div>
                </div>
              )
              )}

              {/* No-show list */}
              {noShowData.no_shows.length > 0 ? (
                <>
                  <div
                    className="eyebrow"
                    style={{ fontSize: 9, marginBottom: 10 }}
                  >
                    Sesiuni ratate
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      marginBottom: 20,
                    }}
                  >
                    {noShowData.no_shows.map((ns) => {
                      const dt = new Date(ns.start_datetime);
                      const dateStr = dt.toLocaleDateString("ro-RO", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      });
                      const timeStr = `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
                      return (
                        <div
                          key={ns.enrollment_id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 14px",
                            borderRadius: 8,
                            background: "var(--surface-2)",
                            border: "1px solid var(--border-soft)",
                          }}
                        >
                          <div style={{ fontSize: 13, fontWeight: 500 }}>
                            {ns.class_name}
                          </div>
                          <div
                            className="mono"
                            style={{ fontSize: 11, color: "var(--text-dim)" }}
                          >
                            {dateStr} · {timeStr}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--text-dim)",
                    marginBottom: 20,
                    textAlign: "center",
                  }}
                >
                  Nicio absență înregistrată.
                </div>
              )}

              {/* Clear button - only if there are no-shows */}
              {noShowData.count > 0 && (
                <Btn
                  variant={noShowData.blocked ? "primary" : "outline"}
                  onClick={handleClearNoShows}
                  disabled={clearing}
                  style={{ width: "100%" }}
                >
                  {clearing ? "Se șterge…" : "Șterge absențele de la sala ta"}
                </Btn>
              )}
            </>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
