import React, { useState, useEffect, useRef, useReducer } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Modal,
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
import { WorkoutNotesModal } from "./WorkoutNotesModal";

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
      reps: l.reps === 0 ? "failure" : String(l.reps ?? 8),
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

function parseReps(val) {
  const n = parseInt(val, 10);
  return isNaN(n) ? 8 : n;
}

function buildFreshSetsMap(exerciseList) {
  const map = {};
  exerciseList.forEach((ex, i) => {
    const count = ex.sets || 3;
    const reps = parseReps(ex.reps);
    map[i] = Array.from({ length: count }, () => makeSet(0, reps));
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
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [abandonVisible, setAbandonVisible] = useState(false);

  const startedAtRef = useRef(
    activeSession?.started_at
      ? new Date(activeSession.started_at).getTime()
      : resumeSessionId
        ? null        // resume: wait for server's real started_at
        : Date.now()  // new session: start the clock immediately
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

        const [exerciseList, sessionData] = await Promise.all([
          exercisesRes.json(),
          sessionRes.json(),
        ]);

        const exArr = Array.isArray(exerciseList) ? exerciseList : [];

        setExercises(exArr);
        setSetsMap(buildFreshSetsMap(exArr));
        if (sessionRes.ok && sessionData?.session_id) {
          setSessionId(sessionData.session_id);
          if (sessionData.started_at) {
            startedAtRef.current = new Date(sessionData.started_at).getTime();
          }
          setActiveSession(sessionData);
        } else {
          console.error("Session creation failed:", sessionData?.message);
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

    const exerciseId = currentExercise?.exercise_id ?? exercises[currentIndex]?.exercise_id;
    const repsRaw = Number(set.reps);
    const repsVal = set.reps === "failure" ? 0 : (isNaN(repsRaw) ? 0 : repsRaw);
    const weightRaw = Number(set.weight);
    const weightVal = isNaN(weightRaw) ? 0 : weightRaw;

    if (sessionId && exerciseId != null) {
      try {
        const res = await fetch(`${API_BASE}/workout-sessions/${sessionId}/logs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            exercise_id: exerciseId,
            reps: repsVal,
            weight: weightVal,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error("Log set failed:", res.status, err.message);
          return;
        }
      } catch (err) {
        console.error("Log set network error:", err);
        return;
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

    setShowRest(true);
    setRestKey((k) => k + 1);
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

  // Called when the rest timer ends or is skipped.
  // Only advances to the next exercise if all sets for the current one are done;
  // otherwise just dismisses the rest overlay and stays on the same exercise.
  const handleRestDone = () => {
    const allDone = currentSets.every((s) => s.status === "completed");
    if (allDone) {
      handleNextExercise();
    } else {
      setShowRest(false);
    }
  };

  const handleFinish = () => {
    setNotesModalVisible(true);
  };

  const handleAbandon = async () => {
    setAbandonVisible(false);
    if (sessionId) {
      await fetch(`${API_BASE}/workout-sessions/${sessionId}/abandon`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(console.error);
    }
    setActiveSession(null);
    router.back();
  };

  const handleConfirmFinish = async (notes) => {
    setNotesModalVisible(false);
    if (sessionId) {
      await fetch(`${API_BASE}/workout-sessions/${sessionId}/finish`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes: notes || undefined }),
      }).catch(console.error);
    }
    setActiveSession(null);
    router.back();
  };

  if (!fontsLoaded) return null;

  return (
    <ScreenBackground>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setAbandonVisible(true)}>
            <Ionicons name="trash-outline" size={20} color={Colors.error} />
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
          <RestTimer key={restKey} onSkip={handleRestDone} onFinish={handleRestDone} />
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
      <WorkoutNotesModal
        visible={notesModalVisible}
        onConfirm={handleConfirmFinish}
        onClose={() => setNotesModalVisible(false)}
      />

      <Modal visible={abandonVisible} transparent animationType="fade" onRequestClose={() => setAbandonVisible(false)}>
        <TouchableOpacity style={styles.abandonOverlay} activeOpacity={1} onPress={() => setAbandonVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.abandonCard}>
            <View style={styles.abandonIconWrap}>
              <Ionicons name="trash-outline" size={22} color={Colors.error} />
            </View>
            <Text style={styles.abandonTitle}>Renunți la antrenament?</Text>
            <Text style={styles.abandonBody}>
              Sesiunea va fi ștearsă complet și nu va apărea în istoric.
            </Text>
            <TouchableOpacity style={styles.abandonConfirmBtn} onPress={handleAbandon} activeOpacity={0.85}>
              <Text style={styles.abandonConfirmText}>Renunță</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.abandonCancelBtn} onPress={() => setAbandonVisible(false)} activeOpacity={0.8}>
              <Text style={styles.abandonCancelText}>Continuă antrenamentul</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  abandonOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  abandonCard: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  abandonIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,115,81,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  abandonTitle: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  abandonBody: {
    fontSize: 13,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 19,
  },
  abandonConfirmBtn: {
    width: "100%",
    backgroundColor: Colors.error,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  abandonConfirmText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: "#fff",
    letterSpacing: 1,
  },
  abandonCancelBtn: {
    width: "100%",
    paddingVertical: 12,
    alignItems: "center",
  },
  abandonCancelText: {
    fontSize: 13,
    fontFamily: Fonts.label,
    color: Colors.onSurfaceVariant,
  },
});
