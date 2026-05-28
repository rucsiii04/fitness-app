import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { Colors, Fonts } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { ScreenBackground } from "@/components/ui/ScreenBackground";
import { ClassCard } from "./ClassCard";
import { EnrollmentCard } from "./EnrollmentCard";
import { CancelConfirmSheet } from "./CancelConfirmSheet";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

const MONTHS_RO = [
  "Ianuarie","Februarie","Martie","Aprilie","Mai","Iunie",
  "Iulie","August","Septembrie","Octombrie","Noiembrie","Decembrie",
];
const DAY_HEADERS = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"];

function toDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function dateToKey(d) {
  return toDateKey(d.getFullYear(), d.getMonth(), d.getDate());
}
function keyToDate(key) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}
function sessionDateKey(session) {
  const d = new Date(session.start_datetime);
  return toDateKey(d.getFullYear(), d.getMonth(), d.getDate());
}
function buildCalendarWeeks(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7;
  const days = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}
function todayDate() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function ConfirmModal({ visible, title, message, buttons, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <TouchableOpacity style={cm.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={cm.card} activeOpacity={1} onPress={() => {}}>
          <View style={cm.handle} />
          <Text style={cm.title}>{title}</Text>
          {message ? <Text style={cm.message}>{message}</Text> : null}
          <View style={cm.btnCol}>
            {buttons.map((btn, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  cm.btn,
                  btn.variant === "primary" && cm.btnPrimary,
                  btn.variant === "cancel" && cm.btnCancel,
                ]}
                onPress={btn.onPress}
                activeOpacity={0.8}
              >
                <Text style={[
                  cm.btnText,
                  btn.variant === "primary" && cm.btnTextPrimary,
                  btn.variant === "cancel" && cm.btnTextCancel,
                ]}>
                  {btn.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const cm = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 24,
    gap: 16,
  },
  handle: {
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.outlineVariant,
    alignSelf: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
    textAlign: "center",
  },
  message: {
    fontSize: 13,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 19,
  },
  btnCol: { gap: 8, marginTop: 4 },
  btn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  btnPrimary: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  btnCancel: { backgroundColor: "transparent", borderColor: Colors.borderSubtle },
  btnText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  btnTextPrimary: { color: Colors.background },
  btnTextCancel: { color: Colors.onSurfaceVariant },
});

function TabToggle({ active, onChange }) {
  return (
    <View style={styles.tabToggle}>
      {["schedule", "enrollments"].map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tabBtn, active === tab && styles.tabBtnActive]}
          onPress={() => onChange(tab)}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabBtnText, active === tab && styles.tabBtnTextActive]}>
            {tab === "schedule" ? "Program" : "Rezervările mele"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function EmptyDay() {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="barbell-outline" size={40} color={Colors.outlineVariant} />
      <Text style={styles.emptyTitle}>Nicio clasă azi</Text>
      <Text style={styles.emptySubtitle}>
        Nu există sesiuni programate pentru această zi. Încearcă altă dată.
      </Text>
    </View>
  );
}

function EmptyEnrollments() {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="calendar-outline" size={40} color={Colors.outlineVariant} />
      <Text style={styles.emptyTitle}>Nicio rezervare încă</Text>
      <Text style={styles.emptySubtitle}>
        Nu te-ai înscris la nicio clasă. Răsfoiește programul pentru a începe.
      </Text>
    </View>
  );
}

