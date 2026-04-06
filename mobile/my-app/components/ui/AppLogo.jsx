import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Fonts } from "@/constants/theme";

export function AppLogo() {
  return (
    <View style={styles.row}>
      <Text style={styles.icon}>⚡</Text>
      <Text style={styles.text}>KINETIC</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  icon: {
    fontSize: 22,
    color: Colors.primary,
  },
  text: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: -1,
    fontFamily: Fonts.headline,
  },
});