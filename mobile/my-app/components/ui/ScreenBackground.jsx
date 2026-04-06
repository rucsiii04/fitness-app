import React from "react";
import { View, StyleSheet } from "react-native";
import { Colors } from "@/constants/theme";

export function ScreenBackground({ children }) {
  return (
    <View style={styles.container}>
      <View style={styles.glowTopRight} />
      <View style={styles.glowBottomLeft} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  glowTopRight: {
    position: "absolute",
    top: -80,
    right: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.primary,
    opacity: 0.04,
  },
  glowBottomLeft: {
    position: "absolute",
    bottom: -80,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: Colors.secondary,
    opacity: 0.04,
  },
});