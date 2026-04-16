import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors, Fonts } from "@/constants/theme";

const DEFAULT_REST = 60; 

export function RestTimer({ onSkip, onFinish }) {
  const [seconds, setSeconds] = useState(DEFAULT_REST);

  useEffect(() => {
    if (seconds <= 0) {
      onFinish?.();
      return;
    }
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const mins = Math.floor(seconds / 60);
  const secs = String(seconds % 60).padStart(2, "0");

  return (
    <View style={styles.container}>
      <Text style={styles.time}>{mins}:{secs}</Text>
      <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
        <Text style={styles.skipText}>Skip Rest</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: Colors.surfaceContainerLow,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  time: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.secondary,
    letterSpacing: -1,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  skipText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
});