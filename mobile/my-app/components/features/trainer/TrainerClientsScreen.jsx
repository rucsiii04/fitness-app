import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { Colors, Fonts } from "@/constants/theme";
import { useAppFonts } from "@/hooks/useAppFonts";
import { ScreenBackground } from "@/components/ui/ScreenBackground";
import { useAuth } from "@/context/AuthContext";
import {
  fetchClientsWithDetails,
  fetchClientWorkouts,
  endTrainingWithClient,
} from "@/services/trainerDashboardService";
import { ClientDetailModal } from "./ClientDetailModal";

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

const DIFFICULTY_COLORS = {
  beginner: Colors.primary,
  intermediate: Colors.secondary,
  advanced: Colors.error,
};
const DIFFICULTY_LABELS = {
  beginner: "Începător",
  intermediate: "Intermediar",
  advanced: "Avansat",
};

function WorkoutRow({ workout }) {
  return (
    <View style={styles.workoutRow}>
      <View style={styles.workoutRowLeft}>
        <Ionicons name="barbell-outline" size={14} color={Colors.onSurfaceVariant} />
        <Text style={styles.workoutName} numberOfLines={1}>{workout.name}</Text>
      </View>
      <View style={[styles.diffBadge, { backgroundColor: DIFFICULTY_COLORS[workout.difficulty_level] + "22" }]}>
        <Text style={[styles.diffBadgeText, { color: DIFFICULTY_COLORS[workout.difficulty_level] }]}>
          {DIFFICULTY_LABELS[workout.difficulty_level]}
        </Text>
      </View>
    </View>
  );
}

