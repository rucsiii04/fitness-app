import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Fonts } from "@/constants/theme";

export function ExerciseHeader({ exercise }) {
  return (
    <View style={styles.container}>
      <View style={styles.tag}>
        <Text style={styles.tagText}>Primary Movement</Text>
      </View>
      <Text style={styles.name}>{exercise?.name || "—"}</Text>
      <Text style={styles.muscles}>{exercise?.primary_muscles || "—"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    gap: 8,
  },
  tag: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "rgba(0,227,253,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,227,253,0.2)",
  },
  tagText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: Colors.secondary,
    fontFamily: Fonts.label,
  },
  name: {
    fontSize: 36,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    letterSpacing: -1,
    lineHeight: 38,
    textTransform: "uppercase",
  },
  muscles: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.body,
  },
});
