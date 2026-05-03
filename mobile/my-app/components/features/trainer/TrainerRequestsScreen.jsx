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
import { useFocusEffect } from "expo-router";
import { Colors, Fonts } from "@/constants/theme";
import { useAppFonts } from "@/hooks/useAppFonts";
import { ScreenBackground } from "@/components/ui/ScreenBackground";
import { useAuth } from "@/context/AuthContext";
import { fetchTrainerInbox, respondToRequest } from "@/services/trainerDashboardService";
import { getSocket } from "@/services/socket";
import { ClientDetailModal } from "./ClientDetailModal";

function timeAgo(ageMs) {
  const ms = Math.max(0, ageMs);
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `acum ${mins} min`;
  const hrs = Math.round(ms / 3600000);
  if (hrs < 24) return `acum ${hrs}h`;
  return `acum ${Math.round(ms / 86400000)}z`;
}

function RequestCard({ request, onRespond, responding, onDetail }) {
  const client = request.Client;
  const initials = `${client?.first_name?.[0] ?? ""}${client?.last_name?.[0] ?? ""}`.toUpperCase();

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{client?.first_name} {client?.last_name}</Text>
          <Text style={styles.timeAgo}>{timeAgo(request.age_ms)}</Text>
        </View>
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingText}>În așteptare</Text>
        </View>
      </View>

      {client?.email ? (
        <View style={styles.detailRow}>
          <Ionicons name="mail-outline" size={14} color={Colors.onSurfaceVariant} />
          <Text style={styles.detailText}>{client.email}</Text>
        </View>
      ) : null}
      {client?.phone ? (
        <View style={styles.detailRow}>
          <Ionicons name="call-outline" size={14} color={Colors.onSurfaceVariant} />
          <Text style={styles.detailText}>{client.phone}</Text>
        </View>
      ) : null}

      <TouchableOpacity style={styles.detailBtn} onPress={() => onDetail(client, client?.Client_Profile)} activeOpacity={0.8}>
        <Ionicons name="person-circle-outline" size={15} color={Colors.primary} />
        <Text style={styles.detailBtnText}>Detalii client</Text>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.acceptBtn}
          onPress={() => onRespond(request.id, "accept")}
          disabled={!!responding}
        >
          {responding === `${request.id}-accept` ? (
            <ActivityIndicator size="small" color={Colors.background} />
          ) : (
            <Text style={styles.acceptBtnText}>Acceptă</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.rejectBtn}
          onPress={() => onRespond(request.id, "reject")}
          disabled={!!responding}
        >
          {responding === `${request.id}-reject` ? (
            <ActivityIndicator size="small" color={Colors.error} />
          ) : (
            <Text style={styles.rejectBtnText}>Respinge</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function TrainerRequestsScreen() {
  const fontsLoaded = useAppFonts();
  const { token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [responding, setResponding] = useState(null);
  const [detailClient, setDetailClient] = useState(null);
  const [detailProfile, setDetailProfile] = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchTrainerInbox(token);
      setRequests(data);
    } catch {
      /* silent */
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  useFocusEffect(
    useCallback(() => {
      const socket = getSocket();
      if (!socket) return;
      const handler = (data) => {
        setRequests((prev) =>
          prev.some((r) => r.id === data.id) ? prev : [data, ...prev]
        );
      };
      socket.on("new_trainer_request", handler);
      return () => socket.off("new_trainer_request", handler);
    }, [])
  );

  const handleRespond = async (requestId, action) => {
    setResponding(`${requestId}-${action}`);
    try {
      await respondToRequest(requestId, action, token);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      Alert.alert("Eroare", err.message);
    } finally {
      setResponding(null);
    }
  };

  if (!fontsLoaded) return null;

  return (
    <ScreenBackground>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Cereri</Text>
          {requests.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{requests.length}</Text>
            </View>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {requests.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="mail-open-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Nicio cerere în așteptare</Text>
              <Text style={styles.emptySubtitle}>Cererile de colaborare vor apărea aici.</Text>
            </View>
          ) : (
            requests.map((r) => (
              <RequestCard
                key={r.id}
                request={r}
                onRespond={handleRespond}
                responding={responding}
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
    backgroundColor: Colors.error + "22",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  countText: { fontSize: 12, color: Colors.error, fontFamily: Fonts.label },
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
  clientInfo: { flex: 1 },
  clientName: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.textPrimary,
  },
  timeAgo: { fontSize: 11, color: Colors.textMuted, fontFamily: Fonts.body, marginTop: 2 },
  pendingBadge: {
    backgroundColor: Colors.tertiary + "22",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  pendingText: { fontSize: 10, color: Colors.tertiaryDim, fontFamily: Fonts.label },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailText: { fontSize: 13, color: Colors.onSurfaceVariant, fontFamily: Fonts.body },
  detailBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.primaryDimAlphaLight,
    alignSelf: "flex-start",
  },
  detailBtnText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.primary,
  },
  actions: { flexDirection: "row", gap: 10, marginTop: 4 },
  acceptBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.background,
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.error,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectBtnText: {
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