export default function ClassesScreen() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState("schedule");

  const today = todayDate();
  const todayKey = dateToKey(today);

  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const [sessions, setSessions] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrollmentMap, setEnrollmentMap] = useState({});
  const [busyMap, setBusyMap] = useState({});
  const [membershipStatus, setMembershipStatus] = useState("none");
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [modal, setModal] = useState({ visible: false, title: "", message: "", buttons: [] });
  const closeModal = () => setModal((m) => ({ ...m, visible: false }));
  const showInfo = (title, message) => setModal({
    visible: true, title, message,
    buttons: [{ label: "OK", variant: "cancel", onPress: () => setModal((m) => ({ ...m, visible: false })) }],
  });

  const authHeader = { Authorization: `Bearer ${token}` };

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      loadAll();
    }, [token]),
  );

  const loadAll = async () => {
    setLoading(true);
    try {
      const gymId = user?.gym_id;
      const [sessionsRes, enrollmentsRes, membershipRes] = await Promise.all([
        gymId
          ? fetch(`${API_BASE}/classes/gyms/${gymId}/class-sessions`, { headers: authHeader })
          : Promise.resolve(null),
        fetch(`${API_BASE}/classes/enrollments/my`, { headers: authHeader }),
        fetch(`${API_BASE}/memberships/me/current`, { headers: authHeader }),
      ]);

      if (sessionsRes?.ok) {
        const raw = await sessionsRes.json();
        // Handle both old array format and new { sessions, gym_hours } format
        setSessions(Array.isArray(raw) ? raw : (raw.sessions ?? []));
      }

      if (enrollmentsRes.ok) {
        const data = await enrollmentsRes.json();
        const list = Array.isArray(data) ? data : [];
        setMyEnrollments(list);
        const map = {};
        for (const e of list) {
          if (["confirmed", "waiting_list"].includes(e.status)) {
            map[e.session_id] = e;
          }
        }
        setEnrollmentMap(map);
      }

      if (membershipRes.ok) {
        const mData = await membershipRes.json();
        setMembershipStatus(
          mData?.Membership_Type?.includes_group_classes === true ? "ok" : "no_classes",
        );
      } else {
        setMembershipStatus("none");
      }
    } catch (err) {
      console.error("Load classes error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const setBusy = (sessionId, val) =>
    setBusyMap((prev) => ({ ...prev, [sessionId]: val }));

  const handleEnroll = async (session) => {
    setBusy(session.session_id, true);
    try {
      const res = await fetch(
        `${API_BASE}/classes/class-sessions/${session.session_id}/enrollments`,
        { method: "POST", headers: authHeader },
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.message);
      const enrollment = body.enrollment ?? body;
      const waitingPosition = body.waiting_position ?? null;
      setEnrollmentMap((prev) => ({ ...prev, [session.session_id]: enrollment }));
      if (enrollment.status === "confirmed") {
        setSessions((prev) =>
          prev.map((s) =>
            s.session_id === session.session_id
              ? { ...s, confirmed_count: (s.confirmed_count ?? 0) + 1 }
              : s,
          ),
        );
      }
      setMyEnrollments((prev) => [
        ...prev.filter((e) => e.session_id !== session.session_id),
        { ...enrollment, Class_Session: session },
      ]);
      if (enrollment.status === "waiting_list") {
        showInfo(
          "Pe lista de așteptare",
          `Clasa este plină. Ești pe locul #${waitingPosition} pe lista de așteptare.`,
        );
      }
    } catch (err) {
      showInfo("Eroare la înscriere", err.message ?? "Te rugăm să încerci din nou.");
    } finally {
      setBusy(session.session_id, false);
    }
  };

  const handleCancel = (session) => {
    setConfirmTarget({
      type: "session",
      data: session,
      isWaitlist: enrollmentMap[session.session_id]?.status === "waiting_list",
    });
  };

  const handleCancelFromEnrollments = (enrollment) => {
    setConfirmTarget({
      type: "enrollment",
      data: enrollment,
      isWaitlist: enrollment.status === "waiting_list",
    });
  };

  const handleConfirmCancel = async () => {
    if (!confirmTarget) return;
    const { type, data } = confirmTarget;
    setConfirmTarget(null);

    if (type === "session") {
      const session = data;
      setBusy(session.session_id, true);
      try {
        const res = await fetch(
          `${API_BASE}/classes/class-sessions/${session.session_id}/enrollments`,
          { method: "DELETE", headers: authHeader },
        );
        if (!res.ok) { const b = await res.json(); throw new Error(b.message); }
        const wasConfirmed = enrollmentMap[session.session_id]?.status === "confirmed";
        setEnrollmentMap((prev) => { const next = { ...prev }; delete next[session.session_id]; return next; });
        if (wasConfirmed) {
          setSessions((prev) =>
            prev.map((s) =>
              s.session_id === session.session_id
                ? { ...s, confirmed_count: Math.max(0, (s.confirmed_count ?? 1) - 1) }
                : s,
            ),
          );
        }
        setMyEnrollments((prev) => prev.filter((e) => e.session_id !== session.session_id));
      } catch (err) {
        showInfo("Eroare", err.message ?? "Nu s-a putut anula.");
      } finally {
        setBusy(session.session_id, false);
      }
    } else {
      const enrollment = data;
      const sessionId = enrollment.session_id;
      setBusy(sessionId, true);
      try {
        const res = await fetch(
          `${API_BASE}/classes/class-sessions/${sessionId}/enrollments`,
          { method: "DELETE", headers: authHeader },
        );
        if (!res.ok) { const b = await res.json(); throw new Error(b.message); }
        setMyEnrollments((prev) => prev.filter((e) => e.enrollment_id !== enrollment.enrollment_id));
        setEnrollmentMap((prev) => { const next = { ...prev }; delete next[sessionId]; return next; });
      } catch (err) {
        showInfo("Eroare", err.message ?? "Nu s-a putut anula.");
      } finally {
        setBusy(sessionId, false);
      }
    }
  };

  // Calendar computed values
  const daysWithSessions = useMemo(() => {
    const s = new Set();
    sessions.forEach((sess) => s.add(sessionDateKey(sess)));
    return s;
  }, [sessions]);

  const calWeeks = useMemo(() => buildCalendarWeeks(calYear, calMonth), [calYear, calMonth]);

  const goMonthPrev = () => {
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); }
    else setCalMonth((m) => m - 1);
  };
  const goMonthNext = () => {
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); }
    else setCalMonth((m) => m + 1);
  };

  const selectedDate = keyToDate(selectedKey);

  const sessionsForDay = sessions
    .filter((s) => isSameDay(new Date(s.start_datetime), selectedDate))
    .sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime));

  const upcomingEnrollments = myEnrollments.filter((e) =>
    ["confirmed", "waiting_list"].includes(e.status),
  );
  const historyEnrollments = myEnrollments.filter((e) =>
    ["attended", "no_show", "cancelled"].includes(e.status),
  );

  if (!user?.gym_id && !loading) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Cursuri</Text>
          </View>
          <View style={styles.centered}>
            <Ionicons name="card-outline" size={40} color={Colors.outlineVariant} />
            <Text style={styles.emptyTitle}>Fără abonament</Text>
            <Text style={styles.emptySubtitle}>
              Ai nevoie de un abonament activ pentru a vedea și rezerva cursuri.
            </Text>
          </View>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Cursuri</Text>
            <Text style={styles.headerSub}>Îmbunătățește-ți performanța de bază</Text>
          </View>
          <TabToggle active={activeTab} onChange={setActiveTab} />
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : activeTab === "schedule" ? (
          <FlatList
            data={sessionsForDay}
            keyExtractor={(item) => String(item.session_id)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<EmptyDay />}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            ListHeaderComponent={
              /* ── Calendar card ── */
              <View style={styles.calCard}>
                {/* Month navigation */}
                <View style={styles.monthNav}>
                  <TouchableOpacity onPress={goMonthPrev} style={styles.monthNavBtn} hitSlop={8}>
                    <Ionicons name="chevron-back" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.monthTitle}>
                    {MONTHS_RO[calMonth]} {calYear}
                  </Text>
                  <TouchableOpacity onPress={goMonthNext} style={styles.monthNavBtn} hitSlop={8}>
                    <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                </View>

                {/* Day-of-week headers */}
                <View style={styles.weekRow}>
                  {DAY_HEADERS.map((d) => (
                    <Text key={d} style={styles.weekHeader}>{d}</Text>
                  ))}
                </View>

                {/* Calendar weeks */}
                {calWeeks.map((week, wi) => (
                  <View key={wi} style={styles.weekRow}>
                    {week.map((day, di) => {
                      if (!day) return <View key={di} style={styles.dayCell} />;
                      const dk = toDateKey(calYear, calMonth, day);
                      const isToday = dk === todayKey;
                      const isSelected = dk === selectedKey;
                      const hasSess = daysWithSessions.has(dk);
                      const isEnrolled = hasSess && sessions
                        .filter((s) => sessionDateKey(s) === dk)
                        .some((s) => !!enrollmentMap[s.session_id]);
                      return (
                        <TouchableOpacity
                          key={di}
                          style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                          onPress={() => {
                            setSelectedKey(dk);
                            // Jump calendar to the month of the tapped day
                            setCalYear(calYear);
                            setCalMonth(calMonth);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={[
                            styles.dayNum,
                            isToday && !isSelected && styles.dayNumToday,
                            isSelected && styles.dayNumSelected,
                          ]}>
                            {day}
                          </Text>
                          <View style={[
                            styles.dayDot,
                            isEnrolled
                              ? styles.dayDotEnrolled
                              : hasSess
                                ? isSelected ? styles.dayDotActiveSelected : styles.dayDotActive
                                : styles.dayDotEmpty,
                          ]} />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}

                {/* Legend */}
                <View style={styles.legend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.dayDot, styles.dayDotActive]} />
                    <Text style={styles.legendText}>Sesiuni disponibile</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.dayDot, styles.dayDotEnrolled]} />
                    <Text style={styles.legendText}>Înscris</Text>
                  </View>
                </View>
              </View>
            }
            renderItem={({ item }) => (
              <ClassCard
                session={item}
                enrollment={enrollmentMap[item.session_id] ?? null}
                onEnroll={() => handleEnroll(item)}
                onCancel={() => handleCancel(item)}
                busy={!!busyMap[item.session_id]}
                membershipStatus={membershipStatus}
              />
            )}
          />
        ) : (
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {upcomingEnrollments.length === 0 && historyEnrollments.length === 0 ? (
              <EmptyEnrollments />
            ) : (
              <>
                {upcomingEnrollments.length > 0 && (
                  <>
                    <Text style={styles.sectionLabel}>Viitoare</Text>
                    {upcomingEnrollments.map((item, i) => (
                      <View key={String(item.enrollment_id)} style={i > 0 && { marginTop: 10 }}>
                        <EnrollmentCard
                          enrollment={item}
                          onCancel={() => handleCancelFromEnrollments(item)}
                          busy={!!busyMap[item.session_id]}
                        />
                      </View>
                    ))}
                  </>
                )}
                {historyEnrollments.length > 0 && (
                  <>
                    <Text style={[styles.sectionLabel, upcomingEnrollments.length > 0 && { marginTop: 28 }]}>
                      Istoric
                    </Text>
                    {historyEnrollments.map((item, i) => (
                      <View key={String(item.enrollment_id)} style={i > 0 && { marginTop: 10 }}>
                        <EnrollmentCard
                          enrollment={item}
                          onCancel={() => handleCancelFromEnrollments(item)}
                          busy={!!busyMap[item.session_id]}
                          dimmed
                        />
                      </View>
                    ))}
                  </>
                )}
              </>
            )}
          </ScrollView>
        )}
      </SafeAreaView>

      <CancelConfirmSheet
        visible={confirmTarget !== null}
        isWaitlist={confirmTarget?.isWaitlist ?? false}
        onConfirm={handleConfirmCancel}
        onClose={() => setConfirmTarget(null)}
      />

      <ConfirmModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        buttons={modal.buttons}
        onClose={closeModal}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 20,
    paddingRight: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: Fonts.headline,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  headerSub: {
    fontSize: 11,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },

  tabToggle: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  tabBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 9,
  },
  tabBtnActive: { backgroundColor: Colors.surfaceContainerHighest },
  tabBtnText: {
    fontSize: 10,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.onSurfaceVariant,
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  tabBtnTextActive: { color: Colors.primary },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
    flexGrow: 1,
    gap: 0,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.onSurfaceVariant,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 12,
  },

  // ── Calendar ─────────────────────────────────────────────────
  calCard: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 4,
    marginBottom: 16,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  monthNavBtn: { padding: 4 },
  monthTitle: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  weekRow: { flexDirection: "row" },
  weekHeader: {
    flex: 1,
    textAlign: "center",
    fontSize: 10,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
    paddingBottom: 10,
    paddingTop: 4,
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
    minHeight: 44,
    justifyContent: "center",
  },
  dayCellSelected: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryDimAlphaLight,
  },
  dayNum: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: Fonts.label,
    color: Colors.textPrimary,
  },
  dayNumToday: { color: Colors.primary, fontWeight: "800" },
  dayNumSelected: { color: Colors.primary, fontWeight: "800" },
  dayDot: { width: 5, height: 5, borderRadius: 3 },
  dayDotActive: { backgroundColor: Colors.onSurfaceVariant },
  dayDotActiveSelected: { backgroundColor: Colors.primary },
  dayDotEnrolled: { backgroundColor: Colors.primary },
  dayDotEmpty: { backgroundColor: "transparent" },

  legend: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendText: {
    fontSize: 10,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
  },

  // ── Empty states ──────────────────────────────────────────────
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 40,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: Fonts.headline,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 20,
  },
});
