import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";

export function MembershipCard({ membership }) {
  const validUntil = membership?.end_date
    ? new Date(membership.end_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  const tierName = membership?.type_name || "Standard";
  const gymName = membership?.gym_name || "—";
  const isActive = membership?.status === "active";

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.iconBox}>
          <Ionicons name="diamond-outline" size={22} color={Colors.background} />
        </View>
        <View style={[styles.badge, isActive ? styles.badgeActive : styles.badgeInactive]}>
          <Text style={[styles.badgeText, isActive ? styles.badgeTextActive : styles.badgeTextInactive]}>
            {isActive ? "Active" : "Inactive"}
          </Text>
        </View>
      </View>

      <View style={styles.middle}>
        <Text style={styles.sectionLabel}>Membership Tier</Text>
        <Text style={styles.tierName}>{tierName}</Text>
        <Text style={styles.sectionLabel}>Primary Club</Text>
        <Text style={styles.gymName}>{gymName}</Text>
      </View>

      <View style={styles.footer}>
        <View>
          <Text style={styles.validLabel}>Valid Until</Text>
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
});