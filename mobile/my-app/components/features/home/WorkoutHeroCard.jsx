import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors, Fonts } from "@/constants/theme";

const { width } = Dimensions.get("window");

export function WorkoutHeroCard({ workout }) {
  const router = useRouter();
  const name = workout?.name || "No Workout Planned";
  const exerciseCount = workout?.exercise_count || 0;

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => {
        if (!workout?.workout_id) return;
        router.push(`/workout/${workout.workout_id}`);
      }}
      style={styles.card}
    >
      <ImageBackground
        source={require("@/assets/images/splashImg.png")}
        style={styles.image}
        resizeMode="cover"
        imageStyle={styles.imageStyle}
      >
        <View style={styles.overlay} />
        <View style={styles.content}>
          <View style={styles.activePill}>
            <View style={styles.dot} />
            <Text style={styles.pillText}>Latest Workout</Text>
          </View>
          <Text style={styles.workoutName}>{name}</Text>
          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Exercises</Text>
              <Text style={styles.metaValue}>{exerciseCount}</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Status</Text>
              <Text style={[styles.metaValue, { color: Colors.secondary }]}>
                Ready
              </Text>
            </View>
            <TouchableOpacity style={styles.playButton}>
              <Ionicons name="play" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: "hidden",
    height: 220,
  },
  image: {
    flex: 1,
    justifyContent: "flex-end",
  },
  imageStyle: {
    borderRadius: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  content: {
    padding: 20,
    gap: 10,
  },
  activePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  pillText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: Colors.primary,
    fontFamily: Fonts.label,
  },
  workoutName: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  metaItem: {
    gap: 2,
  },
  metaLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.label,
    letterSpacing: 1,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    fontFamily: Fonts.body,
  },
  metaDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.borderSubtle,
  },
  playButton: {
    marginLeft: "auto",
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
});
