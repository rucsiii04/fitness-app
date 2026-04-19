import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors, Fonts } from "@/constants/theme";
import { useAppFonts } from "@/hooks/useAppFonts";
import { ScreenBackground } from "@/components/ui/ScreenBackground";
import { StatCard } from "@/components/ui/StatCard";
import { WeeklyChart } from "@/components/features/home/WeeklyChart";
import { MembershipCard } from "@/components/features/home/MembershipCard";
import { WorkoutHeroCard } from "@/components/features/home/WorkoutHeroCard";

import { useAuth } from "@/context/AuthContext";
const API_BASE = process.env.EXPO_PUBLIC_API_URL;
export default function HomeScreen() {
  const fontsLoaded = useAppFonts();
  const router = useRouter();
  const { token, user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [membership, setMembership] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [latestWorkout, setLatestWorkout] = useState(null);

  useEffect(() => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    const safeFetch = async (url, setter, transform) => {
      try {
        const res = await fetch(url, { headers });
        const text = await res.text();

        console.log(`${url} :`, res.status, text.substring(0, 200));

        if (res.status === 401) {
          console.log("Token expirat → logout");

          await logout();
          router.replace("/login");

          return;
        }

        let data;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(text);
        }

        setter(transform ? transform(data) : data);
      } catch (err) {
        console.error(`Failed ${url}:`, err.message);
      }
    };

    safeFetch(`${API_BASE}/profile`, setProfile);
    safeFetch(`${API_BASE}/memberships/me/current`, setMembership, (data) => {
      if (!data || !data.membership_id) return null;
      return {
        ...data,
        type_name: data.Membership_Type?.name,
        gym_name: data.Membership_Type?.Gym?.name,
      };
    });
    safeFetch(`${API_BASE}/workout-sessions`, setSessions, (data) =>
      Array.isArray(data) ? data : [],
    );
    safeFetch(`${API_BASE}/workouts`, setLatestWorkout, (data) =>
      Array.isArray(data) ? data?.[0] : null,
    );
  }, [token]);

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
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => router.push("/(tabs)/classes")}
            >
              <Ionicons
                name="calendar-outline"
                size={22}
                color={Colors.onSurfaceVariant}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => router.push("/(tabs)/gym")}
            >
              <Ionicons
                name="location-outline"
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
            <Text style={styles.systemActive}>⬡ System Active</Text>
            <Text style={styles.greeting}>
              {getGreeting()},{"\n"}
              <Text style={styles.greetingName}>
                {user?.first_name || "Athlete"}.
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIconBtn: {
    padding: 6,
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
