import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";
import { ExerciseRow } from "./ExerciseRow";
import { AddExerciseSheet } from "./AddExerciseSheet";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

const DIFFICULTIES = [
  { key: "beginner", label: "Beginner", icon: "leaf-outline", color: Colors.primary },
  { key: "intermediate", label: "Intermediate", icon: "flash-outline", color: Colors.tertiary },
  { key: "advanced", label: "Advanced", icon: "flame-outline", color: Colors.error },
];

export default function EditWorkoutModal({ visible, workout, token, onClose, onSaved }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("beginner");
  const [exercises, setExercises] = useState([]);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!workout) return;
    setName(workout.name ?? "");
    setDescription(workout.description ?? "");
    setDifficulty(workout.difficulty_level ?? "beginner");
    setError(null);
    setExercises([]);

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
              sets: String(item.sets ?? 3),
              reps: String(item.reps ?? 10),
            })),
          );
        }
      })
      .catch(() => {});
  }, [workout, token]);

  const handleExercisesConfirmed = (selectedExercises) => {
    const merged = selectedExercises.map((ex) => {
      const existing = exercises.find((e) => e.exercise_id === ex.exercise_id);
      return existing ?? { exercise_id: ex.exercise_id, exercise: ex, sets: "3", reps: "10" };
    });
    setExercises(merged);
    setSheetVisible(false);
  };

  const updateExercise = (index, field, value) => {
    setExercises((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex)),
    );
  };

  const removeExercise = (index) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Numele nu poate fi gol.");
      return;
    }
    const invalidEx = exercises.find((ex) => {
      const s = parseInt(ex.sets);
      return isNaN(s) || s <= 0;
    });
    if (invalidEx) {
      setError(`"${invalidEx.exercise.name}" trebuie să aibă minim 1 set.`);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const metaRes = await fetch(`${API_BASE}/workouts/${workout.workout_id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          difficulty_level: difficulty,
        }),
      });
      const metaData = await metaRes.json();
      if (!metaRes.ok) throw new Error(metaData.message ?? "Eroare la salvare.");

      await fetch(`${API_BASE}/workouts/${workout.workout_id}/exercises`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          exercises: exercises.map((ex, index) => ({
            exercise_id: ex.exercise_id,
            sets: parseInt(ex.sets) || 3,
            reps: ex.reps || "10",
            order_index: index,
          })),
        }),
      });

      onSaved(metaData);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>EDITEAZĂ WORKOUT</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>NUME</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Numele workout-ului"
              placeholderTextColor={Colors.onSurfaceVariant}
            />

            <Text style={styles.label}>DESCRIERE</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={description}
              onChangeText={setDescription}
              placeholder="Descriere opțională"
              placeholderTextColor={Colors.onSurfaceVariant}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <Text style={styles.label}>DIFICULTATE</Text>
            <View style={styles.diffRow}>
              {DIFFICULTIES.map((d) => {
                const active = difficulty === d.key;
                return (
                  <TouchableOpacity
                    key={d.key}
                    style={[
                      styles.diffChip,
                      active && { borderColor: d.color, backgroundColor: `${d.color}18` },
                    ]}
                    onPress={() => setDifficulty(d.key)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={d.icon} size={14} color={active ? d.color : Colors.onSurfaceVariant} />
                    <Text style={[styles.diffChipText, active && { color: d.color }]}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.exercisesHeader}>
              <Text style={styles.label}>EXERCIȚII {exercises.length > 0 ? `(${exercises.length})` : ""}</Text>
            </View>

            {exercises.map((item, index) => (
              <View key={item.exercise_id} style={styles.exerciseRowWrapper}>
                <ExerciseRow
                  item={item}
                  onChangeSets={(v) => updateExercise(index, "sets", v)}
                  onChangeReps={(v) => updateExercise(index, "reps", v)}
                  onRemove={() => removeExercise(index)}
                />
              </View>
            ))}

            <TouchableOpacity
              style={styles.addExBtn}
              onPress={() => setSheetVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.addExText}>ADAUGĂ EXERCIȚIU</Text>
            </TouchableOpacity>

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={14} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color={Colors.background} />
              ) : (
                <Text style={styles.saveBtnText}>SALVEAZĂ</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <AddExerciseSheet
        visible={sheetVisible}
        token={token}
        currentExercises={exercises}
        onClose={() => setSheetVisible(false)}
        onConfirm={handleExercisesConfirmed}
      />
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
    maxHeight: "92%",
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 2,
    color: Colors.primary,
    fontFamily: Fonts.label,
  },
  body: {
    padding: 24,
  },
  label: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.label,
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.textPrimary,
    fontFamily: Fonts.body,
    fontSize: 15,
    marginBottom: 16,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  diffRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  diffChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  diffChipText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.onSurfaceVariant,
  },
  exercisesHeader: {
    marginBottom: 4,
  },
  exerciseRowWrapper: {
    marginBottom: 10,
  },
  addExBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: Colors.outlineVariant,
    marginBottom: 16,
    marginTop: 4,
  },
  addExText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    fontFamily: Fonts.label,
    color: Colors.onSurfaceVariant,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,115,81,0.08)",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,115,81,0.2)",
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    color: Colors.error,
    fontSize: 13,
    fontFamily: Fonts.body,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
    color: Colors.background,
    fontFamily: Fonts.label,
  },
});
