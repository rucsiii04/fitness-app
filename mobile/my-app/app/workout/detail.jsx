import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { ScreenBackground } from "@/components/ui/ScreenBackground";
import { ExerciseRowView } from "@/components/features/workouts/ExerciseRowView";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

const DIFFICULTY = {
  beginner: { label: "Beginner", color: Colors.primary, icon: "leaf-outline" },
  intermediate: { label: "Intermediate", color: Colors.tertiary, icon: "flash-outline" },
  advanced: { label: "Advanced", color: Colors.error, icon: "flame-outline" },
};

export default function WorkoutDetailScreen() {
  const { id, saved: savedParam } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuth();

  const [workout, setWorkout] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(savedParam === "true");

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`${API_BASE}/workouts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(`${API_BASE}/workouts/${id}/exercises`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ])
      .then(([workoutData, exerciseData]) => {
        setWorkout(workoutData);
        if (Array.isArray(exerciseData)) {
          setExercises(
            exerciseData.map((item) => ({
              exercise_id: item.exercise_id,
              exercise: item.Exercise,
              sets: item.sets,
              reps: item.reps,
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, token]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/workouts/${id}/copy`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok || res.status === 409) {
        setSaved(true);
      }
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const diff = workout ? (DIFFICULTY[workout.difficulty_level] ?? DIFFICULTY.beginner) : null;

  return (
    <ScreenBackground>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerLabel}>WORKOUT DETAILS</Text>
          <View style={{ width: 34 }} />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : !workout ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>Workout not found.</Text>
          </View>
        ) : (
          <>
            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={[styles.accentBar, { backgroundColor: diff.color }]} />

              <View style={styles.meta}>
                <View style={[styles.diffBadge, { borderColor: diff.color }]}>
                  <Ionicons name={diff.icon} size={11} color={diff.color} />
                  <Text style={[styles.diffBadgeText, { color: diff.color }]}>
                    {diff.label}
                  </Text>
                </View>
                {workout.creator_name && (
                  <View style={styles.creatorRow}>
                    <Ionicons name="person-outline" size={11} color={Colors.secondary} />
                    <Text style={styles.creatorText}>{workout.creator_name}</Text>
                  </View>
                )}
              </View>

              <Text style={styles.title}>{workout.name}</Text>

              {workout.description ? (
                <Text style={styles.description}>{workout.description}</Text>
              ) : null}

              <Text style={styles.sectionLabel}>
                EXERCISES{exercises.length > 0 ? ` (${exercises.length})` : ""}
              </Text>

              {exercises.length === 0 ? (
                <Text style={styles.emptyText}>No exercises added yet.</Text>
              ) : (
                <View style={styles.exerciseList}>
                  {exercises.map((item) => (
                    <ExerciseRowView key={String(item.exercise_id)} item={item} />
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.saveBtn, (saving || saved) && styles.saveBtnDone]}
                onPress={handleSave}
                disabled={saving || saved}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={Colors.background} />
                ) : (
                  <>
                    <Ionicons
                      name={saved ? "checkmark-circle" : "bookmark-outline"}
                      size={18}
                      color={Colors.background}
                    />
                    <Text style={styles.saveBtnText}>
                      {saved ? "SAVED TO MY WORKOUTS" : "SAVE TO MY WORKOUTS"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  backBtn: { padding: 4 },
  headerLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    fontFamily: Fonts.label,
    color: Colors.onSurfaceVariant,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.body,
  },
  body: { flex: 1 },
  bodyContent: {
    padding: 24,
    paddingBottom: 16,
    gap: 12,
  },
  accentBar: {
    height: 3,
    borderRadius: 2,
    width: 40,
    marginBottom: 4,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  diffBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  diffBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    fontFamily: Fonts.label,
  },
  creatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  creatorText: {
    fontSize: 11,
    fontFamily: Fonts.body,
    color: Colors.secondary,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  description: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.body,
    lineHeight: 22,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.label,
    marginTop: 8,
  },
  exerciseList: { gap: 10 },
  emptyText: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.body,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: Colors.primary,
  },
  saveBtnDone: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    fontFamily: Fonts.label,
    color: Colors.background,
  },
});
