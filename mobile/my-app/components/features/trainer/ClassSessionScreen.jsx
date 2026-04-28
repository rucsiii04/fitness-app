import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors, Fonts } from "@/constants/theme";
import { ScreenBackground } from "@/components/ui/ScreenBackground";
import { useAuth } from "@/context/AuthContext";
import {
  fetchSessionEnrollments,
  markAttendance,
} from "@/services/trainerDashboardService";

function fmtTime(d) {
  const dt = new Date(d);
  return `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
}

function getWindowInfo(start, end, now) {
  const opensAt = new Date(new Date(start).getTime() - 15 * 60_000);
  const closesAt = new Date(new Date(end).getTime() + 15 * 60_000);
  return {
    opensAt,
    closesAt,
    isOpen: now >= opensAt && now <= closesAt,
    isBefore: now < opensAt,
  };
}

function InitialsAvatar({ name, size = 38 }) {
  const parts = (name || "?").trim().split(/\s+/);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : (parts[0][0] || "?").toUpperCase();
  const hue =
    Math.abs(
      (name || "")
        .split("")
        .reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0),
    ) % 360;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: `hsl(${hue}, 40%, 26%)`,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: "#fff",
          fontSize: size * 0.36,
          fontWeight: "700",
          fontFamily: Fonts.label,
        }}
      >
        {initials}
      </Text>
    </View>
  );
}

export default function ClassSessionScreen({
  sessionId,
  sessionName,
  startDatetime,
  endDatetime,
}) {
  const router = useRouter();
  const { token } = useAuth();

  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState({});
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!token || !sessionId) return;
    fetchSessionEnrollments(sessionId, token)
      .then((data) => setEnrollments(Array.isArray(data) ? data : []))
      .catch(() => Alert.alert("Eroare", "Nu s-au putut încărca înscrierile."))
      .finally(() => setLoading(false));
  }, [sessionId, token]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const handleMark = async (enrollmentId, newStatus, prevStatus) => {
    if (marking[enrollmentId]) return;
    setMarking((m) => ({ ...m, [enrollmentId]: true }));
    setEnrollments((prev) =>
      prev.map((e) =>
        e.enrollment_id === enrollmentId ? { ...e, status: newStatus } : e,
      ),
    );
    try {
      await markAttendance(enrollmentId, newStatus, token);
    } catch (err) {
      setEnrollments((prev) =>
        prev.map((e) =>
          e.enrollment_id === enrollmentId ? { ...e, status: prevStatus } : e,
        ),
      );
      Alert.alert("Eroare", err.message || "Nu s-a putut marca prezența.");
    } finally {
      setMarking((m) => ({ ...m, [enrollmentId]: false }));
    }
  };

  const winInfo = getWindowInfo(startDatetime, endDatetime, now);
  const members = enrollments.filter((e) =>
    ["confirmed", "attended", "no_show"].includes(e.status),
  );
  const waitlisted = enrollments.filter((e) => e.status === "waiting_list");
  const attendedCount = members.filter((e) => e.status === "attended").length;
  const noShowCount = members.filter((e) => e.status === "no_show").length;
  const pendingCount = members.filter((e) => e.status === "confirmed").length;

  return (
    <ScreenBackground>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={8}
            style={s.backBtn}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={s.headerTitle} numberOfLines={1}>
            {sessionName}
          </Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.infoCard}>
            <View style={s.timeRow}>
              <Ionicons
                name="time-outline"
                size={14}
                color={Colors.onSurfaceVariant}
              />
              <Text style={s.timeText}>
                {fmtTime(startDatetime)} – {fmtTime(endDatetime)}
              </Text>
            </View>

            <View style={[s.windowRow, winInfo.isOpen && s.windowRowOpen]}>
              <View style={[s.dot, winInfo.isOpen ? s.dotOpen : s.dotClosed]} />
              <Text style={[s.windowText, winInfo.isOpen && s.windowTextOpen]}>
                {winInfo.isOpen
                  ? `Check-in activ · se închide la ${fmtTime(winInfo.closesAt)}`
                  : winInfo.isBefore
                    ? `Check-in disponibil de la ${fmtTime(winInfo.opensAt)}`
                    : "Perioada de check-in s-a încheiat"}
              </Text>
            </View>
          </View>

          {!loading && members.length > 0 && (
            <View style={s.statsRow}>
              <View style={s.statBox}>
                <Text style={[s.statNum, { color: Colors.primary }]}>
                  {attendedCount}
                </Text>
                <Text style={s.statLabel}>Prezenți</Text>
              </View>
              <View style={s.statSep} />
              <View style={s.statBox}>
                <Text style={[s.statNum, { color: Colors.error }]}>
                  {noShowCount}
                </Text>
                <Text style={s.statLabel}>Absenți</Text>
              </View>
              <View style={s.statSep} />
              <View style={s.statBox}>
                <Text style={[s.statNum, { color: Colors.onSurfaceVariant }]}>
                  {pendingCount}
                </Text>
                <Text style={s.statLabel}>Neprecizat</Text>
              </View>
            </View>
          )}

          <Text style={s.sectionLabel}>ÎNSCRIȘI</Text>

          {loading ? (
            <ActivityIndicator
              color={Colors.primary}
              style={{ marginTop: 40 }}
            />
          ) : members.length === 0 ? (
            <View style={s.empty}>
              <Ionicons
                name="people-outline"
                size={38}
                color={Colors.outlineVariant}
              />
              <Text style={s.emptyText}>Niciun înscris confirmat</Text>
            </View>
          ) : (
            members.map((e) => {
              const name = e.Client
                ? `${e.Client.first_name} ${e.Client.last_name}`
                : `#${e.client_id}`;
              const busy = !!marking[e.enrollment_id];
              const canMark = winInfo.isOpen;

              return (
                <View key={e.enrollment_id} style={s.memberRow}>
                  <InitialsAvatar name={name} size={38} />
                  <View style={s.memberInfo}>
                    <Text style={s.memberName}>{name}</Text>
                    {e.Client?.email && (
                      <Text style={s.memberEmail} numberOfLines={1}>
                        {e.Client.email}
                      </Text>
                    )}
                  </View>

                  {busy ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : e.status === "confirmed" ? (
                    canMark ? (
                      <View style={s.markBtns}>
                        <TouchableOpacity
                          style={s.btnPresent}
                          onPress={() =>
                            handleMark(e.enrollment_id, "attended", "confirmed")
                          }
                          activeOpacity={0.75}
                        >
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color={Colors.background}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={s.btnAbsent}
                          onPress={() =>
                            handleMark(e.enrollment_id, "no_show", "confirmed")
                          }
                          activeOpacity={0.75}
                        >
                          <Ionicons
                            name="close"
                            size={16}
                            color={Colors.error}
                          />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={s.pendingBadge}>
                        <Text style={s.pendingText}>NEPRECIZAT</Text>
                      </View>
                    )
                  ) : (
                    <View style={s.markedGroup}>
                      <View
                        style={[
                          s.markedBadge,
                          e.status === "attended"
                            ? s.badgePresent
                            : s.badgeAbsent,
                        ]}
                      >
                        <Ionicons
                          name={e.status === "attended" ? "checkmark" : "close"}
                          size={11}
                          color={
                            e.status === "attended"
                              ? Colors.primary
                              : Colors.error
                          }
                        />
                        <Text
                          style={[
                            s.markedText,
                            {
                              color:
                                e.status === "attended"
                                  ? Colors.primary
                                  : Colors.error,
                            },
                          ]}
                        >
                          {e.status === "attended" ? "PREZENT" : "ABSENT"}
                        </Text>
                      </View>
                      {canMark && (
                        <TouchableOpacity
                          onPress={() =>
                            handleMark(
                              e.enrollment_id,
                              e.status === "attended" ? "no_show" : "attended",
                              e.status,
                            )
                          }
                          hitSlop={8}
                        >
                          <Ionicons
                            name="swap-horizontal-outline"
                            size={16}
                            color={Colors.onSurfaceVariant}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}

          {waitlisted.length > 0 && (
            <>
              <Text style={[s.sectionLabel, { marginTop: 28 }]}>
                LISTA DE AȘTEPTARE · {waitlisted.length}
              </Text>
              {waitlisted.map((e) => {
                const name = e.Client
                  ? `${e.Client.first_name} ${e.Client.last_name}`
                  : `#${e.client_id}`;
                return (
                  <View
                    key={e.enrollment_id}
                    style={[s.memberRow, { opacity: 0.5 }]}
                  >
                    <InitialsAvatar name={name} size={38} />
                    <View style={s.memberInfo}>
                      <Text style={s.memberName}>{name}</Text>
                    </View>
                    <View style={s.waitBadge}>
                      <Text style={s.waitText}>AȘTEPTARE</Text>
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  backBtn: { width: 38, alignItems: "flex-start" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  scroll: { padding: 16, gap: 12 },

  infoCard: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 14,
    gap: 10,
  },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  timeText: {
    fontSize: 13,
    fontFamily: Fonts.label,
    color: Colors.onSurfaceVariant,
  },
  windowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  windowRowOpen: {
    backgroundColor: "rgba(209,255,0,0.07)",
    borderWidth: 1,
    borderColor: "rgba(209,255,0,0.2)",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotOpen: { backgroundColor: Colors.primary },
  dotClosed: { backgroundColor: Colors.outlineVariant },
  windowText: {
    flex: 1,
    fontSize: 11,
    fontFamily: Fonts.label,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.2,
  },
  windowTextOpen: { color: Colors.primary },

  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingVertical: 14,
  },
  statBox: { flex: 1, alignItems: "center", gap: 2 },
  statNum: {
    fontSize: 26,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    lineHeight: 30,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: Fonts.label,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  statSep: {
    width: 1,
    backgroundColor: Colors.borderSubtle,
    marginVertical: 4,
  },

  sectionLabel: {
    fontSize: 10,
    fontFamily: Fonts.label,
    color: Colors.onSurfaceVariant,
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 2,
    marginLeft: 2,
  },
  empty: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyText: {
    fontSize: 14,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
  },

  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 12,
  },
  memberInfo: { flex: 1, gap: 2, minWidth: 0 },
  memberName: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: Fonts.label,
    color: Colors.textPrimary,
  },
  memberEmail: {
    fontSize: 11,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
  },

  markBtns: { flexDirection: "row", gap: 6 },
  btnPresent: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  btnAbsent: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,115,81,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,115,81,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },

  pendingBadge: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pendingText: {
    fontSize: 9,
    fontFamily: Fonts.label,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },

  markedGroup: { flexDirection: "row", alignItems: "center", gap: 6 },
  markedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  badgePresent: {
    backgroundColor: "rgba(209,255,0,0.08)",
    borderColor: "rgba(209,255,0,0.25)",
  },
  badgeAbsent: {
    backgroundColor: "rgba(255,115,81,0.08)",
    borderColor: "rgba(255,115,81,0.25)",
  },
  markedText: {
    fontSize: 9,
    fontFamily: Fonts.label,
    letterSpacing: 0.5,
  },

  waitBadge: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  waitText: {
    fontSize: 9,
    fontFamily: Fonts.label,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
});
