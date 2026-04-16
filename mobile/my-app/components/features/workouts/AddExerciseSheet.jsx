import React, { useState, useEffect, useMemo } from "react";
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
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

const MUSCLE_OPTIONS = [
  { key: "all", label: "All Muscles" },
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
  const [equipment, setEquipment] = useState("all");
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Which dropdown is open: null | "muscle" | "equipment"
  const [openDropdown, setOpenDropdown] = useState(null);

  // Sync selectedIds from parent on open
  useEffect(() => {
    if (visible) {
      setSelectedIds(new Set(currentExercises.map((e) => e.exercise_id)));
      setSearch("");
      setMuscle("all");
      setEquipment("all");
      setOpenDropdown(null);
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

  // Derive equipment options from loaded exercises
  const equipmentOptions = useMemo(() => {
    const set = new Set(
      allExercises
        .map((ex) => ex.equipment_required)
        .filter((e) => e && e.trim() !== "")
    );
    return [
      { key: "all", label: "All Equipment" },
      { key: "none", label: "No Equipment" },
      ...Array.from(set)
        .sort()
        .map((e) => ({ key: e, label: e })),
    ];
  }, [allExercises]);

  const filtered = allExercises.filter((ex) => {
    if (!ex.is_active) return false;
    if (muscle !== "all" && ex.muscle_group !== muscle) return false;
    if (equipment === "none" && ex.equipment_required) return false;
    if (equipment !== "all" && equipment !== "none" && ex.equipment_required !== equipment) return false;
    if (search && !ex.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
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

  const muscleLabel = MUSCLE_OPTIONS.find((m) => m.key === muscle)?.label ?? "Muscles";
  const equipmentLabel = equipmentOptions.find((e) => e.key === equipment)?.label ?? "Equipment";

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
            onFocus={() => setOpenDropdown(null)}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={16} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter buttons */}
        <View style={styles.filterRow}>
          {/* Muscle filter */}
          <View style={styles.filterWrap}>
            <TouchableOpacity
              style={[styles.filterBtn, muscle !== "all" && styles.filterBtnActive]}
              onPress={() => setOpenDropdown(openDropdown === "muscle" ? null : "muscle")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="body-outline"
                size={14}
                color={muscle !== "all" ? Colors.background : Colors.onSurfaceVariant}
              />
              <Text
                style={[styles.filterBtnText, muscle !== "all" && styles.filterBtnTextActive]}
                numberOfLines={1}
              >
                {muscleLabel}
              </Text>
              <Ionicons
                name={openDropdown === "muscle" ? "chevron-up" : "chevron-down"}
                size={12}
                color={muscle !== "all" ? Colors.background : Colors.onSurfaceVariant}
              />
            </TouchableOpacity>

            {openDropdown === "muscle" && (
              <View style={styles.dropdown}>
                <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
                  {MUSCLE_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.key}
                      style={[styles.dropdownItem, muscle === opt.key && styles.dropdownItemActive]}
                      onPress={() => {
                        setMuscle(opt.key);
                        setOpenDropdown(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownText,
                          muscle === opt.key && styles.dropdownTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                      {muscle === opt.key && (
                        <Ionicons name="checkmark" size={14} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Equipment filter */}
          <View style={styles.filterWrap}>
            <TouchableOpacity
              style={[styles.filterBtn, equipment !== "all" && styles.filterBtnActive]}
              onPress={() => setOpenDropdown(openDropdown === "equipment" ? null : "equipment")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="barbell-outline"
                size={14}
                color={equipment !== "all" ? Colors.background : Colors.onSurfaceVariant}
              />
              <Text
                style={[styles.filterBtnText, equipment !== "all" && styles.filterBtnTextActive]}
                numberOfLines={1}
              >
                {equipmentLabel}
              </Text>
              <Ionicons
                name={openDropdown === "equipment" ? "chevron-up" : "chevron-down"}
                size={12}
                color={equipment !== "all" ? Colors.background : Colors.onSurfaceVariant}
              />
            </TouchableOpacity>

            {openDropdown === "equipment" && (
              <View style={styles.dropdown}>
                <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
                  {equipmentOptions.map((opt) => (
                    <TouchableOpacity
                      key={opt.key}
                      style={[styles.dropdownItem, equipment === opt.key && styles.dropdownItemActive]}
                      onPress={() => {
                        setEquipment(opt.key);
                        setOpenDropdown(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownText,
                          equipment === opt.key && styles.dropdownTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                      {equipment === opt.key && (
                        <Ionicons name="checkmark" size={14} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        {/* Dismiss dropdowns when tapping the list area */}
        <Pressable style={{ flex: 1 }} onPress={() => setOpenDropdown(null)}>
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
                    onPress={() => {
                      setOpenDropdown(null);
                      toggle(item.exercise_id);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.exInfo}>
                      <Text style={styles.exName}>{item.name}</Text>
                      <View style={styles.exMeta}>
                        <Text style={styles.exMuscle}>{item.muscle_group}</Text>
                        {item.equipment_required ? (
                          <>
                            <Text style={styles.exDot}>·</Text>
                            <Text style={styles.exEquip}>{item.equipment_required}</Text>
                          </>
                        ) : null}
                      </View>
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
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text style={styles.emptyText}>No exercises found</Text>
              }
            />
          )}
        </Pressable>

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
    marginTop: 14,
    marginBottom: 10,
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

  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 12,
  },
  filterWrap: {
    flex: 1,
    position: "relative",
    zIndex: 10,
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  filterBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterBtnText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  filterBtnTextActive: {
    color: Colors.background,
  },

  dropdown: {
    position: "absolute",
    top: "110%",
    left: 0,
    right: 0,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    maxHeight: 260,
    zIndex: 100,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 12,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  dropdownItemActive: {
    backgroundColor: "rgba(209,255,0,0.06)",
  },
  dropdownText: {
    fontSize: 13,
    fontFamily: Fonts.body,
    color: Colors.textPrimary,
  },
  dropdownTextActive: {
    fontFamily: Fonts.label,
    color: Colors.primary,
  },

  list: {
    paddingHorizontal: 20,
    paddingTop: 4,
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
    gap: 4,
  },
  exName: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  exMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  exMuscle: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.secondary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  exDot: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
  },
  exEquip: {
    fontSize: 10,
    fontFamily: Fonts.label,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
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
