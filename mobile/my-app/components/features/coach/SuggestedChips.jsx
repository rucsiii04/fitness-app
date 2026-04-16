import React from "react";
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";

const DEFAULT_CHIPS = [
  { label: "Leg day routine", icon: "barbell-outline" },
  { label: "Fat loss circuit", icon: "flame-outline" },
  { label: "Upper body strength", icon: "fitness-outline" },
  { label: "What should I eat?", icon: "nutrition-outline" },
  { label: "Build me a plan", icon: "sparkles-outline" },
];

export function SuggestedChips({ chips = DEFAULT_CHIPS, onPress }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {chips.map((chip) => {
        const label = typeof chip === "string" ? chip : chip.label;
        const icon = typeof chip === "string" ? null : chip.icon;
        return (
          <TouchableOpacity
            key={label}
            style={styles.chip}
            onPress={() => onPress(label)}
            activeOpacity={0.75}
          >
            {icon && (
              <Ionicons name={icon} size={12} color={Colors.onSurfaceVariant} />
            )}
            <Text style={styles.chipText}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLow,
  },
  chipText: {
    fontSize: 11,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
});
