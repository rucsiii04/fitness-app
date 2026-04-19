import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";

const GOALS = [
  { id: "muscle_gain", label: "Muscle Gain" },
  { id: "fat_loss", label: "Fat Loss" },
  { id: "endurance", label: "Endurance" },
  { id: "strength", label: "Strength" },
  { id: "general", label: "General Fitness" },
];

const MUSCLES = [
  { id: "chest", label: "Chest" },
  { id: "back", label: "Back" },
  { id: "shoulders", label: "Shoulders" },
  { id: "legs", label: "Legs" },
  { id: "arms", label: "Arms" },
  { id: "core", label: "Core" },
  { id: "full_body", label: "Full Body" },
];

const EQUIPMENT = [
  { id: "bodyweight", label: "Bodyweight" },
  { id: "dumbbells", label: "Dumbbells" },
  { id: "barbell", label: "Barbell" },
  { id: "kettlebell", label: "Kettlebell" },
  { id: "machines", label: "Machines" },
];

function Chip({ label, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.chips}>{children}</View>
    </View>
  );
}

export function PlanFormModal({ visible, onClose, onGenerate, loading }) {
  const [goal, setGoal] = useState(null);
  const [muscles, setMuscles] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [notes, setNotes] = useState("");

  const toggleMuscle = (id) =>
    setMuscles((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );

  const toggleEquipment = (id) =>
    setEquipment((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );

  const handleGenerate = () => {
    const parts = [];
    if (goal) {
      const g = GOALS.find((g) => g.id === goal);
      parts.push(`Goal: ${g.label}`);
    }
    if (muscles.length > 0) {
      const labels = muscles.map((id) => MUSCLES.find((m) => m.id === id)?.label).filter(Boolean);
      parts.push(`Target muscles: ${labels.join(", ")}`);
    }
    if (equipment.length > 0) {
      const labels = equipment.map((id) => EQUIPMENT.find((e) => e.id === id)?.label).filter(Boolean);
      parts.push(`Available equipment: ${labels.join(", ")}`);
    }
    if (notes.trim()) {
      parts.push(`Additional notes: ${notes.trim()}`);
    }
    onGenerate(parts.join(". "));
  };

  const canGenerate = !loading;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Build Your Plan</Text>
              <Text style={styles.subtitle}>Customize what the AI generates for you</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
              <Ionicons name="close" size={18} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Section title="Primary Goal">
              {GOALS.map((g) => (
                <Chip
                  key={g.id}
                  label={g.label}
                  selected={goal === g.id}
                  onPress={() => setGoal(goal === g.id ? null : g.id)}
                />
              ))}
            </Section>

            <Section title="Target Muscles">
              {MUSCLES.map((m) => (
                <Chip
                  key={m.id}
                  label={m.label}
                  selected={muscles.includes(m.id)}
                  onPress={() => toggleMuscle(m.id)}
                />
              ))}
            </Section>

            <Section title="Available Equipment">
              {EQUIPMENT.map((e) => (
                <Chip
                  key={e.id}
                  label={e.label}
                  selected={equipment.includes(e.id)}
                  onPress={() => toggleEquipment(e.id)}
                />
              ))}
            </Section>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Extra Notes</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="e.g. avoid knee exercises, keep it under 45 min..."
                placeholderTextColor={Colors.textMuted}
                multiline
                maxLength={300}
              />
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[styles.generateBtn, !canGenerate && styles.generateBtnDisabled]}
            onPress={handleGenerate}
            disabled={!canGenerate}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.background} />
            ) : (
              <>
                <Ionicons name="sparkles" size={15} color={Colors.background} />
                <Text style={styles.generateBtnText}>Generate Plan</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.surfaceContainerLow,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingBottom: 32,
    maxHeight: "88%",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  title: {
    fontSize: 20,
    fontFamily: Fonts.headline,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 24,
  },
  section: { gap: 10 },
  sectionTitle: {
    fontSize: 10,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.onSurfaceVariant,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.3,
  },
  chipTextSelected: {
    color: Colors.background,
  },
  notesInput: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    fontFamily: Fonts.body,
    color: Colors.textPrimary,
    minHeight: 80,
    textAlignVertical: "top",
  },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  generateBtnDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  generateBtnText: {
    fontSize: 13,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.background,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
