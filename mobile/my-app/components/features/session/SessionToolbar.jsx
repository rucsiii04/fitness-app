import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";

const TOOLS = [
  { key: "timer", label: "Timer", icon: "timer-outline" },
  { key: "rest", label: "Rest", icon: "hourglass-outline" },
  { key: "finish", label: "Finish", icon: "checkmark-circle-outline" },
];

export function SessionToolbar({ active, onPress }) {
  return (
    <View style={styles.toolbar}>
      {TOOLS.map((tool) => {
        const isActive = active === tool.key;
        return (
          <TouchableOpacity
            key={tool.key}
            style={[styles.toolButton, isActive && styles.toolButtonActive]}
            onPress={() => onPress(tool.key)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={tool.icon}
              size={22}
              color={isActive ? Colors.background : Colors.onSurfaceVariant}
            />
            <Text
              style={[styles.toolLabel, isActive && styles.toolLabelActive]}
            >
              {tool.label.toUpperCase()}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    paddingBottom: 28,
    backgroundColor: "rgba(14,14,14,0.92)",
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  toolButton: {
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
  },
  toolButtonActive: {
    backgroundColor: Colors.primary,
  },
  toolLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    fontFamily: Fonts.label,
    color: Colors.onSurfaceVariant,
  },
  toolLabelActive: {
    color: Colors.background,
  },
});
