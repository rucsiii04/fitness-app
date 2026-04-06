import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";

export function StatCard({ label, value, unit, icon, iconColor }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.bottom}>
        <Text style={styles.value}>
          {value}{" "}
          <Text style={styles.unit}>{unit}</Text>
        </Text>
        <Ionicons name={icon} size={28} color={iconColor || Colors.primary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 16,
  },
  label: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.label,
  },
  bottom: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  value: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  unit: {
    fontSize: 13,
    fontWeight: "400",
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.label,
  },
});