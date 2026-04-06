import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Colors, Fonts } from "@/constants/theme";

export function PrimaryButton({ label, onPress, style }) {
  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.arrow}>→</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    paddingVertical: 20,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 3,
    color: Colors.background,
    textTransform: "uppercase",
    fontFamily: Fonts.label,
  },
  arrow: {
    fontSize: 18,
    color: Colors.background,
    fontWeight: "700",
  },
});