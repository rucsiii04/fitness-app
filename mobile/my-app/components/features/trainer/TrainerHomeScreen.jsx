import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Colors, Fonts } from "@/constants/theme";
import { useAppFonts } from "@/hooks/useAppFonts";
import { ScreenBackground } from "@/components/ui/ScreenBackground";
import { useAuth } from "@/context/AuthContext";
import {
  fetchDashboardStats,
  fetchClientsWithDetails,
} from "@/services/trainerDashboardService";

const GOAL_LABELS = {
  lose_weight: "Slăbire",
  maintain: "Menținere",
  gain_weight: "Masă Musculară",
};
const GOAL_COLORS = {
  lose_weight: Colors.error,
  maintain: Colors.secondary,
  gain_weight: Colors.primary,
};

const DAYS = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"];

function pluralClients(n) {
  return n === 1 ? `${n} Client Activ` : `${n} Clienți Activi`;
}
function pluralRequests(n) {
  return n === 1 ? "1 Cerere" : `${n} Cereri`;
}
function pluralClasses(n) {
  return n === 1 ? "1 Curs Azi" : `${n} Cursuri Azi`;
}

function ClientMiniCard({ client, lastSession }) {
  const profile = client.Client_Profile;
  const goal = profile?.main_goal;
  const initials =
    `${client.first_name?.[0] ?? ""}${client.last_name?.[0] ?? ""}`.toUpperCase();

  const lastSessionText = lastSession
    ? new Date(lastSession).toLocaleDateString("ro-RO", {
        day: "2-digit",
        month: "short",
      })
    : null;

  return (
    <View style={styles.clientCard}>
      <View style={styles.clientAvatar}>
        <Text style={styles.clientAvatarText}>{initials}</Text>
      </View>
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>
          {client.first_name} {client.last_name}
        </Text>
        {goal ? (
          <View
            style={[
              styles.goalBadge,
              { backgroundColor: GOAL_COLORS[goal] + "22" },
            ]}
          >
            <Text style={[styles.goalText, { color: GOAL_COLORS[goal] }]}>
              {GOAL_LABELS[goal]}
            </Text>
          </View>
        ) : null}
      </View>
      {lastSessionText ? (
        <Text style={styles.clientLastSession}>{lastSessionText}</Text>
      ) : null}
    </View>
  );
}

