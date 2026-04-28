import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";
import { ExerciseRowView } from "./ExerciseRowView";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

const DIFFICULTY = {
  beginner: { label: "Beginner", color: Colors.primary, icon: "leaf-outline" },
  intermediate: {
    label: "Intermediate",
    color: Colors.tertiary,
    icon: "flash-outline",
  },
  advanced: { label: "Advanced", color: Colors.error, icon: "flame-outline" },
};

function DifficultyBadge({ level }) {
  const d = DIFFICULTY[level] ?? DIFFICULTY.beginner;
  return (
    <View style={[styles.badge, { borderColor: d.color }]}>
      <Ionicons name={d.icon} size={11} color={d.color} />
      <Text style={[styles.badgeText, { color: d.color }]}>{d.label}</Text>
    </View>
  );
}

export default function PublicWorkoutDetailModal({
  visible,
  workout,
  token,
  onClose,
  onSaved,
  alreadySaved = false,
}) {
  const { bottom } = useSafeAreaInsets();

  const [exercises, setExercises] = useState([]);
  const [loadingEx, setLoadingEx] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!workout) return;
    setSaved(alreadySaved);
    setExercises([]);
    setLoadingEx(true);
    fetch(`${API_BASE}/workouts/${workout.workout_id}/exercises`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setExercises(
            data.map((item) => ({
              exercise_id: item.exercise_id,
              exercise: item.Exercise,
              sets: item.sets,
              reps: item.reps,
            })),
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoadingEx(false));
  }, [workout, token]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(
        `${API_BASE}/workouts/${workout.workout_id}/copy`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok || res.status === 409) {
        setSaved(true);
        if (res.ok) onSaved?.();
      }
    } catch {
    } finally {
      setSaving(false);
    }
  };

  if (!workout) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: bottom + 16 }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <DifficultyBadge level={workout.difficulty_level} />
              {workout.creator_name && (
                <View style={styles.creatorRow}>
                  <Ionicons
                    name="person-outline"
                    size={11}
                    color={Colors.secondary}
                  />
                  <Text style={styles.creatorText}>{workout.creator_name}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons
                name="close"
                size={22}
                color={Colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {workout.name}
          </Text>

          <ScrollView
            style={styles.body}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.bodyContent}
          >
            {workout.description ? (
              <Text style={styles.description}>{workout.description}</Text>
            ) : null}

            <Text style={styles.sectionLabel}>
              EXERCISES {exercises.length > 0 ? `(${exercises.length})` : ""}
            </Text>

            {loadingEx ? (
              <ActivityIndicator
                color={Colors.primary}
                style={{ marginTop: 16 }}
              />
            ) : exercises.length === 0 ? (
              <Text style={styles.emptyEx}>No exercises added yet.</Text>
            ) : (
              <View style={styles.exerciseList}>
                {exercises.map((item) => (
                  <ExerciseRowView key={item.exercise_id} item={item} />
                ))}
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveBtn, (saving || saved) && styles.btnMuted]}
              onPress={handleSave}
              disabled={saving || saved}
              activeOpacity={0.8}
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
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    backgroundColor: Colors.surfaceContainerLow,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    maxHeight: "88%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.outlineVariant,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
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
    fontSize: 26,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  description: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.body,
    lineHeight: 20,
    marginBottom: 20,
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.label,
    marginBottom: 10,
  },
  exerciseList: {
    gap: 10,
  },
  emptyEx: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.body,
    marginTop: 8,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  saveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: Colors.primary,
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    fontFamily: Fonts.label,
    color: Colors.background,
  },
  btnMuted: {
    opacity: 0.5,
  },
});
