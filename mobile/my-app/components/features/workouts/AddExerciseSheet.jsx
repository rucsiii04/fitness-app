import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

const MUSCLE_GROUPS = [
  { key: "all", label: "All" },
  { key: "chest", label: "Chest" },
  { key: "back", label: "Back" },
  { key: "legs", label: "Legs" },
  { key: "shoulders", label: "Shoulders" },
  { key: "arms", label: "Arms" },
  { key: "core", label: "Core" },
  { key: "full-body", label: "Full Body" },
];

export function AddExerciseSheet({ visible, token, currentExercises, onClose, onConfirm }) {
  const [allExercises, setAllExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState("all");
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Sync selectedIds from parent on open
  useEffect(() => {
    if (visible) {
      setSelectedIds(new Set(currentExercises.map((e) => e.exercise_id)));
      setSearch("");
      setMuscle("all");
    }
  }, [visible]);

  // Fetch exercises once
  useEffect(() => {
    if (!token || allExercises.length > 0) return;
    setLoading(true);
    fetch(`${API_BASE}/exercises`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setAllExercises(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = allExercises.filter((ex) => {
    const matchesMuscle = muscle === "all" || ex.muscle_group === muscle;
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    return matchesMuscle && matchesSearch && ex.is_active;
  });

  const toggle = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    const selected = allExercises.filter((ex) => selectedIds.has(ex.exercise_id));
    onConfirm(selected);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={22} color={Colors.onSurfaceVariant} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ADD EXERCISES</Text>
          <TouchableOpacity onPress={handleConfirm}>
            <Text style={styles.headerDone}>DONE</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={Colors.onSurfaceVariant} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor={Colors.onSurfaceVariant}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={16} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>

        {/* Muscle group chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {MUSCLE_GROUPS.map((g) => (
            <TouchableOpacity
              key={g.key}
              style={[styles.chip, muscle === g.key && styles.chipActive]}
              onPress={() => setMuscle(g.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, muscle === g.key && styles.chipTextActive]}>
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Exercise list */}
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(ex) => String(ex.exercise_id)}
            renderItem={({ item }) => {
              const added = selectedIds.has(item.exercise_id);
              return (
                <TouchableOpacity
                  style={styles.exRow}
                  onPress={() => toggle(item.exercise_id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.exInfo}>
                    <Text style={styles.exName}>{item.name}</Text>
                    <Text style={styles.exMuscle}>{item.muscle_group}</Text>
                  </View>
                  <View style={[styles.addBtn, added && styles.addBtnActive]}>
                    <Ionicons
                      name={added ? "checkmark" : "add"}
                      size={18}
                      color={added ? Colors.background : Colors.textPrimary}
                    />
                  </View>
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No exercises found</Text>
            }
          />
        )}

        {/* Bottom confirm bar */}
        {selectedIds.size > 0 && (
          <View style={styles.confirmBar}>
            <View style={styles.confirmInfo}>
              <View style={styles.confirmIconBox}>
                <Ionicons name="barbell-outline" size={16} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.confirmLabel}>SELECTED</Text>
                <Text style={styles.confirmCount}>{selectedIds.size} EXERCISES</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.85}>
              <Text style={styles.confirmBtnText}>ADD TO WORKOUT</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
    fontFamily: Fonts.label,
    color: Colors.primary,
  },
  headerDone: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    fontFamily: Fonts.label,
    color: Colors.primary,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 14,
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    fontFamily: Fonts.body,
  },
  chipsRow: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.onSurfaceVariant,
  },
  chipTextActive: {
    color: Colors.background,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 8,
  },
  exRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  exInfo: {
    flex: 1,
    gap: 3,
  },
  exName: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  exMuscle: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.secondary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  addBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  emptyText: {
    textAlign: "center",
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.body,
    fontSize: 13,
    marginTop: 32,
  },
  confirmBar: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  confirmInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  confirmIconBox: {
    backgroundColor: "rgba(209,255,0,0.1)",
    padding: 8,
    borderRadius: 10,
  },
  confirmLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.label,
  },
  confirmCount: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  confirmBtnText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: Colors.background,
    fontFamily: Fonts.label,
  },
});
