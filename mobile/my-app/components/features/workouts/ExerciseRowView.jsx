import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";

export function ExerciseRowView({ item }) {
  const repsLabel = item.reps === "failure" ? "failure" : `${item.reps} reps`;

  return (
    <View style={styles.row}>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {item.exercise?.name ?? item.name}
        </Text>
        <Text style={styles.muscle}>
          {item.exercise?.muscle_group ?? item.muscle_group}
        </Text>
      </View>
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{item.sets}</Text>
          <Text style={styles.statLabel}>SETS</Text>
        </View>
        <View style={styles.separator} />
        <View style={styles.stat}>
          {item.reps === "failure" ? (
            <View style={styles.failurePill}>
              <Ionicons name="flame" size={10} color={Colors.background} />
              <Text style={styles.failurePillText}>FAIL</Text>
            </View>
          ) : (
            <Text style={styles.statValue}>{item.reps}</Text>
          )}
          <Text style={styles.statLabel}>REPS</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: Colors.borderSubtle,
    borderRightColor: Colors.borderSubtle,
    borderBottomColor: Colors.borderSubtle,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
    textTransform: "uppercase",
  },
  muscle: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.secondary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stat: {
    alignItems: "center",
    gap: 2,
    minWidth: 32,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.label,
  },
  separator: {
    width: 1,
    height: 28,
    backgroundColor: Colors.borderSubtle,
  },
  failurePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FF4D4D",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  failurePillText: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1,
    fontFamily: Fonts.label,
    color: Colors.background,
  },
});
