import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Image,
  AppState,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { Colors, Fonts } from "@/constants/theme";
import { useAppFonts } from "@/hooks/useAppFonts";
import { ScreenBackground } from "@/components/ui/ScreenBackground";
import { StatCard } from "@/components/ui/StatCard";
import { MembershipCard } from "@/components/features/home/MembershipCard";
import { WorkoutHeroCard } from "@/components/features/home/WorkoutHeroCard";
import { GymAlertBanner } from "@/components/ui/GymAlertBanner";
import { socketOn, socketOff } from "@/services/socket";

import { useAuth } from "@/context/AuthContext";
const API_BASE = process.env.EXPO_PUBLIC_API_URL;
export default function HomeScreen() {
  const fontsLoaded = useAppFonts();
  const router = useRouter();
  const { token, user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [membership, setMembership] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [alert, setAlert] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    const safeFetch = async (url, setter, transform) => {
      try {
        const res = await fetch(url, { headers });
        const text = await res.text();

        if (res.status === 401) {
          await logout();
          router.replace("/(auth)/login");
          return;
        }

        if (!res.ok) return;

        let data;
        try {
          data = JSON.parse(text);
        } catch {
          return;
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
    safeFetch(`${API_BASE}/gyms/${user.gym_id}/alerts`, setAlert);
    safeFetch(`${API_BASE}/qr/my-attendance`, setAttendance, (data) =>
      Array.isArray(data) ? data : [],
    );
  }, [token]);

  // Re-fetch when the screen gains focus (tab switch / navigation)
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  // Always call the latest fetchData - avoids stale closure in the AppState listener
  const fetchDataRef = useRef(fetchData);
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  // Re-fetch silently when the app comes back to the foreground
  const appStateRef = useRef(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      console.log("[AppState]", appStateRef.current, "→", nextState);
      if (appStateRef.current !== "active" && nextState === "active") {
        console.log("[AppState] app became active → re-fetching");
        fetchDataRef.current();
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, []); // runs once - always reads latest fetchData via ref

  useEffect(() => {
    const handler = (data) => setAlert(data?.message ? data : null);
    socketOn("gym_alert", handler);
    return () => socketOff("gym_alert", handler);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Bună dimineața";
    if (hour >= 12 && hour < 17) return "Bună ziua";
    return "Bună seara";
  };

  const totalWorkouts = sessions.length;
  const lastVisit = (() => {
    if (!attendance[0]?.entry_time) return null;
    const diffMs = Date.now() - new Date(attendance[0].entry_time);
    const mins = Math.round(diffMs / 60000);
    if (mins < 60) return { value: mins, unit: "Min în urmă" };
    const hours = Math.round(diffMs / 3600000);
    if (hours < 24)
      return {
        value: hours,
        unit: hours === 1 ? "Oră în urmă" : "Ore în urmă",
      };
    const days = Math.round(diffMs / 86400000);
    if (days <= 31)
      return { value: days, unit: days === 1 ? "Zi în urmă" : "Zile în urmă" };
    return { value: "30+", unit: "Zile în urmă" };
  })();
  const membershipDaysLeft = membership?.end_date
    ? Math.max(
        0,
        Math.ceil(
          (new Date(membership.end_date) - new Date()) / (1000 * 60 * 60 * 24),
        ),
      )
    : null;

  if (!fontsLoaded) return null;
  const heroWorkout =
    sessions.length > 0 && sessions[0]?.Workout ? sessions[0].Workout : null;
  return (
    <ScreenBackground>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <SafeAreaView style={styles.safeArea}>
        <GymAlertBanner message={alert?.message} />
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.logoText}>KINETIC</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => router.push("/(tabs)/discover")}
            >
              <Ionicons
                name="compass-outline"
                size={22}
                color={Colors.onSurfaceVariant}
              />
            </TouchableOpacity>
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await fetchData();
                setRefreshing(false);
              }}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        >
          <View style={styles.welcomeSection}>
            <Text style={styles.greeting}>
              {getGreeting()},{"\n"}
              <Text style={styles.greetingName}>
                {user?.first_name || "Sportiv"}.
              </Text>
            </Text>
            <Text style={styles.greetingSub}>Gata de antrenament?</Text>
          </View>

          <WorkoutHeroCard workout={heroWorkout} />

          <MembershipCard membership={membership} />

          <View style={styles.statsGrid}>
            <View style={styles.statsRow}>
              <StatCard
                label="Antrenamente"
                value={totalWorkouts}
                unit="Total"
                icon="fitness-outline"
                iconColor={Colors.primary}
              />
              <StatCard
                label="Zile Rămase"
                value={membershipDaysLeft ?? "-"}
                unit="Zile"
                icon="calendar-outline"
                iconColor={Colors.primary}
              />
            </View>
            <View style={styles.statsRow}>
              <StatCard
                label="Ultima Vizită"
                value={lastVisit ? lastVisit.value : "-"}
                unit={lastVisit ? lastVisit.unit : ""}
                icon="time-outline"
                iconColor={Colors.secondary}
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