function ClientCard({ item, token, onEnd, onDetail }) {
  const router = useRouter();
  const { client, last_session } = item;
  const profile = client.Client_Profile;
  const goal = profile?.main_goal;
  const initials = `${client.first_name?.[0] ?? ""}${client.last_name?.[0] ?? ""}`.toUpperCase();
  const lastSessionText = last_session
    ? new Date(last_session).toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "numeric" })
    : null;

  const [expanded, setExpanded] = useState(false);
  const [workouts, setWorkouts] = useState([]);
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);

  const loadWorkouts = useCallback(async () => {
    if (workouts.length > 0 || loadingWorkouts) return;
    setLoadingWorkouts(true);
    try {
      const data = await fetchClientWorkouts(client.user_id, token);
      setWorkouts(data);
    } catch {
      /* silent */
    } finally {
      setLoadingWorkouts(false);
    }
  }, [client.user_id, token, workouts.length, loadingWorkouts]);

  const handleToggle = () => {
    if (!expanded) loadWorkouts();
    setExpanded((v) => !v);
  };

  const handleCreate = () => {
    router.push({
      pathname: "/workout/create",
      params: { clientId: client.user_id, clientName: `${client.first_name} ${client.last_name}` },
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{client.first_name} {client.last_name}</Text>
          {goal ? (
            <View style={[styles.goalBadge, { backgroundColor: GOAL_COLORS[goal] + "22" }]}>
              <Text style={[styles.goalText, { color: GOAL_COLORS[goal] }]}>{GOAL_LABELS[goal]}</Text>
            </View>
          ) : null}
        </View>
        <TouchableOpacity style={styles.detailBtn} onPress={() => onDetail(client, client.Client_Profile)} activeOpacity={0.8}>
          <Ionicons name="person-circle-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {client.email ? (
        <View style={styles.detailRow}>
          <Ionicons name="mail-outline" size={14} color={Colors.onSurfaceVariant} />
          <Text style={styles.detailText}>{client.email}</Text>
        </View>
      ) : null}
      {client.phone ? (
        <View style={styles.detailRow}>
          <Ionicons name="call-outline" size={14} color={Colors.onSurfaceVariant} />
          <Text style={styles.detailText}>{client.phone}</Text>
        </View>
      ) : null}
      {lastSessionText ? (
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={14} color={Colors.onSurfaceVariant} />
          <Text style={styles.detailText}>Ultima sesiune: {lastSessionText}</Text>
        </View>
      ) : null}

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.createBtn} onPress={handleCreate} activeOpacity={0.8}>
          <Ionicons name="add" size={15} color={Colors.background} />
          <Text style={styles.createBtnText}>Antrenament Nou</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.expandBtn} onPress={handleToggle} activeOpacity={0.8}>
          <Ionicons
            name={expanded ? "chevron-up" : "barbell-outline"}
            size={15}
            color={Colors.onSurfaceVariant}
          />
          <Text style={styles.expandBtnText}>Antrenamente</Text>
        </TouchableOpacity>
      </View>

      {expanded ? (
        <View style={styles.workoutsSection}>
          {loadingWorkouts ? (
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 8 }} />
          ) : workouts.length === 0 ? (
            <Text style={styles.noWorkoutsText}>Niciun antrenament creat pentru acest client.</Text>
          ) : (
            workouts.map((w) => <WorkoutRow key={w.workout_id} workout={w} />)
          )}
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.endBtn}
        onPress={() => onEnd(client.user_id, `${client.first_name} ${client.last_name}`)}
      >
        <Text style={styles.endBtnText}>Încheie Colaborarea</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function TrainerClientsScreen() {
  const fontsLoaded = useAppFonts();
  const { token } = useAuth();
  const [clients, setClients] = useState([]);
  const [detailClient, setDetailClient] = useState(null);
  const [detailProfile, setDetailProfile] = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchClientsWithDetails(token);
      setClients(data);
    } catch {
      /* silent */
    }
  }, [token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleEnd = (clientId, name) => {
    Alert.alert(
      "Încheie colaborarea",
      `Ești sigur că vrei să închei colaborarea cu ${name}?`,
      [
        { text: "Anulează", style: "cancel" },
        {
          text: "Da, încheie",
          style: "destructive",
          onPress: async () => {
            try {
              await endTrainingWithClient(clientId, token);
              setClients((prev) => prev.filter((c) => c.client.user_id !== clientId));
            } catch (err) {
              Alert.alert("Eroare", err.message);
            }
          },
        },
      ],
    );
  };

  if (!fontsLoaded) return null;

  return (
    <ScreenBackground>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Clienții Mei</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{clients.length}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {clients.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Niciun client activ</Text>
              <Text style={styles.emptySubtitle}>Clienții care acceptă cererea ta vor apărea aici.</Text>
            </View>
          ) : (
            clients.map((item) => (
              <ClientCard
                key={item.assignment_id}
                item={item}
                token={token}
                onEnd={handleEnd}
                onDetail={(client, profile) => { setDetailClient(client); setDetailProfile(profile); }}
              />
            ))
          )}
          <View style={styles.bottomPadding} />
        </ScrollView>

        <ClientDetailModal
          visible={!!detailClient}
          client={detailClient}
          profile={detailProfile}
          onClose={() => { setDetailClient(null); setDetailProfile(null); }}
        />
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  countBadge: {
    backgroundColor: Colors.primaryDimAlphaLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  countText: { fontSize: 12, color: Colors.primary, fontFamily: Fonts.label },
  scroll: { padding: 20, gap: 16 },
  card: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 10,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryDimAlphaLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.primary,
  },
  clientInfo: { flex: 1, gap: 4 },
  clientName: {
    fontSize: 15,
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
  detailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailText: { fontSize: 13, color: Colors.onSurfaceVariant, fontFamily: Fonts.body },
  actionsRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  createBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 12,
  },
  createBtnText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.background,
  },
  expandBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  expandBtnText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.onSurfaceVariant,
  },
  detailBtn: {
    padding: 4,
  },
  workoutsSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    paddingTop: 10,
    gap: 8,
  },
  workoutRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  workoutRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  workoutName: {
    fontSize: 13,
    fontFamily: Fonts.body,
    color: Colors.textPrimary,
    flex: 1,
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  diffBadgeText: {
    fontSize: 10,
    fontFamily: Fonts.label,
    fontWeight: "700",
  },
  noWorkoutsText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    textAlign: "center",
    paddingVertical: 8,
  },
  endBtn: {
    marginTop: 4,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.error,
    alignItems: "center",
  },
  endBtnText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.error,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: Fonts.body,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  bottomPadding: { height: 110 },
});
