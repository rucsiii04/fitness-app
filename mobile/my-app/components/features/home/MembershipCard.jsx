import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors, Fonts } from "@/constants/theme";

export function MembershipCard({ membership }) {
  const router = useRouter();

  if (!membership) {
    return (
      <TouchableOpacity
        style={[styles.card, styles.emptyCard]}
        onPress={() => router.push("/(tabs)/gym")}
        activeOpacity={0.85}
      >
        <View style={styles.emptyIconRow}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="card-outline" size={22} color={Colors.onSurfaceVariant} />
          </View>
          <View style={styles.emptyArrow}>
            <Ionicons name="arrow-forward" size={16} color={Colors.background} />
          </View>
        </View>
        <View style={styles.emptyBody}>
          <Text style={styles.emptyTitle}>Niciun abonament activ</Text>
          <Text style={styles.emptySubtitle}>
            Descoperă sălile disponibile și alege un abonament potrivit pentru tine.
          </Text>
        </View>
        <View style={styles.emptyFooter}>
          <Ionicons name="location-outline" size={13} color={Colors.onSurfaceVariant} />
          <Text style={styles.emptyFooterText}>Vezi sălile disponibile</Text>
        </View>
      </TouchableOpacity>
    );
  }
  const validUntil = membership?.end_date
    ? new Date(membership.end_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  const tierName = membership?.type_name || "Standard";
  const gymName = membership?.gym_name || "—";
  const status = membership?.status;
  const badgeStyle =
    status === "active" ? styles.badgeActive
    : status === "paused" ? styles.badgePaused
    : styles.badgeInactive;
  const badgeTextStyle =
    status === "active" ? styles.badgeTextActive
    : status === "paused" ? styles.badgeTextPaused
    : styles.badgeTextInactive;
  const badgeLabel =
    status === "active" ? "Activ"
    : status === "paused" ? "Pauzat"
    : "Inactiv";

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.iconBox}>
          <Ionicons name="diamond-outline" size={22} color={Colors.background} />
        </View>
        <View style={[styles.badge, badgeStyle]}>
          <Text style={[styles.badgeText, badgeTextStyle]}>
            {badgeLabel}
          </Text>
        </View>
      </View>

      <View style={styles.middle}>
        <Text style={styles.sectionLabel}>Tip Abonament</Text>
        <Text style={styles.tierName}>{tierName}</Text>
        <Text style={styles.sectionLabel}>Sala Principală</Text>
        <Text style={styles.gymName}>{gymName}</Text>
      </View>

      <View style={styles.footer}>
        <View>
          <Text style={styles.validLabel}>Valabil până la</Text>
          <Text style={styles.validDate}>{validUntil}</Text>
        </View>
        <Ionicons name="wifi-outline" size={22} color={Colors.outlineVariant} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 20,
    justifyContent: "space-between",
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeActive: {
    backgroundColor: "rgba(209,255,0,0.08)",
    borderColor: "rgba(209,255,0,0.25)",
  },
  badgePaused: {
    backgroundColor: "rgba(255,238,171,0.12)",
    borderColor: "rgba(255,238,171,0.35)",
  },
  badgeInactive: {
    backgroundColor: "rgba(255,115,81,0.08)",
    borderColor: "rgba(255,115,81,0.25)",
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    fontFamily: Fonts.label,
  },
  badgeTextActive: { color: Colors.primary },
  badgeTextPaused: { color: Colors.tertiary ?? "#FFEEAB" },
  badgeTextInactive: { color: Colors.error },
  middle: {
    gap: 4,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.label,
    marginTop: 8,
  },
  tierName: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  gymName: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: Fonts.body,
    color: Colors.textPrimary,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  validLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.label,
    letterSpacing: 1,
  },
  validDate: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
    fontFamily: Fonts.body,
  },

  emptyCard: {
    borderStyle: "dashed",
    borderColor: Colors.borderSubtle,
    gap: 14,
  },
  emptyIconRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  emptyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyBody: {
    gap: 6,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
    lineHeight: 19,
  },
  emptyFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  emptyFooterText: {
    fontSize: 11,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
});