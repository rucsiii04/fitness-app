import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Colors, Fonts } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { ScreenBackground } from "@/components/ui/ScreenBackground";
import { ExerciseRow } from "./ExerciseRow";
import { AddExerciseSheet } from "./AddExerciseSheet";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

const DIFFICULTIES = [
  { key: "beginner", label: "BEGINNER" },
  { key: "intermediate", label: "INTER." },
  { key: "advanced", label: "ADVANCED" },
];

export default function CreateWorkoutScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const { clientId, clientName } = useLocalSearchParams();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("beginner");
  const [exercises, setExercises] = useState([]);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleExercisesConfirmed = (selectedExercises) => {
    // Merge: preserve sets/reps for already-added, default for new
    const merged = selectedExercises.map((ex) => {
      const existing = exercises.find((e) => e.exercise_id === ex.exercise_id);
      return existing ?? { exercise_id: ex.exercise_id, exercise: ex, sets: "3", reps: "10" };
    });
    setExercises(merged);
    setSheetVisible(false);
  };

  const updateExercise = (index, field, value) => {
    setExercises((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, [field]: value } : ex))
    );
  };

  const removeExercise = (index) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Missing name", "Please enter a workout name.");
      return;
    }
    setSaving(true);
    try {
      // 1. Create workout
      const workoutRes = await fetch(`${API_BASE}/workouts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          difficulty_level: difficulty,
          is_public: false,
          ...(clientId ? { assigned_to_user_id: Number(clientId) } : {}),
        }),
      });
      const workout = await workoutRes.json();
      if (!workoutRes.ok) {
        Alert.alert("Error", workout.message || "Failed to create workout.");
        return;
      }

      // 2. Add exercises if any
      if (exercises.length > 0) {
        const exercisesPayload = exercises.map((ex, index) => ({
          exercise_id: ex.exercise_id,
          sets: parseInt(ex.sets) || 3,
          reps: ex.reps || "10",
          order_index: index,
        }));
        await fetch(`${API_BASE}/workouts/${workout.workout_id}/exercises`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ exercises: exercisesPayload }),
        });
      }

      router.back();
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenBackground>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{clientName ? `PENTRU ${clientName.toUpperCase().split(" ")[0]}` : "NEW WORKOUT"}</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={styles.headerBtn}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.saveText}>SAVE</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Client banner */}
          {clientName ? (
            <View style={styles.clientBanner}>
              <Ionicons name="person-circle-outline" size={16} color={Colors.secondary} />
              <Text style={styles.clientBannerText}>Antrenament pentru {clientName}</Text>
            </View>
          ) : null}

          {/* Name */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>WORKOUT NAME</Text>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="e.g. UPPER BODY PUSH"
              placeholderTextColor={Colors.outlineVariant}
              returnKeyType="next"
            />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>DESCRIPTION</Text>
            <TextInput
              style={styles.descInput}
              value={description}
              onChangeText={setDescription}
              placeholder="What's the focus of this session..."
              placeholderTextColor={Colors.outlineVariant}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Difficulty */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>DIFFICULTY</Text>
            <View style={styles.diffRow}>
              {DIFFICULTIES.map((d) => (
                <TouchableOpacity
                  key={d.key}
                  style={[styles.diffBtn, difficulty === d.key && styles.diffBtnActive]}
                  onPress={() => setDifficulty(d.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.diffLabel, difficulty === d.key && styles.diffLabelActive]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Exercises */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>EXERCISES</Text>
            {exercises.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{exercises.length} ADDED</Text>
              </View>
            )}
          </View>

          {exercises.map((item, index) => (
            <ExerciseRow
              key={item.exercise_id}
              item={item}
              onChangeSets={(v) => updateExercise(index, "sets", v)}
              onChangeReps={(v) => updateExercise(index, "reps", v)}
              onRemove={() => removeExercise(index)}
            />
          ))}

          {/* Add exercise button */}
          <TouchableOpacity
            style={styles.addExBtn}
            onPress={() => setSheetVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={22} color={Colors.primary} />
            <Text style={styles.addExText}>ADD EXERCISE</Text>
          </TouchableOpacity>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Bottom save button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.launchBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.9}
          >
            <Text style={styles.launchText}>SAVE WORKOUT</Text>
            <Ionicons name="flash" size={18} color={Colors.background} />
          </TouchableOpacity>
        </View>

        <AddExerciseSheet
          visible={sheetVisible}
          token={token}
          currentExercises={exercises}
          onClose={() => setSheetVisible(false)}
          onConfirm={handleExercisesConfirmed}
        />
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  clientBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,227,253,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,227,253,0.2)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  clientBannerText: {
    fontSize: 13,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.secondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  headerBtn: { padding: 4, minWidth: 48, alignItems: "center" },
  headerTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
    fontFamily: Fonts.label,
    color: Colors.primary,
  },
  saveText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    fontFamily: Fonts.label,
    color: Colors.primary,
  },

  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 20,
  },
  field: { gap: 8 },
  fieldLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: Colors.secondary,
    fontFamily: Fonts.label,
    opacity: 0.85,
  },
  nameInput: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  descInput: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    fontFamily: Fonts.body,
    color: Colors.textPrimary,
    minHeight: 90,
  },
  diffRow: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  diffBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: "center",
  },
  diffBtnActive: {
    backgroundColor: Colors.surfaceContainerHighest,
  },
  diffLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    fontFamily: Fonts.label,
    color: Colors.onSurfaceVariant,
  },
  diffLabelActive: {
    color: Colors.textPrimary,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  countBadge: {
    backgroundColor: "rgba(0,227,253,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,227,253,0.2)",
  },
  countText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: Colors.secondary,
    fontFamily: Fonts.label,
  },

  addExBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 20,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: Colors.outlineVariant,
  },
  addExText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    fontFamily: Fonts.label,
    color: Colors.onSurfaceVariant,
  },

  bottomBar: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
  },
  launchBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  launchText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
    fontFamily: Fonts.label,
    color: Colors.background,
  },
});
