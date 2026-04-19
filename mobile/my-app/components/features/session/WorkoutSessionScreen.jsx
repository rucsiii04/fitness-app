import React, { useState, useEffect, useRef, useReducer } from "react";
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

function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function buildSetsMapFromLogs(exerciseList, logs) {
  const logsByExId = {};
  for (const log of logs) {
    if (!logsByExId[log.exercise_id]) logsByExId[log.exercise_id] = [];
    logsByExId[log.exercise_id].push(log);
  }

  const map = {};

  exerciseList.forEach((ex, i) => {
    const exId = ex.Exercise?.exercise_id;
    const exLogs = logsByExId[exId] || [];
    const lastLog = exLogs[exLogs.length - 1];

    const sets = exLogs.map((l) => ({
      weight: String(l.weight ?? 0),
      reps: String(l.reps ?? 0),
      status: "completed",
    }));

    const needed = Math.max(3 - sets.length, 0);
    for (let j = 0; j < needed; j++) {
      sets.push(makeSet(lastLog?.weight ?? 0, lastLog?.reps ?? 8));
    }

    map[i] = sets;
  });

  let resumeIndex = exerciseList.length > 0 ? exerciseList.length - 1 : 0;
  for (let i = 0; i < exerciseList.length; i++) {
    if (!map[i].every((s) => s.status === "completed")) {
      resumeIndex = i;
      break;
    }
  }

  const resumeSets = map[resumeIndex] || [];
  const firstPending = resumeSets.findIndex((s) => s.status === "pending");
  if (firstPending !== -1) {
    resumeSets[firstPending] = { ...resumeSets[firstPending], status: "active" };
    map[resumeIndex] = resumeSets;
  }

  return { map, resumeIndex };
}

function buildFreshSetsMap(exerciseList) {
  const map = {};
  exerciseList.forEach((_, i) => {
    map[i] = [makeSet(0, 8), makeSet(0, 8), makeSet(0, 8)];
    if (i === 0) map[i][0].status = "active";
  });
  return map;
}

