import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Pressable,
  Modal,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Colors, Fonts } from "@/constants/theme";
import { ScreenBackground } from "@/components/ui/ScreenBackground";
import { useAuth } from "@/context/AuthContext";
import {
  fetchMyPublicWorkouts,
  deleteWorkout,
} from "@/services/trainerDashboardService";
import EditWorkoutModal from "@/components/features/workouts/EditWorkoutModal";

const TABS = [
  { key: "toate", label: "Toate" },
  { key: "ale_mele", label: "Ale mele" },
];

const DIFFICULTY = {
  beginner: { label: "Beginner", color: Colors.primary },
  intermediate: { label: "Intermediar", color: Colors.tertiary },
  advanced: { label: "Avansat", color: Colors.error },
};

function TabBar({ active, onChange }) {
  return (
    <View style={styles.tabBar}>
      {TABS.map((t) => (
        <TouchableOpacity
          key={t.key}
          style={[styles.tabItem, active === t.key && styles.tabItemActive]}
          onPress={() => onChange(t.key)}
          activeOpacity={0.8}
        >
          <Text
            style={[styles.tabLabel, active === t.key && styles.tabLabelActive]}
          >
            {t.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function WorkoutRow({ workout, onLongPress }) {
  const diff = DIFFICULTY[workout.difficulty_level] ?? DIFFICULTY.beginner;
  return (
    <Pressable
      style={styles.card}
      onLongPress={onLongPress}
      delayLongPress={350}
    >
      <View style={[styles.accent, { backgroundColor: diff.color }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={[styles.diffBadge, { borderColor: diff.color }]}>
            <Text style={[styles.diffText, { color: diff.color }]}>
              {diff.label.toUpperCase()}
            </Text>
          </View>
          {workout.creator_name ? (
            <View style={styles.creatorRow}>
              <Ionicons
                name="person-outline"
                size={11}
                color={Colors.secondary}
              />
              <Text style={styles.creatorText}>{workout.creator_name}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.cardName} numberOfLines={1}>
          {workout.name}
        </Text>
        {workout.description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>
            {workout.description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function ActionSheet({ visible, workout, onClose, onEdit, onDelete }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.sheetOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHandle} />

          <Text style={styles.sheetTitle} numberOfLines={1}>
            {workout?.name ?? ""}
          </Text>

          <TouchableOpacity
            style={styles.sheetRow}
            onPress={onEdit}
            activeOpacity={0.7}
          >
            <Ionicons
              name="create-outline"
              size={20}
              color={Colors.textPrimary}
            />
            <Text style={styles.sheetRowText}>Editează</Text>
          </TouchableOpacity>

          <View style={styles.sheetDivider} />

          <TouchableOpacity
            style={styles.sheetRow}
            onPress={onDelete}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color={Colors.error} />
            <Text style={[styles.sheetRowText, { color: Colors.error }]}>
              Șterge
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Ionicons
        name="barbell-outline"
        size={44}
        color={Colors.outlineVariant}
      />
      <Text style={styles.emptyTitle}>Niciun workout public</Text>
      <Text style={styles.emptySubtitle}>
        Creează primul tău workout public cu butonul de mai jos.
      </Text>
    </View>
  );
}

export default function TrainerPublicZoneScreen() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState("toate");
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editWorkout, setEditWorkout] = useState(null);
  const [actionTarget, setActionTarget] = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchMyPublicWorkouts(token);
      setWorkouts(data);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const displayed =
    activeTab === "ale_mele"
      ? workouts.filter((w) => w.created_by_user_id === user?.user_id)
      : workouts;

  const handleLongPress = (workout) => setActionTarget(workout);

  const handleDelete = () => {
    const workout = actionTarget;
    setActionTarget(null);
    Alert.alert(
      "Șterge workout",
      `Ești sigur că vrei să ștergi "${workout.name}"?`,
      [
        { text: "Anulează", style: "cancel" },
        {
          text: "Șterge",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteWorkout(workout.workout_id, token);
              setWorkouts((prev) =>
                prev.filter((w) => w.workout_id !== workout.workout_id),
              );
            } catch {
              Alert.alert("Eroare", "Nu s-a putut șterge workout-ul.");
            }
          },
        },
      ],
    );
  };

  const handleEdit = () => {
    setEditWorkout(actionTarget);
    setActionTarget(null);
  };

  return (
    <ScreenBackground>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Ionicons name="compass-outline" size={16} color={Colors.primary} />
            <Text style={styles.headerTitle}>PUBLIC ZONE</Text>
          </View>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => router.push("/workout/create")}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={20} color={Colors.background} />
          </TouchableOpacity>
        </View>

        <TabBar active={activeTab} onChange={setActiveTab} />

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={displayed}
            keyExtractor={(w) => String(w.workout_id)}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            ListEmptyComponent={<EmptyState />}
            renderItem={({ item }) => (
              <WorkoutRow
                workout={item}
                onLongPress={
                  activeTab === "ale_mele"
                    ? () => handleLongPress(item)
                    : undefined
                }
              />
            )}
          />
        )}

        {activeTab === "ale_mele" && displayed.length > 0 && (
          <Text style={styles.hint}>
            Apasă lung pe un workout pentru opțiuni
          </Text>
        )}
      </SafeAreaView>

      <ActionSheet
        visible={!!actionTarget}
        workout={actionTarget}
        onClose={() => setActionTarget(null)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

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
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  backBtn: { padding: 4, minWidth: 32 },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
    fontFamily: Fonts.label,
    color: Colors.primary,
  },
  createBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  tabBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: "center",
  },
  tabItemActive: { backgroundColor: Colors.surfaceContainerHighest },
  tabLabel: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  tabLabelActive: { color: Colors.textPrimary },

  list: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 120,
    flexGrow: 1,
  },

  card: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  accent: { width: 4 },
  cardBody: { flex: 1, padding: 16, gap: 6 },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  diffBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  diffText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
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
  cardName: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  cardDesc: {
    fontSize: 12,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
    lineHeight: 18,
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 20,
  },

  hint: {
    textAlign: "center",
    fontSize: 11,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
    paddingBottom: 16,
    opacity: 0.7,
  },

  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheetContainer: {
    backgroundColor: Colors.surfaceContainerLow,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingBottom: 36,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.outlineVariant,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.label,
    textTransform: "uppercase",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 18,
    paddingHorizontal: 4,
  },
  sheetRowText: {
    fontSize: 16,
    fontWeight: "500",
    fontFamily: Fonts.body,
    color: Colors.textPrimary,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
  },
});
