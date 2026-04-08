import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors, Fonts } from "@/constants/theme";
import { useAppFonts } from "@/hooks/useAppFonts";
import { useAuth } from "@/context/AuthContext";
import { ScreenBackground } from "@/components/ui/ScreenBackground";
import EditProfileModal from "./EditProfileModal";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

function MetricCard({ label, value, unit, icon, iconColor }) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricTop}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.metricBottom}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
          style={styles.metricValue}
        >
          {value}
          {unit && <Text style={styles.metricUnit}> {unit}</Text>}
        </Text>
      </View>
    </View>
  );
}

function SettingsRow({ icon, label, onPress, danger }) {
  return (
    <TouchableOpacity
      style={styles.settingsRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingsLeft}>
        <Ionicons
          name={icon}
          size={20}
          color={danger ? Colors.error : Colors.onSurfaceVariant}
        />
        <Text
          style={[styles.settingsLabel, danger && styles.settingsLabelDanger]}
        >
          {label}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={16}
        color={Colors.outlineVariant}
      />
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const fontsLoaded = useAppFonts();
  const { token, user, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [editVisible, setEditVisible] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.user_id) setProfile(data);
      })
      .catch(console.error);
  }, [token]);

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  const formatGoal = (goal) => {
    if (!goal) return "—";
    return goal.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatActivity = (level) => {
    if (!level) return "—";
    const map = {
      sedentary: "Sedentary",
      light: "Light",
      moderate: "Moderate",
      active: "Active",
      very_active: "Very Active",
    };
    return map[level] || level;
  };

  const initials =
    `${user?.first_name?.[0] || ""}${user?.last_name?.[0] || ""}`.toUpperCase();

  if (!fontsLoaded) return null;

  return (
    <ScreenBackground>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>KINETIC PROFILE</Text>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons
              name="settings-outline"
              size={22}
              color={Colors.primary}
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.avatarSection}>
            <Text style={styles.userName}>
              {user?.first_name} {user?.last_name}
            </Text>
            <Text style={styles.userRole}>
              {user?.role?.replace(/_/g, " ").toUpperCase()} · KINETIC MEMBER
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>

          <View
            style={[
              styles.sectionHeader,
              {
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              },
            ]}
          >
            <Text style={styles.sectionTitle}>VITAL METRICS</Text>
            <TouchableOpacity
              onPress={() => setEditVisible(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="create-outline"
                size={18}
                color={Colors.primary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.metricsGrid}>
            <MetricCard
              label="Weight"
              value={profile?.current_weight ?? "—"}
              unit={profile?.current_weight ? "KG" : ""}
              icon="scale-outline"
              iconColor={Colors.primaryDim}
            />
            <MetricCard
              label="Height"
              value={profile?.height ?? "—"}
              unit={profile?.height ? "CM" : ""}
              icon="body-outline"
              iconColor={Colors.secondary}
            />
            <MetricCard
              label="Activity"
              value={formatActivity(profile?.activity_level)}
              icon="flash-outline"
              iconColor={Colors.tertiary}
            />
            <MetricCard
              label="Goal"
              value={formatGoal(profile?.main_goal)}
              icon="flag-outline"
              iconColor={Colors.primary}
            />
          </View>

          {profile?.medical_restriction && (
            <View style={styles.medicalCard}>
              <View style={styles.medicalHeader}>
                <Ionicons
                  name="shield-outline"
                  size={16}
                  color={Colors.errorDim}
                />
                <Text style={styles.medicalTitle}>Medical Restrictions</Text>
              </View>
              <Text style={styles.medicalText}>
                {profile.medical_restriction}
              </Text>
            </View>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>PREFERENCES</Text>
          </View>
          <View style={styles.settingsCard}>
            <SettingsRow
              icon="person-outline"
              label="Account Details"
              onPress={() => {}}
            />
            <View style={styles.settingsDivider} />
            <SettingsRow
              icon="notifications-outline"
              label="Notification Preferences"
              onPress={() => {}}
            />
            <View style={styles.settingsDivider} />
            <SettingsRow
              icon="lock-closed-outline"
              label="Privacy Policy"
              onPress={() => {}}
            />
            <View style={styles.settingsDivider} />
            <SettingsRow
              icon="time-outline"
              label="Session History"
              onPress={() => {}}
            />
          </View>

          {/* Logout */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color={Colors.onSurfaceVariant}
            />
            <Text style={styles.logoutText}>LOG OUT</Text>
          </TouchableOpacity>

          <View style={styles.bottomPadding} />
        </ScrollView>
        <EditProfileModal
          visible={editVisible}
          profile={profile}
          token={token}
          apiBase={API_BASE}
          onClose={() => setEditVisible(false)}
          onSaved={(updated) => setProfile(updated)}
        />
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
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  headerIcon: { padding: 4 },
  scroll: {
    paddingHorizontal: 20,
    gap: 16,
  },

  avatarSection: {
    alignItems: "center",
    paddingTop: 32,
    gap: 6,
  },
  avatarGlow: {
    padding: 3,
    borderRadius: 999,
    backgroundColor: "rgba(209,255,0,0.15)",
    marginBottom: 4,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.surfaceContainerHighest,
    borderWidth: 3,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.primary,
  },
  userName: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    letterSpacing: -1,
    textTransform: "uppercase",
  },
  userRole: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    color: Colors.secondary,
    fontFamily: Fonts.label,
    textTransform: "uppercase",
  },
  userEmail: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.body,
  },

  sectionHeader: {
    paddingHorizontal: 4,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 3,
    textTransform: "uppercase",
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.label,
  },

  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricCard: {
    width: "47%",
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 16,
    padding: 20,
    justifyContent: "space-between",
    minHeight: 120,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  metricTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metricBottom: { marginTop: 24, gap: 4 },
  metricLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.label,
  },
  metricValue: {
    fontSize: 26,
    fontWeight: "700",
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  metricUnit: {
    fontSize: 13,
    fontWeight: "400",
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.body,
  },

  medicalCard: {
    backgroundColor: "rgba(213,61,24,0.06)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(213,61,24,0.2)",
    gap: 8,
  },
  medicalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  medicalTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: Colors.errorDim,
    fontFamily: Fonts.label,
  },
  medicalText: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.body,
    lineHeight: 20,
  },

  settingsCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  settingsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  settingsLabel: {
    fontSize: 15,
    fontWeight: "500",
    fontFamily: Fonts.body,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  settingsLabelDanger: { color: Colors.error },
  settingsDivider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginHorizontal: 20,
  },

  // Logout
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 2,
    borderColor: Colors.outlineVariant,
    borderRadius: 16,
    paddingVertical: 18,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 3,
    textTransform: "uppercase",
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.label,
  },
  bottomPadding: { height: 100 },
});