export default function WorkoutSessionScreen({ resumeSessionId, resumeWorkoutId } = {}) {
  const fontsLoaded = useAppFonts();
  const { token } = useAuth();
  const { setActiveSession, activeSession } = useActiveSession();
  const router = useRouter();
  const { id: workoutId } = useLocalSearchParams();

  const [exercises, setExercises] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [showRest, setShowRest] = useState(false);
  const [restKey, setRestKey] = useState(0);
  const [setsMap, setSetsMap] = useState({});

  const startedAtRef = useRef(
    activeSession?.started_at
      ? new Date(activeSession.started_at).getTime()
      : null
  );
  const [, forceUpdate] = useReducer((n) => n + 1, 0);

  useEffect(() => {
    const id = setInterval(forceUpdate, 1000);
    return () => clearInterval(id);
  }, []);

  const elapsed = startedAtRef.current
    ? Math.floor((Date.now() - startedAtRef.current) / 1000)
    : 0;

  useEffect(() => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    if (resumeSessionId) {
      setSessionId(resumeSessionId);

      (async () => {
        try {
          const sessionRes = await fetch(
            `${API_BASE}/workout-sessions/${resumeSessionId}`,
            { headers }
          );
          if (!sessionRes.ok) return;
          const sessionData = await sessionRes.json();
          if (sessionData.started_at) {
            startedAtRef.current = new Date(sessionData.started_at).getTime();
          }
          setActiveSession(sessionData);

          const wId = resumeWorkoutId || sessionData.workout_id;

          const [exercisesRes, logsRes] = await Promise.all([
            fetch(`${API_BASE}/workouts/${wId}/exercises`, { headers }),
            fetch(`${API_BASE}/workout-sessions/${resumeSessionId}/logs`, { headers }),
          ]);

          const exerciseList = await exercisesRes.json();
          const logList = await logsRes.json();

          const exArr = Array.isArray(exerciseList) ? exerciseList : [];
          const logArr = Array.isArray(logList) ? logList : [];

          setExercises(exArr);

          const { map, resumeIndex } = buildSetsMapFromLogs(exArr, logArr);
          setSetsMap(map);
          setCurrentIndex(resumeIndex);
        } catch (err) {
          console.error(err);
        }
      })();

      return;
    }

    (async () => {
      try {
        const [exercisesRes, sessionRes] = await Promise.all([
          fetch(`${API_BASE}/workouts/${workoutId}/exercises`, { headers }),
          fetch(`${API_BASE}/workout-sessions`, {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({ workout_id: workoutId }),
          }),
        ]);

        const exerciseList = await exercisesRes.json();
        const exArr = Array.isArray(exerciseList) ? exerciseList : [];
        setExercises(exArr);
        setSetsMap(buildFreshSetsMap(exArr));

        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          setSessionId(sessionData.session_id);
          if (sessionData.started_at) {
            startedAtRef.current = new Date(sessionData.started_at).getTime();
          }
          setActiveSession(sessionData);
        }
      } catch (err) {
        console.error(err);
      }
    })();
  }, [token, workoutId, resumeSessionId, resumeWorkoutId]);

  const currentExercise = exercises[currentIndex]?.Exercise;
  const currentSets = setsMap[currentIndex] || [];

  const updateSets = (updater) => {
    setSetsMap((prev) => ({
      ...prev,
      [currentIndex]: updater(prev[currentIndex] || []),
    }));
  };

  const handleWeightChange = (i, v) =>
    updateSets((sets) => {
      const updated = [...sets];
      updated[i] = { ...updated[i], weight: v };
      return updated;
    });

  const handleRepsChange = (i, v) =>
    updateSets((sets) => {
      const updated = [...sets];
      updated[i] = { ...updated[i], reps: v };
      return updated;
    });

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
      i === setIndex ? true : s.status === "completed"
    );

    if (allDone && currentIndex + 1 < exercises.length) {
      setShowRest(true);
      setRestKey((k) => k + 1);
    } else if (!allDone) {
      setShowRest(true);
      setRestKey((k) => k + 1);
    }
  };

  const handleAddSet = () =>
    updateSets((sets) => {
      const last = sets[sets.length - 1];
      const newSet = makeSet(last?.weight || 0, last?.reps || 8);
      if (sets.every((s) => s.status === "completed")) newSet.status = "active";
      return [...sets, newSet];
    });

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
    Alert.alert("Termină antrenamentul", "Ești sigur că vrei să termini?", [
      { text: "Anulează", style: "cancel" },
      {
        text: "Termină",
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
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>WORKOUT</Text>
            <View style={styles.timerBadge}>
              <Ionicons name="timer-outline" size={12} color={Colors.onSurfaceVariant} />
              <Text style={styles.timerText}>{formatElapsed(elapsed)}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleFinish}>
            <Text style={styles.finishText}>Finish</Text>
          </TouchableOpacity>
        </View>

        {exercises.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pills}
            style={styles.pillsScroll}
          >
            {exercises.map((ex, i) => {
              const done = setsMap[i]?.every((s) => s.status === "completed");
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.pill,
                    i === currentIndex && styles.pillActive,
                    done && i !== currentIndex && styles.pillDone,
                  ]}
                  onPress={() => setCurrentIndex(i)}
                  activeOpacity={0.8}
                >
                  {done && i !== currentIndex && (
                    <Ionicons name="checkmark" size={10} color={Colors.primary} />
                  )}
                  <Text
                    style={[
                      styles.pillText,
                      i === currentIndex && styles.pillTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {ex.Exercise?.name || `Exercise ${i + 1}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
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
          <RestTimer key={restKey} onSkip={handleNextExercise} onFinish={handleNextExercise} />
        )}

        <View style={styles.bottomBar}>
          <PrimaryButton
            label="Log Set"
            onPress={() => {
              const activeIndex = currentSets.findIndex((s) => s.status === "active");
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
  headerCenter: {
    alignItems: "center",
    gap: 4,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timerText: {
    fontSize: 13,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 1,
  },
  finishText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.error,
  },
  pillsScroll: {
    flexShrink: 0,
  },
  pills: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderRadius: 24,
    backgroundColor: Colors.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    marginRight: 10,
  },
  pillActive: {
    backgroundColor: Colors.primaryDim,
    borderColor: Colors.primaryDim,
  },
  pillDone: {
    borderColor: Colors.primary,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
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
  logBtn: { flex: 1 },
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
