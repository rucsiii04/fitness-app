import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Colors, Fonts } from "@/constants/theme";
import { useAppFonts } from "@/hooks/useAppFonts";
import { useAuth } from "@/context/AuthContext";
import { useActiveSession } from "@/context/ActiveSessionContext";
import { ScreenBackground } from "@/components/ui/ScreenBackground";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ExerciseHeader } from "./ExerciseHeader";
import { SetTable } from "./SetTable";
import { RestTimer } from "./RestTimer";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

function makeSet(weight = 0, reps = 8) {
  return { weight: String(weight), reps: String(reps), status: "pending" };
}

export default function WorkoutSessionScreen({ resumeSessionId, resumeWorkoutId } = {}) {
  const fontsLoaded = useAppFonts();
  const { token } = useAuth();
  const { setActiveSession } = useActiveSession();
  const router = useRouter();
  const { id: workoutId } = useLocalSearchParams();

  const [exercises, setExercises] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [showRest, setShowRest] = useState(false);
  const [restKey, setRestKey] = useState(0);

  const [setsMap, setSetsMap] = useState({});

  const initExercises = (exs) => {
    const exerciseList = Array.isArray(exs) ? exs : [];
    setExercises(exerciseList);
    const initial = {};
    exerciseList.forEach((_, i) => {
      initial[i] = [makeSet(0, 8), makeSet(0, 8), makeSet(0, 8)];
      if (i === 0) initial[i][0].status = "active";
    });
    setSetsMap(initial);
  };

  useEffect(() => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    const loadExercisesForWorkout = (wId) => {
      if (!wId) return;
      fetch(`${API_BASE}/workouts/${wId}/exercises`, { headers })
        .then((r) => r.json())
        .then(initExercises)
        .catch(console.error);
    };

    if (resumeSessionId) {
      setSessionId(resumeSessionId);
      if (resumeWorkoutId) {
        loadExercisesForWorkout(resumeWorkoutId);
      } else {
        // workoutId not in URL — fetch session to discover it
        fetch(`${API_BASE}/workout-sessions/${resumeSessionId}`, { headers })
          .then((r) => r.json())
          .then((session) => loadExercisesForWorkout(session.workout_id))
          .catch(console.error);
      }
      return;
    }

    // New session from a workout
    loadExercisesForWorkout(workoutId);

    fetch(`${API_BASE}/workout-sessions`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ workout_id: workoutId }),
    })
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setSessionId(data.session_id);
        setActiveSession(data);
      })
      .catch(console.error);
  }, [token, workoutId, resumeSessionId, resumeWorkoutId]);

  const currentExercise = exercises[currentIndex]?.Exercise;
  const currentSets = setsMap[currentIndex] || [];

  const updateSets = (updater) => {
    setSetsMap((prev) => ({
      ...prev,
      [currentIndex]: updater(prev[currentIndex] || []),
    }));
  };

  const handleWeightChange = (i, v) => {
    updateSets((sets) => {
      const updated = [...sets];
      updated[i] = { ...updated[i], weight: v };
      return updated;
    });
  };

  const handleRepsChange = (i, v) => {
    updateSets((sets) => {
      const updated = [...sets];
      updated[i] = { ...updated[i], reps: v };
      return updated;
    });
  };

  const handleCompleteSet = async (setIndex) => {
    const set = currentSets[setIndex];
    if (!set || set.status === "completed") return;

    if (sessionId && currentExercise) {
      try {
        await fetch(`${API_BASE}/workout-sessions/${sessionId}/logs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            exercise_id: currentExercise.exercise_id,
            reps: Number(set.reps),
            weight: Number(set.weight),
          }),
        });
      } catch (err) {
        console.error(err);
      }
    }

    updateSets((sets) => {
      const updated = [...sets];
      updated[setIndex] = { ...updated[setIndex], status: "completed" };
      if (setIndex + 1 < updated.length) {
        updated[setIndex + 1] = { ...updated[setIndex + 1], status: "active" };
      }
      return updated;
    });

    const allDone = currentSets.every((s, i) =>
      i === setIndex ? true : s.status === "completed",
    );

    if (allDone) {
      if (currentIndex + 1 < exercises.length) {
        setShowRest(true);
        setRestKey((k) => k + 1);
      }
    } else {
      setShowRest(true);
      setRestKey((k) => k + 1);
    }
  };

  const handleAddSet = () => {
    updateSets((sets) => {
      const last = sets[sets.length - 1];
      const newSet = makeSet(last?.weight || 0, last?.reps || 8);
      const allCompleted = sets.every((s) => s.status === "completed");
      if (allCompleted) newSet.status = "active";
      return [...sets, newSet];
    });
  };

  const handleSkipRest = () => {
    setShowRest(false);
  };

  const handleNextExercise = () => {
    setShowRest(false);
    if (currentIndex + 1 < exercises.length) {
      const nextIndex = currentIndex + 1;
      setSetsMap((prev) => {
        const nextSets = [...(prev[nextIndex] || [])];
        if (nextSets.length > 0) nextSets[0] = { ...nextSets[0], status: "active" };
        return { ...prev, [nextIndex]: nextSets };
      });
      setCurrentIndex(nextIndex);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    Alert.alert("Finish Workout", "Are you sure you want to finish?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Finish",
        style: "destructive",
        onPress: async () => {
          if (sessionId) {
            await fetch(`${API_BASE}/workout-sessions/${sessionId}/finish`, {
              method: "PUT",
              headers: { Authorization: `Bearer ${token}` },
            }).catch(console.error);
          }
          setActiveSession(null);
          router.back();
        },
      },
    ]);
  };

  if (!fontsLoaded) return null;

  return (
    <ScreenBackground>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>WORKOUT SESSION</Text>
          <TouchableOpacity onPress={handleFinish}>
            <Text style={styles.finishText}>Finish</Text>
          </TouchableOpacity>
        </View>

        {exercises.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pills}
          >
            {exercises.map((ex, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.pill, i === currentIndex && styles.pillActive]}
                onPress={() => setCurrentIndex(i)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.pillText,
                    i === currentIndex && styles.pillTextActive,
                  ]}
                >
                  {ex.Exercise?.name || `Exercise ${i + 1}`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ExerciseHeader exercise={currentExercise} />

          <SetTable
            sets={currentSets}
            onWeightChange={handleWeightChange}
            onRepsChange={handleRepsChange}
            onCompleteSet={handleCompleteSet}
            onAddSet={handleAddSet}
          />

          <View style={{ height: 120 }} />
        </ScrollView>

        {showRest && (
          <RestTimer key={restKey} onSkip={handleSkipRest} onFinish={handleSkipRest} />
        )}
        <View style={styles.bottomBar}>
          <PrimaryButton
            label="Log Set"
            onPress={() => {
              const activeIndex = currentSets.findIndex(
                (s) => s.status === "active",
              );
              if (activeIndex !== -1) handleCompleteSet(activeIndex);
            }}
            style={styles.logBtn}
          />
          <TouchableOpacity style={styles.nextBtn} onPress={handleNextExercise} activeOpacity={0.8}>
            <Text style={styles.nextBtnText}>Next</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  finishText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.error,
  },
  pills: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: Colors.primaryDim,
    borderColor: Colors.primaryDim,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.onSurfaceVariant,
  },
  pillTextActive: {
    color: Colors.background,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    backgroundColor: Colors.background,
  },
  logBtn: {
    flex: 1,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  nextBtnText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.primary,
    letterSpacing: 1,
  },
});
