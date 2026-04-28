import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  getTrainersByGym,
  createTrainer,
  createFrontDesk,
  deleteTrainer,
  deleteFrontDesk,
} from "../../api/gymAdmin.js";
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
  const [form, setForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    role: "trainer",
  });
  const [errors, setErrors] = useState({});

  const gymId = user?.gym_id;

  const load = () => {
    if (!gymId) {
      setLoading(false);
      return;
    }
    getTrainersByGym(gymId)
      .then((r) => setStaff(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [gymId]);

  const validate = () => {
    const e = {};
    const nameRe = /^[a-zA-ZăâîșțĂÂÎȘȚ\s-]+$/;
    if (!form.first_name.trim() || form.first_name.trim().length < 2)
      e.first_name = "Minim 2 caractere";
    else if (!nameRe.test(form.first_name)) e.first_name = "Doar litere";
    if (!form.last_name.trim() || form.last_name.trim().length < 2)
      e.last_name = "Minim 2 caractere";
    else if (!nameRe.test(form.last_name)) e.last_name = "Doar litere";
    if (!form.email.trim()) e.email = "Email obligatoriu";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Email invalid";
    if (
      form.phone &&
      !/^(\+40|0040|0)[2-9]\d{8}$/.test(form.phone.replace(/\s/g, ""))
    )
      e.phone = "Număr de telefon invalid (ex: 0740123456)";
    return e;
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    try {
      const payload = { ...form, gym_id: gymId };
      if (form.role === "front_desk") {
        await createFrontDesk(payload);
      } else {
        await createTrainer(payload);
      }
      toast("Invitație trimisă");
      setInviteOpen(false);
      setForm({
        email: "",
        first_name: "",
        last_name: "",
        phone: "",
        role: "trainer",
      });
      setErrors({});
      load();
    } catch (err) {
      toast(
        err.response?.data?.message || "Eroare la trimiterea invitației",
        "coral",
      );
    }
  };

  const handleDelete = async (id, role) => {
    if (!window.confirm("Elimini acest angajat din sală?")) return;
    try {
      if (role === "front_desk") {
        await deleteFrontDesk(id);
      } else {
        await deleteTrainer(id);
      }
      toast("Angajat dezactivat");
      load();
    } catch (err) {
      toast(err.response?.data?.message || "Eroare", "coral");
    }
  };

  const ROLE_LABEL = { trainer: "Antrenor", front_desk: "Recepționer" };

  const filters = [
    { k: "all", label: "Toți", count: staff.length },
    {
      k: "trainer",
      label: "Antrenori",
      count: staff.filter((s) => s.role === "trainer").length,
    },
    {
      k: "front_desk",
      label: "Recepționeri",
      count: staff.filter((s) => s.role === "front_desk").length,
    },
  ];

  const filtered =
    filter === "all" ? staff : staff.filter((s) => s.role === filter);

  return (
    <>
      <TopBar
        title="Personal"
        eyebrow={`${staff.length} membri în echipă`}
        actions={
          <Btn
            variant="primary"
            icon={<I.plus />}
            onClick={() => setInviteOpen(true)}
          >
            Adaugă angajat
          </Btn>
        }
      />

      <div
        style={{
          padding: "20px 32px",
          display: "flex",
          gap: 8,
          borderBottom: "1px solid var(--border-soft)",
        }}
      >
        {filters.map((f) => (
          <button
            key={f.k}
            onClick={() => setFilter(f.k)}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              background: filter === f.k ? "var(--accent)" : "transparent",
              color: filter === f.k ? "var(--accent-ink)" : "var(--text-muted)",
              border: `1px solid ${filter === f.k ? "var(--accent)" : "var(--border-strong)"}`,
              textTransform: "uppercase",
              letterSpacing: 0.06,
              fontFamily: "var(--display)",
            }}
          >
            {f.label}{" "}
            <span style={{ opacity: 0.5, marginLeft: 6 }}>{f.count}</span>
          </button>
        ))}
      </div>

      <div
        style={{
          padding: 32,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        {loading && (
          <div
            style={{
              gridColumn: "1/-1",
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

        {!loading && filtered.length === 0 && (
          <div
            style={{
              gridColumn: "1/-1",
              padding: "64px 0",
              textAlign: "center",
            }}
          >
            <I.users
              width={32}
              height={32}
              style={{ opacity: 0.2, marginBottom: 12 }}
            />
            <div
              className="display upper"
              style={{
                fontSize: 14,
                color: "var(--text-muted)",
                marginBottom: 8,
              }}
            >
              {gymId ? "Niciun angajat încă" : "Nicio sală atribuită"}
            </div>
            {gymId && (
              <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                Adaugă un angajat pentru a începe.
              </div>
            )}
          </div>
        )}

        {filtered.map((s) => {
          const name = `${s.first_name} ${s.last_name}`;
          return (
            <div key={s.user_id} className="card" style={{ padding: 18 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                <Avatar name={name} size={48} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{name}</div>
                  <div
                    className="mono"
                    style={{ fontSize: 11, color: "var(--text-dim)" }}
                  >
                    {s.email}
                  </div>
                </div>
                <span
                  className="pulse-dot"
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    background: "var(--accent)",
                    marginTop: 6,
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <div>
                  <div className="eyebrow" style={{ fontSize: 9 }}>
                    Rol
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {ROLE_LABEL[s.role] || s.role}
                  </div>
                </div>
                <div>
                  <div className="eyebrow" style={{ fontSize: 9 }}>
                    Telefon
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    {s.phone || "—"}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: 10,
                  borderTop: "1px solid var(--border-soft)",
                }}
              >
                <Pill tone="green">Activ</Pill>
                <button
                  onClick={() => handleDelete(s.user_id, s.role)}
                  style={{ color: "var(--text-dim)", padding: 4 }}
                >
                  <I.trash width={14} height={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        open={inviteOpen}
        onClose={() => {
          setInviteOpen(false);
          setErrors({});
        }}
        title="Adaugă angajat"
      >
        <form
          onSubmit={handleInvite}
          style={{
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <Field label="Prenume" error={errors.first_name}>
              <Input
                value={form.first_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, first_name: e.target.value }))
                }
              />
            </Field>
            <Field label="Nume" error={errors.last_name}>
              <Input
                value={form.last_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, last_name: e.target.value }))
                }
              />
            </Field>
          </div>
          <Field label="Email" error={errors.email}>
            <Input
              icon={<I.mail />}
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
            />
          </Field>
          <Field label="Telefon" error={errors.phone}>
            <Input
              icon={<I.phone />}
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
            />
          </Field>
          <Field label="Rol">
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { value: "trainer", label: "Antrenor" },
                { value: "front_desk", label: "Recepționer" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, role: opt.value }))}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "var(--display)",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    background:
                      form.role === opt.value ? "var(--accent)" : "transparent",
                    color:
                      form.role === opt.value
                        ? "var(--accent-ink)"
                        : "var(--text-muted)",
                    border: `1px solid ${form.role === opt.value ? "var(--accent)" : "var(--border-strong)"}`,
                    cursor: "pointer",
                  }}
                >
                  {opt.label}
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
              onClick={() => setInviteOpen(false)}
            >
              Anulează
            </Btn>
            <Btn variant="primary" type="submit">
              Trimite invitație
            </Btn>
          </div>
        </form>
      </Modal>
    </>
  );
}
