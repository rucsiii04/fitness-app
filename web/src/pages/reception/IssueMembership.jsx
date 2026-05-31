import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import TopBar from "../../components/layout/TopBar.jsx";
import Btn from "../../components/ui/Btn.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import Pill from "../../components/ui/Pill.jsx";
import Field from "../../components/ui/Field.jsx";
import * as I from "../../components/ui/Icons.jsx";
import { searchClients } from "../../api/reception.js";
import {
  getMembershipTypesByGym,
  issueMembership,
} from "../../api/memberships.js";

export default function IssueMembership() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const gymId = user?.gym_id;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [client, setClient] = useState(null);

  const [types, setTypes] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [payment, setPayment] = useState("cash");
  const [issuing, setIssuing] = useState(false);
  const [done, setDone] = useState(false);

  const debounceRef = useRef(null);

  useEffect(() => {
    if (!gymId) return;
    getMembershipTypesByGym(gymId)
      .then((r) => setTypes(r.data))
      .catch(() => {});
  }, [gymId]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await searchClients(query, gymId);
        setResults(r.data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [query, gymId]);

  async function handleIssue(e) {
    e.preventDefault();
    if (!client || !selectedType) return;
    setIssuing(true);
    try {
      await issueMembership({
        client_id: client.user_id,
        membership_type_id: parseInt(selectedType),
        payment_method: payment,
      });
      setDone(true);
      addToast("Abonament emis cu succes", "success");
    } catch (err) {
      addToast(
        err.response?.data?.message || "Eroare la emiterea abonamentului",
        "error",
      );
    } finally {
      setIssuing(false);
    }
  }

  function reset() {
    setQuery("");
    setResults([]);
    setClient(null);
    setSelectedType("");
    setPayment("cash");
    setDone(false);
  }

  if (done) {
    const type = types.find((t) => t.membership_type_id === parseInt(selectedType));
    return (
      <>
        <TopBar title="Emite Abonament" eyebrow="Recepție" />
        <div style={{ padding: 32, maxWidth: 520, margin: "0 auto" }}>
          <div
            style={{
              borderRadius: 16,
              border: "1px solid rgba(125,216,125,.3)",
              background: "rgba(125,216,125,.06)",
              padding: 40,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                background: "rgba(125,216,125,.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--green)",
              }}
            >
              <I.check width={28} height={28} />
            </div>
            <div>
              <div className="display" style={{ fontSize: 20, marginBottom: 8 }}>
                {client.first_name} {client.last_name}
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <Pill tone="green">{type?.name}</Pill>
                <Pill tone="muted">{payment}</Pill>
              </div>
            </div>
            <Btn variant="outline" icon={<I.plus />} onClick={reset}>
              Emite alt abonament
            </Btn>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title="Emite Abonament" eyebrow="Recepție" />
      <div style={{ padding: 32, maxWidth: 520, margin: "0 auto" }}>
        <form
          onSubmit={handleIssue}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          {/* Member search */}
          <Field label="Membru">
            {client ? (
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
                  name={`${client.first_name} ${client.last_name}`}
                  size={28}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {client.first_name} {client.last_name}
                  </div>
                  <div
                    className="mono"
                    style={{ fontSize: 10, color: "var(--text-dim)" }}
                  >
                    {client.phone || client.email}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setClient(null);
                    setQuery("");
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
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Caută după nume, email sau telefon…"
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
                  {searching && (
                    <I.clock
                      width={13}
                      height={13}
                      style={{ color: "var(--text-dim)", flexShrink: 0 }}
                    />
                  )}
                </div>

                {results.length > 0 && (
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
                    {results.map((c) => (
                      <button
                        key={c.user_id}
                        type="button"
                        onClick={() => {
                          setClient(c);
                          setQuery("");
                          setResults([]);
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
                          (e.currentTarget.style.background = "var(--surface-2)")
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
                            {c.phone || c.email}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {query.trim().length >= 2 &&
                  !searching &&
                  results.length === 0 && (
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

          {/* Plan select */}
          <Field label="Plan">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
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
              {types.map((t) => (
                <option key={t.membership_type_id} value={t.membership_type_id}>
                  {t.name} — RON {t.price}
                </option>
              ))}
            </select>
          </Field>

          {/* Payment method */}
          <Field label="Metodă de plată">
            <div style={{ display: "flex", gap: 8 }}>
              {["cash", "card"].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPayment(method)}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: 10,
                    border: `1px solid ${payment === method ? "var(--accent)" : "var(--border-strong)"}`,
                    background:
                      payment === method
                        ? "rgba(224,251,76,.1)"
                        : "var(--surface-2)",
                    color:
                      payment === method ? "var(--accent)" : "var(--text-dim)",
                    fontSize: 13,
                    fontWeight: payment === method ? 700 : 400,
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

          {/* Submit */}
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "flex-end",
              marginTop: 4,
            }}
          >
            <Btn
              variant="primary"
              type="submit"
              icon={<I.check />}
              disabled={!client || !selectedType || issuing}
            >
              {issuing ? "Se emite…" : "Emite abonament"}
            </Btn>
          </div>
        </form>
      </div>
    </>
  );
}
