import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { Colors, Fonts } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { ScreenBackground } from "@/components/ui/ScreenBackground";
import { DateSelector } from "./DateSelector";
import { ClassCard } from "./ClassCard";
import { EnrollmentCard } from "./EnrollmentCard";
import { CancelConfirmSheet } from "./CancelConfirmSheet";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

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
          <Text
            style={[
              styles.tabBtnText,
              active === tab && styles.tabBtnTextActive,
            ]}
          >
            {tab === "schedule" ? "Schedule" : "My Bookings"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function EmptyDay() {
  return (
    <View style={styles.emptyState}>
      <Ionicons
        name="barbell-outline"
        size={40}
        color={Colors.outlineVariant}
      />
      <Text style={styles.emptyTitle}>No Classes Today</Text>
      <Text style={styles.emptySubtitle}>
        There are no sessions scheduled for this day. Check another date.
      </Text>
    </View>
  );
}

function EmptyEnrollments() {
  return (
    <View style={styles.emptyState}>
      <Ionicons
        name="calendar-outline"
        size={40}
        color={Colors.outlineVariant}
      />
      <Text style={styles.emptyTitle}>No Bookings Yet</Text>
      <Text style={styles.emptySubtitle}>
        You haven't enrolled in any classes yet. Browse the schedule to get
        started.
      </Text>
    </View>
  );
}

export default function ClassesScreen() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState("schedule");
  const [selectedDate, setSelectedDate] = useState(today());

  const [sessions, setSessions] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrollmentMap, setEnrollmentMap] = useState({});
  const [busyMap, setBusyMap] = useState({});
  const [membershipStatus, setMembershipStatus] = useState("none");
  const [confirmTarget, setConfirmTarget] = useState(null);

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
          ? fetch(`${API_BASE}/classes/gyms/${gymId}/class-sessions`, {
              headers: authHeader,
            })
          : Promise.resolve(null),
        fetch(`${API_BASE}/classes/enrollments/my`, { headers: authHeader }),
        fetch(`${API_BASE}/memberships/me/current`, { headers: authHeader }),
      ]);

      let sessionsData = [];
      if (sessionsRes?.ok) {
        sessionsData = await sessionsRes.json();
        setSessions(Array.isArray(sessionsData) ? sessionsData : []);
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
          mData?.Membership_Type?.includes_group_classes === true
            ? "ok"
            : "no_classes",
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

      setEnrollmentMap((prev) => ({
        ...prev,
        [session.session_id]: enrollment,
      }));
      if (enrollment.status === "confirmed") {
        setSessions((prev) =>
          prev.map((s) =>
            s.session_id === session.session_id
              ? { ...s, confirmed_count: (s.confirmed_count ?? 0) + 1 }
              : s,
          ),
        );
      }
      const fullEnrollment = { ...enrollment, Class_Session: session };
      setMyEnrollments((prev) => [...prev, fullEnrollment]);

      if (enrollment.status === "waiting_list") {
        Alert.alert(
          "Added to Waitlist",
          `This class is full. You are #${waitingPosition} on the waiting list.`,
        );
      }
    } catch (err) {
      Alert.alert("Could Not Enroll", err.message ?? "Please try again.");
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
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.message);
        }
        const wasConfirmed =
          enrollmentMap[session.session_id]?.status === "confirmed";
        setEnrollmentMap((prev) => {
          const next = { ...prev };
          delete next[session.session_id];
          return next;
        });
        if (wasConfirmed) {
          setSessions((prev) =>
            prev.map((s) =>
              s.session_id === session.session_id
                ? {
                    ...s,
                    confirmed_count: Math.max(0, (s.confirmed_count ?? 1) - 1),
                  }
                : s,
            ),
          );
        }
        setMyEnrollments((prev) =>
          prev.filter((e) => e.session_id !== session.session_id),
        );
      } catch (err) {
        Alert.alert("Error", err.message ?? "Could not cancel.");
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
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.message);
        }
        setMyEnrollments((prev) =>
          prev.filter((e) => e.enrollment_id !== enrollment.enrollment_id),
        );
        setEnrollmentMap((prev) => {
          const next = { ...prev };
          delete next[sessionId];
          return next;
        });
      } catch (err) {
        Alert.alert("Error", err.message ?? "Could not cancel.");
      } finally {
        setBusy(sessionId, false);
      }
    }
  };

  // Filter sessions for the selected date
  const sessionsForDay = sessions.filter((s) =>
    isSameDay(new Date(s.start_datetime), selectedDate),
  );

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
            <Text style={styles.headerTitle}>Classes</Text>
          </View>
          <View style={styles.centered}>
            <Ionicons
              name="card-outline"
              size={40}
              color={Colors.outlineVariant}
            />
            <Text style={styles.emptyTitle}>No Gym Membership</Text>
            <Text style={styles.emptySubtitle}>
              You need an active membership to view and book classes.
            </Text>
          </View>
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Classes</Text>
            <Text style={styles.headerSub}>
              Elevate your baseline performance
            </Text>
          </View>
          <TabToggle active={activeTab} onChange={setActiveTab} />
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : activeTab === "schedule" ? (
          <>
            <DateSelector selected={selectedDate} onChange={setSelectedDate} />

            <FlatList
              data={sessionsForDay}
              keyExtractor={(item) => String(item.session_id)}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={<EmptyDay />}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
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
          </>
        ) : (
          <ScrollView
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {upcomingEnrollments.length === 0 &&
            historyEnrollments.length === 0 ? (
              <EmptyEnrollments />
            ) : (
              <>
                {upcomingEnrollments.length > 0 && (
                  <>
                    <Text style={styles.sectionLabel}>Upcoming</Text>
                    {upcomingEnrollments.map((item, i) => (
                      <View
                        key={String(item.enrollment_id)}
                        style={i > 0 && { marginTop: 10 }}
                      >
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
                    <Text
                      style={[
                        styles.sectionLabel,
                        upcomingEnrollments.length > 0 && { marginTop: 28 },
                      ]}
                    >
                      History
                    </Text>
                    {historyEnrollments.map((item, i) => (
                      <View
                        key={String(item.enrollment_id)}
                        style={i > 0 && { marginTop: 10 }}
                      >
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
  tabBtnActive: {
    backgroundColor: Colors.surfaceContainerHighest,
  },
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

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 60,
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