function TrainerBarChart({ data }) {
  const maxVal = Math.max(...data, 1);
  const today = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  return (
    <View style={styles.chartContainer}>
      {data.map((val, i) => {
        const pct = val / maxVal;
        const isToday = i === today;
        return (
          <View key={i} style={styles.barWrapper}>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  { height: `${Math.max(pct * 100, 4)}%` },
                  isToday && styles.barToday,
                ]}
              />
            </View>
            <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
              {DAYS[i]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function TrainerHomeScreen() {
  const fontsLoaded = useAppFonts();
  const router = useRouter();
  const { token, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [clients, setClients] = useState([]);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [s, c] = await Promise.all([
        fetchDashboardStats(token),
        fetchClientsWithDetails(token),
      ]);
      setStats(s);
      setClients(c);
    } catch {}
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!fontsLoaded) return null;

  const weeklyTotal = stats?.weeklyData?.reduce((a, b) => a + b, 0) ?? 0;
  const activeClients = stats?.activeClients ?? 0;
  const pendingRequests = stats?.pendingRequests ?? 0;
  const classesToday = stats?.classesToday ?? 0;

  return (
    <ScreenBackground>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.logoText}>KINETIC</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => router.push("/workout/schedule")}
              style={styles.headerIcon}
            >
              <Ionicons
                name="calendar-outline"
                size={22}
                color={Colors.onSurfaceVariant}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/workout/public-zone")}
              style={styles.headerIcon}
            >
              <Ionicons
                name="compass-outline"
                size={22}
                color={Colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.welcomeSection}>
            <Text style={styles.greeting}>
              Bun venit,{"\n"}
              <Text style={styles.greetingName}>
                {user?.first_name ?? "Antrenor"}.
              </Text>
            </Text>
          </View>

          <View style={styles.heroRow}>
            <View style={styles.heroMainCard}>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
              <Text style={styles.heroValue}>
                {stats ? activeClients : "—"}
              </Text>
              <Text style={styles.heroLabel}>
                {stats ? pluralClients(activeClients) : "Clienți Activi"}
              </Text>
            </View>
            <View style={styles.heroSideCol}>
              <View
                style={[
                  styles.heroSmallCard,
                  { backgroundColor: Colors.error + "18" },
                ]}
              >
                <Ionicons name="mail-outline" size={18} color={Colors.error} />
                <Text style={[styles.heroSmallValue, { color: Colors.error }]}>
                  {stats ? pendingRequests : "—"}
                </Text>
                <Text style={styles.heroSmallLabel}>
                  {stats ? pluralRequests(pendingRequests) : "Cereri"}
                </Text>
              </View>
              <View
                style={[
                  styles.heroSmallCard,
                  { backgroundColor: Colors.secondary + "18" },
                ]}
              >
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={Colors.secondary}
                />
                <Text
                  style={[styles.heroSmallValue, { color: Colors.secondary }]}
                >
                  {stats ? classesToday : "—"}
                </Text>
                <Text style={styles.heroSmallLabel}>
                  {stats ? pluralClasses(classesToday) : "Cursuri Azi"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Activitate Săptămânală</Text>
              <View style={styles.totalBadge}>
                <Text style={styles.totalBadgeText}>{weeklyTotal} sesiuni</Text>
              </View>
            </View>
            <TrainerBarChart data={stats?.weeklyData ?? Array(7).fill(0)} />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Clienții Mei</Text>
            {clients.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="people-outline"
                  size={32}
                  color={Colors.textMuted}
                />
                <Text style={styles.emptyText}>Niciun client activ</Text>
              </View>
            ) : (
              clients
                .slice(0, 5)
                .map((item) => (
                  <ClientMiniCard
                    key={item.assignment_id}
                    client={item.client}
                    lastSession={item.last_session}
                  />
                ))
            )}
            {clients.length > 5 && (
              <TouchableOpacity
                onPress={() => router.push("/(trainer)/clients")}
                style={styles.viewAllBtn}
              >
                <Text style={styles.viewAllText}>
                  Vezi toți ({clients.length})
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={Colors.primary}
                />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  logoText: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.primary,
    letterSpacing: -1,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 4 },
  headerIcon: { padding: 6 },
  scroll: { paddingHorizontal: 20, gap: 16 },
  welcomeSection: { paddingTop: 24, paddingBottom: 4 },
  greeting: {
    fontSize: 32,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    letterSpacing: -1,
    lineHeight: 38,
  },
  greetingName: { color: Colors.primary, fontFamily: Fonts.headline },
  heroRow: { flexDirection: "row", gap: 12 },
  heroMainCard: {
    flex: 2,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    justifyContent: "flex-end",
    minHeight: 140,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  liveText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: Colors.primary,
    fontFamily: Fonts.label,
  },
  heroValue: {
    fontSize: 48,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    lineHeight: 52,
  },
  heroLabel: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.body,
    marginTop: 2,
  },
  heroSideCol: { flex: 1, gap: 12 },
  heroSmallCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    justifyContent: "center",
    gap: 4,
  },
  heroSmallValue: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: Fonts.headline,
  },
  heroSmallLabel: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.body,
  },
  card: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  totalBadge: {
    backgroundColor: Colors.primaryDimAlphaLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  totalBadgeText: {
    fontSize: 11,
    color: Colors.primary,
    fontFamily: Fonts.label,
  },
  chartContainer: {
    flexDirection: "row",
    height: 100,
    alignItems: "flex-end",
    gap: 6,
  },
  barWrapper: { flex: 1, alignItems: "center", gap: 6 },
  barTrack: {
    flex: 1,
    width: "100%",
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 6,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  bar: {
    width: "100%",
    backgroundColor: Colors.primaryDimAlpha,
    borderRadius: 6,
  },
  barToday: { backgroundColor: Colors.primary },
  dayLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: Fonts.label,
  },
  dayLabelToday: { color: Colors.primary },
  clientCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    gap: 12,
  },
  clientAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primaryDimAlphaLight,
    alignItems: "center",
    justifyContent: "center",
  },
  clientAvatarText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.primary,
  },
  clientInfo: { flex: 1, gap: 4 },
  clientName: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.textPrimary,
  },
  goalBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  goalText: { fontSize: 10, fontFamily: Fonts.label, fontWeight: "700" },
  clientLastSession: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: Fonts.body,
  },
  emptyState: { alignItems: "center", paddingVertical: 24, gap: 8 },
  emptyText: { fontSize: 13, color: Colors.textMuted, fontFamily: Fonts.body },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingTop: 4,
  },
  viewAllText: { fontSize: 13, color: Colors.primary, fontFamily: Fonts.label },
  bottomPadding: { height: 110 },
});
