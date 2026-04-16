import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { Colors, Fonts } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { ScreenBackground } from "@/components/ui/ScreenBackground";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

const formatDate = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const STATUS_CONFIG = {
  active:  { label: "Active",  color: Colors.primary,    bg: "rgba(209,255,0,0.12)" },
  paused:  { label: "Paused",  color: Colors.tertiary,   bg: "rgba(255,238,171,0.12)" },
  expired: { label: "Expired", color: Colors.onSurfaceVariant, bg: Colors.surfaceContainerHigh },
  cancelled:{ label: "Cancelled", color: Colors.error,  bg: "rgba(255,115,81,0.1)" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.expired;
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function FreezeDaysModal({ visible, maxDays, onConfirm, onClose }) {
  const [days, setDays] = useState("");

  const handleConfirm = () => {
    const n = parseInt(days, 10);
    if (!n || n < 1 || n > maxDays) {
      Alert.alert("Invalid", `Enter a number between 1 and ${maxDays}.`);
      return;
    }
    onConfirm(n);
    setDays("");
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="snow-outline" size={18} color={Colors.secondary} />
            </View>
            <Text style={styles.modalTitle}>Freeze Membership</Text>
          </View>
          <Text style={styles.modalBody}>
            You have <Text style={styles.modalHighlight}>{maxDays} freeze days</Text> remaining.
            How many days would you like to pause?
          </Text>
          <TextInput
            style={styles.modalInput}
            value={days}
            onChangeText={setDays}
            keyboardType="number-pad"
            placeholder={`1 – ${maxDays}`}
            placeholderTextColor={Colors.textMuted}
            maxLength={3}
          />
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancel} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalConfirm} onPress={handleConfirm} activeOpacity={0.85}>
              <Text style={styles.modalConfirmText}>Freeze</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function HistoryItem({ item }) {
  const type = item.Membership_Type;
  const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.expired;
  return (
    <View style={styles.historyItem}>
      <View style={[styles.historyDot, { backgroundColor: cfg.color }]} />
      <View style={styles.historyBody}>
        <Text style={styles.historyName}>{type?.name ?? "Membership"}</Text>
        <Text style={styles.historyDates}>
          {formatDate(item.start_date)} — {formatDate(item.end_date)}
        </Text>
      </View>
      <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
        <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
    </View>
  );
}

export default function MembershipScreen() {
  const { token } = useAuth();
  const router = useRouter();

  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [freezeVisible, setFreezeVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const authHeader = { Authorization: `Bearer ${token}` };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [token])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [currentRes, historyRes] = await Promise.all([
        fetch(`${API_BASE}/memberships/me/current`, { headers: authHeader }),
        fetch(`${API_BASE}/memberships/me/history`, { headers: authHeader }),
      ]);

      if (currentRes.ok) {
        const data = await currentRes.json();
        setCurrent(data);
      } else {
        setCurrent(null);
      }

      if (historyRes.ok) {
        const data = await historyRes.json();
        // Show past entries — exclude the current active/paused one
        setHistory(Array.isArray(data) ? data.filter((m) => m.status === "expired" || m.status === "cancelled") : []);
      }
    } catch (err) {
      console.error("Load membership error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFreeze = async (days) => {
    setFreezeVisible(false);
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/memberships/me/pause`, {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ pause_days: days }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCurrent(data);
    } catch (err) {
      Alert.alert("Error", err.message ?? "Could not freeze membership.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = () => {
    Alert.alert(
      "Resume Membership",
      "Resume your membership now? Unused freeze days will be returned.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Resume",
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await fetch(`${API_BASE}/memberships/me/resume`, {
                method: "POST",
                headers: authHeader,
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.message);
              setCurrent(data);
            } catch (err) {
              Alert.alert("Error", err.message ?? "Could not resume membership.");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const type = current?.Membership_Type;
  const gym  = type?.Gym;

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Membership</Text>
          <View style={{ width: 36 }} />
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Current Membership Card ───────────────────────────────── */}
            {current ? (
              <View style={styles.currentCard}>
                {/* background glow */}
                <View style={styles.cardGlow} pointerEvents="none" />

                <View style={styles.cardTop}>
                  <View style={styles.cardTopLeft}>
                    <StatusBadge status={current.status} />
                    <Text style={styles.planName}>{type?.name ?? "Membership"}</Text>
                    <Text style={styles.gymName}>{gym?.name ?? "—"}</Text>
                  </View>
                  <View style={styles.cardFitnessIcon}>
                    <Ionicons name="barbell-outline" size={40} color={Colors.primary} style={{ opacity: 0.15 }} />
                  </View>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.cardDates}>
                  <View style={styles.cardDateItem}>
                    <Text style={styles.cardDateLabel}>Start Date</Text>
                    <Text style={styles.cardDateValue}>{formatDate(current.start_date)}</Text>
                  </View>
                  <View style={styles.cardDateItem}>
                    <Text style={styles.cardDateLabel}>
                      {current.status === "paused" ? "Paused Until" : "Renewal Date"}
                    </Text>
                    <Text style={styles.cardDateValue}>
                      {current.status === "paused"
                        ? formatDate(current.pause_end_date)
                        : formatDate(current.end_date)}
                    </Text>
                  </View>
                </View>

                {/* Freeze info row */}
                {current.status === "active" && (
                  <View style={styles.freezeInfo}>
                    <Ionicons name="snow-outline" size={14} color={Colors.secondary} />
                    <Text style={styles.freezeInfoText}>
                      <Text style={styles.freezeInfoNum}>{current.remaining_freeze_days}</Text>
                      {" "}freeze days remaining
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.noMembershipCard}>
                <Ionicons name="card-outline" size={36} color={Colors.outlineVariant} />
                <Text style={styles.noMembershipTitle}>No Active Membership</Text>
                <Text style={styles.noMembershipSub}>
                  Visit the gym reception to get a membership plan.
                </Text>
              </View>
            )}

            {/* ── Actions ──────────────────────────────────────────────── */}
            {current && (
              <View style={styles.actionsRow}>
                {current.status === "active" && (
                  <TouchableOpacity
                    style={[styles.actionCard, styles.actionCardSecondary]}
                    onPress={() => setFreezeVisible(true)}
                    disabled={actionLoading || current.remaining_freeze_days < 1}
                    activeOpacity={0.8}
                  >
                    <View style={styles.actionTop}>
                      <Ionicons name="snow-outline" size={24} color={Colors.secondary} />
                      <Text style={styles.actionNum}>{current.remaining_freeze_days}</Text>
                    </View>
                    <Text style={styles.actionTitle}>Freeze</Text>
                    <Text style={styles.actionSub}>days left this month</Text>
                  </TouchableOpacity>
                )}

                {current.status === "paused" && (
                  <TouchableOpacity
                    style={[styles.actionCard, styles.actionCardPrimary]}
                    onPress={handleResume}
                    disabled={actionLoading}
                    activeOpacity={0.85}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color={Colors.background} />
                    ) : (
                      <>
                        <View style={styles.actionTop}>
                          <Ionicons name="play-circle-outline" size={24} color={Colors.background} />
                          <Ionicons name="arrow-forward" size={18} color={Colors.background} />
                        </View>
                        <Text style={[styles.actionTitle, { color: Colors.background }]}>Resume</Text>
                        <Text style={[styles.actionSub, { color: "rgba(14,14,14,0.6)" }]}>
                          reactivate now
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {/* includes_group_classes info tile */}
                <View style={[styles.actionCard, styles.actionCardInfo]}>
                  <View style={styles.actionTop}>
                    <Ionicons
                      name={type?.includes_group_classes ? "people-outline" : "person-outline"}
                      size={24}
                      color={type?.includes_group_classes ? Colors.primary : Colors.outlineVariant}
                    />
                  </View>
                  <Text style={styles.actionTitle}>Classes</Text>
                  <Text style={styles.actionSub}>
                    {type?.includes_group_classes ? "included" : "not included"}
                  </Text>
                </View>
              </View>
            )}

            {/* ── History ──────────────────────────────────────────────── */}
            {history.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>History</Text>
                  <Ionicons name="time-outline" size={16} color={Colors.outlineVariant} />
                </View>
                <View style={styles.historyCard}>
                  {history.map((item, i) => (
                    <React.Fragment key={item.membership_id}>
                      {i > 0 && <View style={styles.historyDivider} />}
                      <HistoryItem item={item} />
                    </React.Fragment>
                  ))}
                </View>
              </>
            )}

            <View style={{ height: 100 }} />
          </ScrollView>
        )}
      </SafeAreaView>

      <FreezeDaysModal
        visible={freezeVisible}
        maxDays={current?.remaining_freeze_days ?? 0}
        onConfirm={handleFreeze}
        onClose={() => setFreezeVisible(false)}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: Fonts.headline,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },

  scroll: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 16,
  },

  // ── Current card ──────────────────────────────────────────────────────────
  currentCard: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.primaryDimAlpha,
    overflow: "hidden",
    gap: 0,
  },
  cardGlow: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.primary,
    opacity: 0.06,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  cardTopLeft: { gap: 6 },
  cardFitnessIcon: { marginTop: -4 },
  planName: {
    fontSize: 32,
    fontFamily: Fonts.headline,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: -1,
    fontStyle: "italic",
  },
  gymName: {
    fontSize: 12,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.secondary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 99,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: Fonts.label,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginBottom: 20,
  },
  cardDates: {
    flexDirection: "row",
    gap: 32,
  },
  cardDateItem: { gap: 4 },
  cardDateLabel: {
    fontSize: 9,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.onSurfaceVariant,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  cardDateValue: {
    fontSize: 15,
    fontFamily: Fonts.headline,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  freezeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  freezeInfoText: {
    fontSize: 12,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
  },
  freezeInfoNum: {
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.secondary,
  },

  // ── No membership ─────────────────────────────────────────────────────────
  noMembershipCard: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  noMembershipTitle: {
    fontSize: 18,
    fontFamily: Fonts.headline,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  noMembershipSub: {
    fontSize: 13,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 20,
  },

  // ── Actions row ───────────────────────────────────────────────────────────
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    gap: 2,
    justifyContent: "space-between",
    minHeight: 130,
  },
  actionCardSecondary: {
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  actionCardPrimary: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  actionCardInfo: {
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  actionTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  actionNum: {
    fontSize: 22,
    fontFamily: Fonts.headline,
    fontWeight: "700",
    color: Colors.secondary,
  },
  actionTitle: {
    fontSize: 14,
    fontFamily: Fonts.headline,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  actionSub: {
    fontSize: 9,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.onSurfaceVariant,
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  // ── Section header ────────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.onSurfaceVariant,
    letterSpacing: 3,
    textTransform: "uppercase",
  },

  // ── History ───────────────────────────────────────────────────────────────
  historyCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  historyBody: { flex: 1, gap: 3 },
  historyName: {
    fontSize: 14,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  historyDates: {
    fontSize: 11,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
  },
  historyDivider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginHorizontal: 16,
  },

  // ── Freeze modal ──────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(0,227,253,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: Fonts.headline,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  modalBody: {
    fontSize: 13,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
    lineHeight: 20,
  },
  modalHighlight: {
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.secondary,
  },
  modalInput: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontFamily: Fonts.headline,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 13,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  modalConfirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  modalConfirmText: {
    fontSize: 13,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.background,
    letterSpacing: 0.5,
  },
});
