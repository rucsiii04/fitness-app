import React from "react";
import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useSegments } from "expo-router";
import { Colors, Fonts } from "@/constants/theme";
import { useActiveSession } from "@/context/ActiveSessionContext";

export function ActiveSessionBanner() {
  const { activeSession } = useActiveSession();
  const router = useRouter();
  const segments = useSegments();

  // Hide when user is already inside a session screen
  const inSession = segments[0] === "session" || segments[0] === "workout";

  if (!activeSession || !activeSession.session_id || inSession) return null;

  const handlePress = () => {
    const workoutParam = activeSession.workout_id
      ? `?workoutId=${activeSession.workout_id}`
      : "";
    router.push(`/session/${activeSession.session_id}${workoutParam}`);
  };

  return (
    <TouchableOpacity
      style={styles.banner}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View style={styles.pulse} />
      <Ionicons name="radio-button-on" size={14} color={Colors.background} />
      <Text style={styles.label}>SESSION IN PROGRESS</Text>
      <Ionicons name="chevron-forward" size={14} color={Colors.background} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    bottom: 98,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.background,
    letterSpacing: 1.5,
  },
});
