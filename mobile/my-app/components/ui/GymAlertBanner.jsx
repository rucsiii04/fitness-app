import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";

export function GymAlertBanner({ message, type = "error" }) {
  if (!message) return null;

  const config = {
    error: {
      title: "GYM ALERT",
      color: Colors.error,
    },
    info: {
      title: "INFO",
      color: Colors.primary,
    },
  };

  const current = config[type];

  return (
    <View style={[styles.container, { backgroundColor: current.color }]}>
      <Ionicons name="warning" size={18} color="white" />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.error,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  title: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: "white",
    fontFamily: Fonts.label,
  },
  text: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    fontFamily: Fonts.body,
  },
});
