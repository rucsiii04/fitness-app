import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";
import { fetchSessionLogs } from "@/services/workoutHistoryService";
import { useAuth } from "@/context/AuthContext";

const ACCENT_COLORS = [Colors.primary, Colors.secondary, Colors.tertiary];

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDuration(startedAt, finishedAt) {
  const mins = Math.round((new Date(finishedAt) - new Date(startedAt)) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function groupLogsByExercise(logs) {
  const order = [];
  const map = {};
  for (const log of logs) {
    const id = log.exercise_id;
    if (!map[id]) {
      map[id] = { name: log.Exercise?.name ?? "Exercise", sets: [] };
      order.push(id);
    }
    map[id].sets.push(log);
  }
  return order.map((id) => map[id]);
}

function SetChip({ set, color }) {
  return (
    <View style={styles.setChip}>
      <Text style={styles.setLabel}>SET {set.set_number}</Text>
      <Text style={[styles.setValue, { color }]}>
        {set.weight != null ? `${set.weight}kg × ` : ""}
        {set.reps} rep{set.reps !== 1 ? "s" : ""}
      </Text>
    </View>
  );
}

function ExerciseBlock({ exercise, index }) {
  const color = ACCENT_COLORS[index % ACCENT_COLORS.length];
  return (
    <View style={styles.exerciseBlock}>
      <View style={styles.exerciseHeader}>
        <View style={[styles.exerciseDot, { backgroundColor: color }]} />
        <Text style={styles.exerciseName}>{exercise.name.toUpperCase()}</Text>
      </View>
      <View style={styles.setsRow}>
        {exercise.sets.map((s) => (
          <SetChip key={s.log_id} set={s} color={color} />
        ))}
      </View>
    </View>
  );
}

export function HistorySessionCard({ session }) {
  const { token } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [logs, setLogs] = useState(null);
  const [loading, setLoading] = useState(false);

  const workoutName = session.Workout?.name ?? "Freestyle Session";
  const duration = formatDuration(session.started_at, session.finished_at);
  const date = formatDate(session.started_at);

  const handleToggle = async () => {
    if (!expanded && logs === null) {
      setLoading(true);
      try {
        const data = await fetchSessionLogs(session.session_id, token);
        setLogs(Array.isArray(data) ? data : []);
      } catch {
        setLogs([]);
      } finally {
        setLoading(false);
      }
    }
    setExpanded((prev) => !prev);
  };

  const exercises = logs ? groupLogsByExercise(logs) : [];

  return (
    <View style={[styles.card, expanded && styles.cardExpanded]}>
      <TouchableOpacity
        style={styles.header}
        onPress={handleToggle}
        activeOpacity={0.8}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.name} numberOfLines={1}>
            {workoutName}
          </Text>
          <Text style={styles.meta}>
            {date} · {duration}
          </Text>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={expanded ? Colors.primary : Colors.onSurfaceVariant}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>
          <View style={styles.divider} />
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : exercises.length === 0 ? (
            <Text style={styles.emptyLogs}>No exercises logged.</Text>
          ) : (
            exercises.map((ex, i) => (
              <ExerciseBlock key={i} exercise={ex} index={i} />
            ))
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    // overflow: "hidden",
  },
  cardExpanded: {
    borderColor: "rgba(209,255,0,0.2)",
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    gap: 12,
  },
  headerLeft: { flex: 1 },
  name: {
    fontSize: 17,
    fontFamily: Fonts.headline,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  meta: {
    fontSize: 11,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  body: { paddingHorizontal: 18, paddingBottom: 18 },
  divider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginBottom: 16,
  },
  loadingBox: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyLogs: {
    fontSize: 13,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    paddingVertical: 12,
  },

  exerciseBlock: { marginBottom: 16 },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  exerciseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  exerciseName: {
    fontSize: 11,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: 1.2,
  },
  setsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  setChip: {
    width: "30%",
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: "center",
  },
  setLabel: {
    fontSize: 8,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.onSurfaceVariant,
    letterSpacing: 1,
    marginBottom: 3,
  },
  setValue: {
    fontSize: 13,
    fontFamily: Fonts.headline,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
});
