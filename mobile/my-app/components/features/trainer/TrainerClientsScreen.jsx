import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";
import { useAppFonts } from "@/hooks/useAppFonts";
import { ScreenBackground } from "@/components/ui/ScreenBackground";
import { useAuth } from "@/context/AuthContext";
import { fetchClientsWithDetails, endTrainingWithClient } from "@/services/trainerDashboardService";

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

function ClientCard({ item, onEnd }) {
  const { client, last_session } = item;
  const profile = client.Client_Profile;
  const goal = profile?.main_goal;
  const initials = `${client.first_name?.[0] ?? ""}${client.last_name?.[0] ?? ""}`.toUpperCase();

  const lastSessionText = last_session
    ? new Date(last_session).toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "numeric" })
    : "Nicio sesiune";

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
      </View>

      <View style={styles.detailRow}>
        <Ionicons name="mail-outline" size={14} color={Colors.onSurfaceVariant} />
        <Text style={styles.detailText}>{client.email}</Text>
      </View>
      {client.phone ? (
        <View style={styles.detailRow}>
          <Ionicons name="call-outline" size={14} color={Colors.onSurfaceVariant} />
          <Text style={styles.detailText}>{client.phone}</Text>
        </View>
      ) : null}
      <View style={styles.detailRow}>
        <Ionicons name="time-outline" size={14} color={Colors.onSurfaceVariant} />
        <Text style={styles.detailText}>Ultima sesiune: {lastSessionText}</Text>
      </View>

      <TouchableOpacity style={styles.endBtn} onPress={() => onEnd(client.user_id, `${client.first_name} ${client.last_name}`)}>
        <Text style={styles.endBtnText}>Încheie Colaborarea</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function TrainerClientsScreen() {
  const fontsLoaded = useAppFonts();
  const { token } = useAuth();
  const [clients, setClients] = useState([]);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchClientsWithDetails(token);
      setClients(data);
    } catch {
      /* silent */
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

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
              <ClientCard key={item.assignment_id} item={item} onEnd={handleEnd} />
            ))
          )}
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
