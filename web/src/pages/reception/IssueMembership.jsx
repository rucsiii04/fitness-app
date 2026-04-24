import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import TopBar from "../../components/layout/TopBar.jsx";
import Btn from "../../components/ui/Btn.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import Pill from "../../components/ui/Pill.jsx";
import * as I from "../../components/ui/Icons.jsx";
import { searchClients } from "../../api/reception.js";
import {
  getMembershipTypesByGym,
  issueMembership,
} from "../../api/memberships.js";

function Row({ style, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, ...style }}>
      {children}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: 20,
      }}
    >
      <div className="eyebrow" style={{ marginBottom: 14 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

export default function IssueMembership() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const gymId = user?.gym_id;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [client, setClient] = useState(null);

  const [types, setTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
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

  async function handleIssue() {
    if (!client || !selectedType) return;
    setIssuing(true);
    try {
      await issueMembership({
        client_id: client.user_id,
        membership_type_id: selectedType,
        payment_method: payment,
      });
      setDone(true);
      addToast("Membership issued successfully", "success");
    } catch (err) {
      addToast(
        err.response?.data?.message || "Failed to issue membership",
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
    setSelectedType(null);
    setPayment("cash");
    setDone(false);
  }

  if (done) {
    const type = types.find((t) => t.membership_type_id === selectedType);
    return (
      <>
        <TopBar title="Issue Membership" eyebrow="Reception" />
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
              <div
                className="display"
                style={{ fontSize: 20, marginBottom: 8 }}
              >
                {client.first_name} {client.last_name}
              </div>
              <div
                style={{ display: "flex", gap: 8, justifyContent: "center" }}
              >
                <Pill tone="green">{type?.name}</Pill>
                <Pill tone="muted">{payment}</Pill>
              </div>
            </div>
            <Btn variant="outline" icon={<I.plus />} onClick={reset}>
              Issue Another
            </Btn>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title="Issue Membership" eyebrow="Reception" />
      <div
        style={{
          padding: 32,
          maxWidth: 580,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <Section title="1 · Find Member">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "var(--surface-2)",
              border: "1px solid var(--border-strong)",
              borderRadius: 10,
              padding: "0 14px",
              height: 40,
            }}
          >
            <I.search
              width={15}
              height={15}
              style={{ color: "var(--text-dim)", flexShrink: 0 }}
            />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setClient(null);
              }}
              placeholder="Name, email or phone…"
              style={{
                flex: 1,
                background: "none",
                border: "none",
                outline: "none",
                fontSize: 13,
                color: "var(--text)",
              }}
            />
            {searching && (
              <I.clock
                width={14}
                height={14}
                style={{ color: "var(--text-dim)", flexShrink: 0 }}
              />
            )}
          </div>

          {results.length > 0 && !client && (
            <div
              style={{
                marginTop: 8,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {results.map((c) => (
                <button
                  key={c.user_id}
                  onClick={() => {
                    setClient(c);
                    setQuery("");
                    setResults([]);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    textAlign: "left",
                    width: "100%",
                    transition: "border-color .15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "var(--accent)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = "var(--border)")
                  }
                >
                  <Avatar name={`${c.first_name} ${c.last_name}`} size={30} />
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
            results.length === 0 &&
            !client && (
              <div
                className="mono"
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  color: "var(--text-dim)",
                  textAlign: "center",
                  padding: "12px 0",
                }}
              >
                No members found
              </div>
            )}

          {client && (
            <Row
              style={{
                marginTop: 10,
                padding: "10px 12px",
                background: "rgba(224,251,76,.06)",
                border: "1px solid rgba(224,251,76,.2)",
                borderRadius: 10,
              }}
            >
              <Avatar
                name={`${client.first_name} ${client.last_name}`}
                size={30}
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
                onClick={() => setClient(null)}
                style={{ color: "var(--text-dim)", display: "flex" }}
              >
                <I.close width={14} height={14} />
              </button>
            </Row>
          )}
        </Section>

        <Section title="2 · Membership Plan">
          {types.length === 0 ? (
            <div
              className="mono"
              style={{
                fontSize: 11,
                color: "var(--text-dim)",
                textAlign: "center",
                padding: "12px 0",
              }}
            >
              No active plans found
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {types.map((t) => {
                const active = selectedType === t.membership_type_id;
                return (
                  <button
                    key={t.membership_type_id}
                    onClick={() => setSelectedType(t.membership_type_id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      borderRadius: 10,
                      textAlign: "left",
                      width: "100%",
                      background: active
                        ? "rgba(224,251,76,.08)"
                        : "var(--surface-2)",
                      border: `1px solid ${active ? "rgba(224,251,76,.4)" : "var(--border)"}`,
                      transition: "all .15s",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: active ? "var(--accent)" : "var(--text)",
                        }}
                      >
                        {t.name}
                      </div>
                      <div
                        className="mono"
                        style={{
                          fontSize: 10,
                          color: "var(--text-dim)",
                          marginTop: 2,
                        }}
                      >
                        {t.duration_days} days
                        {t.includes_group_classes ? " · includes classes" : ""}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: active ? "var(--accent)" : "var(--text)",
                        fontFamily: "var(--mono)",
                      }}
                    >
                      {t.price} RON
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Section>

        <Section title="3 · Payment Method">
          <div style={{ display: "flex", gap: 10 }}>
            {["cash", "card"].map((m) => (
              <button
                key={m}
                onClick={() => setPayment(m)}
                style={{
                  flex: 1,
                  padding: "12px 0",
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: 13,
                  textTransform: "uppercase",
                  letterSpacing: 0.04,
                  fontFamily: "var(--display)",
                  background:
                    payment === m ? "rgba(224,251,76,.08)" : "var(--surface-2)",
                  border: `1px solid ${payment === m ? "rgba(224,251,76,.4)" : "var(--border)"}`,
                  color: payment === m ? "var(--accent)" : "var(--text-muted)",
                  transition: "all .15s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {m === "cash" ? (
                  <I.bolt width={14} height={14} />
                ) : (
                  <I.card width={14} height={14} />
                )}
                {m}
              </button>
            ))}
          </div>
        </Section>

        <Btn
          variant="primary"
          size="lg"
          icon={<I.check />}
          disabled={!client || !selectedType || issuing}
          onClick={handleIssue}
          style={{ width: "100%" }}
        >
          {issuing ? "Issuing…" : "Issue Membership"}
        </Btn>
      </div>
    </>
  );
}
