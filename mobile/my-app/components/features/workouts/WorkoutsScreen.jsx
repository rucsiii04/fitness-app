import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Colors, Fonts } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useActiveSession } from "@/context/ActiveSessionContext";
import { ScreenBackground } from "@/components/ui/ScreenBackground";
import { WorkoutCard } from "./WorkoutCard";
import EditWorkoutModal from "./EditWorkoutModal";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

const TABS = [
  { key: "mine", label: "MY WORKOUTS" },
  { key: "explore", label: "EXPLORE" },
];

const DIFFICULTIES = [
  { key: "all", label: "All" },
  { key: "beginner", label: "Beginner" },
  { key: "intermediate", label: "Intermediate" },
  { key: "advanced", label: "Advanced" },
];

function TabBar({ active, onChange }) {
  return (
    <View style={styles.tabBar}>
      {TABS.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tabItem, active === tab.key && styles.tabItemActive]}
          onPress={() => onChange(tab.key)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabLabel,
              active === tab.key && styles.tabLabelActive,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function DifficultyFilter({ active, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = DIFFICULTIES.find((d) => d.key === active);
  const isFiltered = active !== "all";

  return (
    <>
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, isFiltered && styles.filterBtnActive]}
          onPress={() => setOpen(true)}
          activeOpacity={0.8}
        >
          <Ionicons
            name="filter"
            size={13}
            color={isFiltered ? Colors.primary : Colors.onSurfaceVariant}
          />
          <Text
            style={[
              styles.filterBtnText,
              isFiltered && styles.filterBtnTextActive,
            ]}
          >
            {isFiltered ? selected.label : "Difficulty"}
          </Text>
          <Ionicons
            name="chevron-down"
            size={13}
            color={isFiltered ? Colors.primary : Colors.onSurfaceVariant}
          />
        </TouchableOpacity>
      </View>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={styles.dropdown}>
            <Text style={styles.dropdownTitle}>DIFFICULTY</Text>
            {DIFFICULTIES.map((d) => {
              const isActive = active === d.key;
              return (
                <TouchableOpacity
                  key={d.key}
                  style={[
                    styles.dropdownItem,
                    isActive && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    onChange(d.key);
                    setOpen(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      isActive && styles.dropdownItemTextActive,
                    ]}
                  >
                    {d.label}
                  </Text>
                  {isActive && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={Colors.primary}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

function FreestyleButton({ token, router }) {
  const [starting, setStarting] = useState(false);
  const { activeSession, setActiveSession } = useActiveSession();

  const handlePress = async () => {
    if (activeSession?.session_id) {
      router.push(`/session/${activeSession.session_id}`);
      return;
    }

    setStarting(true);
    try {
      const res = await fetch(`${API_BASE}/workout-sessions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveSession(data);
        router.push(`/session/${data.session_id}`);
      }
    } catch {
    } finally {
      setStarting(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.freestyleBtn}
      onPress={handlePress}
      disabled={starting}
      activeOpacity={0.85}
    >
      {starting ? (
        <ActivityIndicator size="small" color={Colors.primary} />
      ) : (
        <>
          <Ionicons
            name="play-circle-outline"
            size={18}
            color={Colors.primary}
          />
          <Text style={styles.freestyleBtnText}>START FREESTYLE</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

function EmptyState({ onCreatePress }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons
          name="barbell-outline"
          size={28}
          color={Colors.outlineVariant}
        />
      </View>
      <Text style={styles.emptyTitle}>No workouts yet</Text>
      <Text style={styles.emptySubtitle}>
        Create your first workout to get started
      </Text>
      {onCreatePress && (
        <TouchableOpacity
          style={styles.emptyBtn}
          onPress={onCreatePress}
          activeOpacity={0.85}
        >
          <Text style={styles.emptyBtnText}>CREATE WORKOUT</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function WorkoutsScreen() {
  const { token, user, logout } = useAuth();
  const router = useRouter();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("mine");
  const [difficulty, setDifficulty] = useState("all");
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [editWorkout, setEditWorkout] = useState(null);

  const fetchWorkouts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/workouts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setWorkouts(Array.isArray(data) ? data : []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchWorkouts();
    }, [fetchWorkouts]),
  );

  const handleDeleteConfirm = () => {
    Alert.alert(
      "Delete Workout",
      `Are you sure you want to delete "${selectedWorkout.name}"?`,
      [
        {
          text: "No",
          style: "cancel",
          onPress: () => setSelectedWorkout(null),
        },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            const id = selectedWorkout.workout_id;
            setSelectedWorkout(null);
            try {
              await fetch(`${API_BASE}/workouts/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              setWorkouts((prev) => prev.filter((w) => w.workout_id !== id));
            } catch {
              // silent
            }
          },
        },
      ],
    );
  };

  const filtered = workouts.filter((w) => {
    const tabMatch = activeTab === "explore" ? w.is_public : !w.is_public;
    const diffMatch = difficulty === "all" || w.difficulty_level === difficulty;
    return tabMatch && diffMatch;
  });

  return (
    <ScreenBackground>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>WORKOUTS</Text>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => router.push("/workout/history")}
          >
            <Ionicons
              name="time-outline"
              size={22}
              color={Colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>

        <TabBar active={activeTab} onChange={setActiveTab} />

        <DifficultyFilter active={difficulty} onChange={setDifficulty} />

        {activeTab === "mine" && (
          <View style={styles.freestyleRow}>
            <FreestyleButton token={token} router={router} />
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => router.push("/workout/create")}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={16} color={Colors.onSurfaceVariant} />
              <Text style={styles.createBtnText}>CREATE A NEW WORKOUT</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(w) => String(w.workout_id)}
            renderItem={({ item }) =>
              activeTab === "explore" ? (
                <WorkoutCard
                  workout={item}
                  onPress={() => {
                    const already = workouts.some((w) => w.original_workout_id === item.workout_id);
                    router.push(`/workout/detail?id=${item.workout_id}&saved=${already}`);
                  }}
                  onLongPress={() => {
                    const already = workouts.some((w) => w.original_workout_id === item.workout_id);
                    router.push(`/workout/detail?id=${item.workout_id}&saved=${already}`);
                  }}
                  onStart={() => {
                    const already = workouts.some((w) => w.original_workout_id === item.workout_id);
                    router.push(`/workout/detail?id=${item.workout_id}&saved=${already}`);
                  }}
                />
              ) : (
                <WorkoutCard
                  workout={item}
                  onStart={() => router.push(`/workout/${item.workout_id}`)}
                  onLongPress={() => setSelectedWorkout(item)}
                />
              )
            }
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <EmptyState
                onCreatePress={
                  activeTab === "mine"
                    ? () => router.push("/workout/create")
                    : null
                }
              />
            }
          />
        )}
      </SafeAreaView>

      <Modal
        visible={!!selectedWorkout}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedWorkout(null)}
      >
        <TouchableOpacity
          style={styles.actionOverlay}
          activeOpacity={1}
          onPress={() => setSelectedWorkout(null)}
        >
          <View style={styles.actionSheet}>
            <View style={styles.actionHandle} />
            <Text style={styles.actionTitle} numberOfLines={1}>
              {selectedWorkout?.name}
            </Text>

            <TouchableOpacity
              style={styles.actionRow}
              activeOpacity={0.7}
              onPress={() => {
                const w = selectedWorkout;
                setSelectedWorkout(null);
                setEditWorkout(w);
              }}
            >
              <Ionicons
                name="create-outline"
                size={20}
                color={Colors.textPrimary}
              />
              <Text style={styles.actionLabel}>Edit</Text>
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity
              style={styles.actionRow}
              activeOpacity={0.7}
              onPress={handleDeleteConfirm}
            >
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
              <Text style={[styles.actionLabel, { color: Colors.error }]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      <EditWorkoutModal
        visible={!!editWorkout}
        workout={editWorkout}
        token={token}
        onClose={() => setEditWorkout(null)}
        onSaved={(updated) => {
          setWorkouts((prev) =>
            prev.map((w) =>
              w.workout_id === updated.workout_id ? { ...w, ...updated } : w,
            ),
          );
          setEditWorkout(null);
        }}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  headerIconBtn: { padding: 6 },

  tabBar: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 9,
  },
  tabItemActive: {
    backgroundColor: Colors.primary,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    fontFamily: Fonts.label,
    color: Colors.onSurfaceVariant,
  },
  tabLabelActive: {
    color: Colors.background,
  },

  filterRow: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  filterBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: "rgba(209,255,0,0.08)",
  },
  filterBtnText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  filterBtnTextActive: {
    color: Colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    paddingBottom: 120,
    paddingHorizontal: 20,
  },
  dropdown: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    overflow: "hidden",
  },
  dropdownTitle: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.label,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  dropdownItemActive: {
    backgroundColor: "rgba(209,255,0,0.06)",
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: "500",
    fontFamily: Fonts.body,
    color: Colors.textPrimary,
  },
  dropdownItemTextActive: {
    color: Colors.primary,
    fontWeight: "700",
  },

  freestyleRow: {
    paddingHorizontal: 20,
    paddingBottom: 4,
    gap: 10,
  },
  freestyleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(209,255,0,0.3)",
    backgroundColor: "rgba(209,255,0,0.06)",
  },
  freestyleBtnText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    fontFamily: Fonts.label,
    color: Colors.primary,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  createBtnText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    fontFamily: Fonts.label,
    color: Colors.onSurfaceVariant,
  },

  list: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 120,
    gap: 12,
  },
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.body,
    textAlign: "center",
  },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    color: Colors.background,
    fontFamily: Fonts.label,
  },

  actionOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  actionSheet: {
    backgroundColor: Colors.surfaceContainerLow,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingBottom: 36,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  actionHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.outlineVariant,
    alignSelf: "center",
    marginBottom: 16,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.label,
    textTransform: "uppercase",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 18,
    paddingHorizontal: 4,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: "500",
    fontFamily: Fonts.body,
    color: Colors.textPrimary,
  },
  actionDivider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
  },
});
