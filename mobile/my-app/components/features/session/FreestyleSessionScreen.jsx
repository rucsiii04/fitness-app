import React, { useState, useEffect, useRef } from "react";
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
import { useRouter } from "expo-router";
import { Colors, Fonts } from "@/constants/theme";
import { useAppFonts } from "@/hooks/useAppFonts";
import { useAuth } from "@/context/AuthContext";
import { useActiveSession } from "@/context/ActiveSessionContext";
import { ScreenBackground } from "@/components/ui/ScreenBackground";
import { AddExerciseSheet } from "@/components/features/workouts/AddExerciseSheet";
import { SetTable } from "./SetTable";
import { RestTimer } from "./RestTimer";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

function makeSet(weight = 0, reps = 8, active = false) {
  return { weight: String(weight), reps: String(reps), status: active ? "active" : "pending" };
}

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  if (h > 0) return `${String(h).padStart(2, "0")}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}

export default function FreestyleSessionScreen({ sessionId }) {
  const fontsLoaded = useAppFonts();
  const { token } = useAuth();
  const { activeSession, setActiveSession, refresh } = useActiveSession();
  const router = useRouter();

  const [exercises, setExercises] = useState([]);
  const [setsMap, setSetsMap] = useState({});
  // Initialize from activeSession.started_at so the timer is correct on first render,
  // even before any network call returns.
  const [elapsed, setElapsed] = useState(() => {
    const startedAt = activeSession?.started_at;
    if (!startedAt) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
  });
  // One-shot fallback: if activeSession wasn't ready at mount, sync once when it arrives
  const timerSynced = useRef(activeSession?.started_at != null);
  useEffect(() => {
    if (timerSynced.current || !activeSession?.started_at) return;
    timerSynced.current = true;
    const diff = Math.floor((Date.now() - new Date(activeSession.started_at).getTime()) / 1000);
    setElapsed(Math.max(0, diff));
  }, [activeSession?.started_at]);

  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showRest, setShowRest] = useState(false);
  const [restKey, setRestKey] = useState(0);
  const [confirmModal, setConfirmModal] = useState(null); // { title, body, action, actionLabel, danger }
  const [removeExIndex, setRemoveExIndex] = useState(null);

  // Restore exercises + completed sets from logged data
  useEffect(() => {
    if (!sessionId || !token) return;
    fetch(`${API_BASE}/workout-sessions/${sessionId}/logs`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((logs) => {
        if (!Array.isArray(logs) || logs.length === 0) return;
        const exerciseMap = new Map();
        logs.forEach((log) => {
          if (!exerciseMap.has(log.exercise_id)) {
            exerciseMap.set(log.exercise_id, log.Exercise);
          }
        });
        const exerciseList = Array.from(exerciseMap.values());
        setExercises(exerciseList);

        const newSetsMap = {};
        exerciseList.forEach((ex, idx) => {
          const exLogs = logs
            .filter((l) => l.exercise_id === ex.exercise_id)
            .sort((a, b) => a.set_number - b.set_number);
          const completedSets = exLogs.map((l) => ({
            weight: String(l.weight ?? 0),
            reps: String(l.reps),
            status: "completed",
          }));
          const last = exLogs[exLogs.length - 1];
          completedSets.push(makeSet(last?.weight ?? 0, last?.reps ?? 8, true));
          newSetsMap[idx] = completedSets;
        });
        setSetsMap(newSetsMap);
      })
      .catch(console.error);
  }, [sessionId, token]);

  // Running session timer
  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleAddExercises = (selected) => {
    setShowAddExercise(false);
    const existingIds = new Set(exercises.map((e) => e.exercise_id));
    const toAdd = selected.filter((e) => !existingIds.has(e.exercise_id));
    if (toAdd.length === 0) return;

    const startIdx = exercises.length;
    const newSetsEntries = {};
    toAdd.forEach((_, i) => {
      newSetsEntries[startIdx + i] = [makeSet(0, 8, true), makeSet(0, 8), makeSet(0, 8)];
    });

    setExercises((prev) => [...prev, ...toAdd]);
    setSetsMap((prev) => ({ ...prev, ...newSetsEntries }));
  };

  const handleRemoveExercise = (exIndex) => {
    setRemoveExIndex(exIndex);
  };

  const confirmRemoveExercise = () => {
    const exIndex = removeExIndex;
    setRemoveExIndex(null);
    setExercises((prev) => prev.filter((_, i) => i !== exIndex));
    setSetsMap((prev) => {
      const updated = {};
      Object.keys(prev).forEach((k) => {
        const ki = Number(k);
        if (ki < exIndex) updated[ki] = prev[k];
        else if (ki > exIndex) updated[ki - 1] = prev[k];
      });
      return updated;
    });
  };

  const updateSets = (exIndex, updater) => {
    setSetsMap((prev) => ({
      ...prev,
      [exIndex]: updater(prev[exIndex] || []),
    }));
  };

  const handleWeightChange = (exIndex, setIndex, v) => {
    updateSets(exIndex, (sets) => {
      const updated = [...sets];
      updated[setIndex] = { ...updated[setIndex], weight: v };
      return updated;
    });
  };

  const handleRepsChange = (exIndex, setIndex, v) => {
    updateSets(exIndex, (sets) => {
      const updated = [...sets];
      updated[setIndex] = { ...updated[setIndex], reps: v };
      return updated;
    });
  };

  const handleCompleteSet = async (exIndex, setIndex) => {
    const sets = setsMap[exIndex] || [];
    const set = sets[setIndex];
    if (!set || set.status === "completed") return;

    const exercise = exercises[exIndex];
    if (sessionId && exercise) {
      try {
        console.log("Logging set:", { sessionId, exercise_id: exercise.exercise_id, reps: Number(set.reps), weight: Number(set.weight) });
        const res = await fetch(`${API_BASE}/workout-sessions/${sessionId}/logs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            exercise_id: exercise.exercise_id,
            reps: Number(set.reps),
            weight: Number(set.weight),
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          console.error("Log set failed:", res.status, body);
        }
      } catch (err) {
        console.error("Log set network error:", err);
      }
    }

    updateSets(exIndex, (prevSets) => {
      const updated = [...prevSets];
      updated[setIndex] = { ...updated[setIndex], status: "completed" };
      if (setIndex + 1 < updated.length) {
        updated[setIndex + 1] = { ...updated[setIndex + 1], status: "active" };
      }
      return updated;
    });

    setShowRest(true);
    setRestKey((k) => k + 1);
  };

  const handleAddSet = (exIndex) => {
    updateSets(exIndex, (sets) => {
      const last = sets[sets.length - 1];
      const allCompleted = sets.every((s) => s.status === "completed");
      return [...sets, makeSet(last?.weight || 0, last?.reps || 8, allCompleted)];
    });
  };

  const finishSession = async () => {
    if (sessionId) {
      try {
        const res = await fetch(`${API_BASE}/workout-sessions/${sessionId}/finish`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) {
          console.error("Failed to finish session:", res.status);
        }
      } catch (err) {
        console.error("Network error finishing session:", err);
      }
    }
    // Re-fetch from DB so the banner reflects the real state, regardless of
    // whether the finish call succeeded or failed.
    await refresh();
    router.back();
  };

  const handleFinish = () => {
    setConfirmModal({
      title: "Finalizează sesiunea",
      body: "Salvezi și închei această sesiune?",
      actionLabel: "Finalizează",
      action: finishSession,
      danger: false,
    });
  };

  const handleDiscard = () => {
    setConfirmModal({
      title: "Renunță la sesiune",
      body: "Închei sesiunea fără a salva progresul?",
      actionLabel: "Renunță",
      action: finishSession,
      danger: true,
    });
  };

  if (!fontsLoaded) return null;

  return (
    <ScreenBackground>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="arrow-back" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FREESTYLE</Text>
          <TouchableOpacity onPress={handleFinish} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.finishLink}>Finish</Text>
          </TouchableOpacity>
        </View>

        {/* Session timer */}
        <View style={styles.timerSection}>
          <Text style={styles.timerLabel}>CURRENT SESSION</Text>
          <Text style={styles.timerValue}>{formatTime(elapsed)}</Text>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Exercise cards */}
          {exercises.map((exercise, exIndex) => {
            const sets = setsMap[exIndex] || [];
            const muscleLabel = exercise.muscle_group
              ? exercise.muscle_group.charAt(0).toUpperCase() + exercise.muscle_group.slice(1)
              : "";
            const metaLabel = [muscleLabel, exercise.equipment_required]
              .filter(Boolean)
              .join(" • ");

            return (
              <View key={exIndex} style={styles.exerciseCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    {metaLabel ? (
                      <Text style={styles.exerciseMeta}>{metaLabel}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveExercise(exIndex)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.removeBtn}
                  >
                    <Ionicons name="ellipsis-vertical" size={18} color={Colors.outlineVariant} />
                  </TouchableOpacity>
                </View>

                <SetTable
                  sets={sets}
                  onWeightChange={(setIdx, v) => handleWeightChange(exIndex, setIdx, v)}
                  onRepsChange={(setIdx, v) => handleRepsChange(exIndex, setIdx, v)}
                  onCompleteSet={(setIdx) => handleCompleteSet(exIndex, setIdx)}
                  onAddSet={() => handleAddSet(exIndex)}
                />
              </View>
            );
          })}

          {/* Add Exercise */}
          <TouchableOpacity
            style={styles.addExerciseBtn}
            onPress={() => setShowAddExercise(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color={Colors.onSurfaceVariant} />
            <Text style={styles.addExerciseText}>ADD EXERCISE</Text>
          </TouchableOpacity>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity style={styles.finishBtn} onPress={handleFinish} activeOpacity={0.85}>
              <Text style={styles.finishBtnText}>Finish Session</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.discardBtn} onPress={handleDiscard} activeOpacity={0.85}>
              <Text style={styles.discardBtnText}>DISCARD WORKOUT</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Confirm modal (finish / discard) */}
        <Modal visible={!!confirmModal} transparent animationType="fade" onRequestClose={() => setConfirmModal(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={[styles.modalIconWrap, confirmModal?.danger && styles.modalIconWrapDanger]}>
                <Ionicons
                  name={confirmModal?.danger ? "trash-outline" : "checkmark-circle-outline"}
                  size={26}
                  color={confirmModal?.danger ? Colors.error : Colors.primary}
                />
              </View>
              <Text style={styles.modalTitle}>{confirmModal?.title}</Text>
              <Text style={styles.modalBody}>{confirmModal?.body}</Text>
              <TouchableOpacity
                style={[styles.modalActionBtn, confirmModal?.danger && styles.modalActionBtnDanger]}
                onPress={() => { const fn = confirmModal?.action; setConfirmModal(null); fn?.(); }}
                activeOpacity={0.85}
              >
                <Text style={styles.modalActionText}>{confirmModal?.actionLabel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setConfirmModal(null)} activeOpacity={0.8}>
                <Text style={styles.modalCancelText}>Anulează</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Remove exercise modal */}
        <Modal visible={removeExIndex !== null} transparent animationType="fade" onRequestClose={() => setRemoveExIndex(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalIconWrapDanger}>
                <Ionicons name="remove-circle-outline" size={26} color={Colors.error} />
              </View>
              <Text style={styles.modalTitle}>Elimină exercițiul</Text>
              <Text style={styles.modalBody}>Elimini acest exercițiu din sesiune?</Text>
              <TouchableOpacity style={styles.modalActionBtnDanger} onPress={confirmRemoveExercise} activeOpacity={0.85}>
                <Text style={styles.modalActionText}>Elimină</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setRemoveExIndex(null)} activeOpacity={0.8}>
                <Text style={styles.modalCancelText}>Anulează</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <AddExerciseSheet
          visible={showAddExercise}
          token={token}
          currentExercises={exercises}
          onClose={() => setShowAddExercise(false)}
          onConfirm={handleAddExercises}
        />

        {showRest && (
          <RestTimer
            key={restKey}
            onSkip={() => setShowRest(false)}
            onFinish={() => setShowRest(false)}
          />
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
  finishLink: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.error,
  },

  timerSection: {
    alignItems: "center",
    paddingVertical: 28,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  timerLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 3,
    textTransform: "uppercase",
    color: Colors.secondary,
    fontFamily: Fonts.label,
    marginBottom: 4,
  },
  timerValue: {
    fontSize: 52,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    letterSpacing: -2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },

  exerciseCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  cardInfo: {
    flex: 1,
    gap: 3,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  exerciseMeta: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.secondary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  removeBtn: {
    padding: 4,
    marginLeft: 8,
  },

  addExerciseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLow,
  },
  addExerciseText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.onSurfaceVariant,
    letterSpacing: 2,
  },

  controls: {
    gap: 10,
    marginTop: 8,
  },
  finishBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  finishBtnText: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.background,
    letterSpacing: -0.3,
  },
  discardBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  discardBtnText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.error,
    letterSpacing: 2,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  modalIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(209,255,0,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  modalIconWrapDanger: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,59,48,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    textAlign: "center",
  },
  modalBody: {
    fontSize: 13,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 4,
  },
  modalActionBtn: {
    width: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  modalActionBtnDanger: {
    width: "100%",
    backgroundColor: Colors.error,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  modalActionText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: "#fff",
    letterSpacing: 1,
  },
  modalCancelBtn: {
    width: "100%",
    paddingVertical: 10,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 13,
    fontFamily: Fonts.label,
    color: Colors.onSurfaceVariant,
  },
});
