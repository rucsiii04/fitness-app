import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors, Fonts } from "@/constants/theme";
import { useAppFonts } from "@/hooks/useAppFonts";
import { ScreenBackground } from "@/components/ui/ScreenBackground";
import { StatCard } from "@/components/ui/StatCard";
import { WeeklyChart } from "@/components/features/home/WeeklyChart";
import { MembershipCard } from "@/components/features/home/MembershipCard";
import { WorkoutHeroCard } from "@/components/features/home/WorkoutHeroCard";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;
export default function HomeScreen() {
  const fontsLoaded = useAppFonts();
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [membership, setMembership] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [latestWorkout, setLatestWorkout] = useState(null);

  // TODO
  const token = "toKEN";

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };

    fetch(`${API_BASE}/profile`, { headers })
      .then((r) => r.json())
      .then(setProfile)
      .catch(console.error);

    fetch(`${API_BASE}/memberships`, { headers })
      .then((r) => r.json())
      .then((data) => setMembership(data?.[0] || null))
      .catch(console.error);

    fetch(`${API_BASE}/workout-sessions`, { headers })
      .then((r) => r.json())
      .then(setSessions)
      .catch(console.error);

    fetch(`${API_BASE}/workouts`, { headers })
      .then((r) => r.json())
      .then((data) => setLatestWorkout(data?.[0] || null))
      .catch(console.error);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const totalWorkouts = sessions.length;
  const lastVisitHours = sessions[0]?.start_time
    ? Math.round((Date.now() - new Date(sessions[0].start_time)) / 3600000)
    : null;
  const membershipDaysLeft = membership?.end_date
    ? Math.max(
        0,
        Math.ceil(
          (new Date(membership.end_date) - new Date()) / (1000 * 60 * 60 * 24),
        ),
      )
    : null;

  if (!fontsLoaded) return null;

  return (
    <ScreenBackground>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Ionicons
                name="person"
                size={18}
                color={Colors.onSurfaceVariant}
              />
            </View>
            <Text style={styles.logoText}>KINETIC</Text>
          </View>
          <TouchableOpacity style={styles.qrButton}>
            <Ionicons name="qr-code-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.welcomeSection}>
            <Text style={styles.systemActive}>⬡ System Active</Text>
            <Text style={styles.greeting}>
              {getGreeting()},{"\n"}
              <Text style={styles.greetingName}>
                {profile?.first_name || "Athlete"}.
              </Text>
            </Text>
            <Text style={styles.greetingSub}>Ready to Push?</Text>
          </View>

          <WorkoutHeroCard workout={latestWorkout} />

          <MembershipCard membership={membership} />

          <WeeklyChart sessions={sessions} />

          <View style={styles.statsGrid}>
            <View style={styles.statsRow}>
              <StatCard
                label="Workouts"
                value={totalWorkouts}
                unit="Total"
                icon="fitness-outline"
                iconColor={Colors.primary}
              />
              <StatCard
                label="Days Remaining"
                value={membershipDaysLeft ?? "—"}
                unit="Days"
                icon="calendar-outline"
                iconColor={Colors.primary}
              />
            </View>
            <View style={styles.statsRow}>
              <StatCard
                label="Last Visit"
                value={lastVisitHours != null ? lastVisitHours : "—"}
                unit={lastVisitHours != null ? "Hrs Ago" : ""}
                icon="time-outline"
                iconColor={Colors.secondary}
              />
              <StatCard
                label="Weekly Streak"
                value="—"
                unit="Days"
                icon="flame-outline"
                iconColor={Colors.primary}
              />
            </View>
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceContainerHighest,
    borderWidth: 2,
    borderColor: "rgba(209,255,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.primary,
    letterSpacing: -1,
  },
  qrButton: {
    padding: 4,
  },
  scroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  welcomeSection: {
    paddingTop: 24,
    paddingBottom: 8,
    gap: 4,
  },
  systemActive: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 3,
    textTransform: "uppercase",
    color: Colors.secondary,
    fontFamily: Fonts.label,
    marginBottom: 8,
  },
  greeting: {
    fontSize: 36,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    letterSpacing: -1,
    lineHeight: 40,
  },
  greetingName: {
    color: Colors.primary,
    fontFamily: Fonts.headline,
  },
  greetingSub: {
    fontSize: 16,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.body,
    marginTop: 4,
  },
  statsGrid: {
    gap: 12,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  bottomPadding: {
    height: 100,
  },
});
