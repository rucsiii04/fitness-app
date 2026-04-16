import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors, Fonts } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useActiveSession } from "@/context/ActiveSessionContext";
import { ScreenBackground } from "@/components/ui/ScreenBackground";
import { WorkoutCard } from "./WorkoutCard";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

const TABS = [
  { key: "mine", label: "MY WORKOUTS" },
  { key: "explore", label: "EXPLORE" },
];

const DIFFICULTIES = [
  { key: "all", label: "All" },
  { key: "beginner", label: "Easy" },
  { key: "intermediate", label: "Medium" },
  { key: "advanced", label: "Hard" },
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
  const { setActiveSession } = useActiveSession();

  const handlePress = async () => {
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
      // silently fail
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

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

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
            onPress={() => router.push("/(tabs)/workouts/history")}
          >
            <Ionicons
              name="time-outline"
              size={22}
              color={Colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <TabBar active={activeTab} onChange={setActiveTab} />

        {/* Difficulty filter */}
        <DifficultyFilter active={difficulty} onChange={setDifficulty} />

        {/* Freestyle session + Create workout */}
        <View style={styles.freestyleRow}>
          <FreestyleButton token={token} router={router} />
          {activeTab === "mine" && (
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => router.push("/workout/create")}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={16} color={Colors.onSurfaceVariant} />
              <Text style={styles.createBtnText}>CREATE A NEW WORKOUT</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(w) => String(w.workout_id)}
            renderItem={({ item }) => (
              <WorkoutCard
                workout={item}
                onPress={() => router.push(`/workout/${item.workout_id}`)}
                onStart={() => router.push(`/workout/${item.workout_id}`)}
              />
            )}
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

  // Tabs
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
});
