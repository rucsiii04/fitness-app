import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";
import { SetRow } from "./SetRow";

export function SetTable({ sets, onWeightChange, onRepsChange, onCompleteSet, onAddSet }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerCell}>SET</Text>
        <Text style={[styles.headerCell, styles.center]}>KG</Text>
        <Text style={[styles.headerCell, styles.center]}>REPS</Text>
        <View style={{ width: 40 }} />
      </View>

      {sets.map((set, index) => (
        <SetRow
          key={index}
          setNumber={index + 1}
          weight={set.weight}
          reps={set.reps}
          status={set.status}
          onWeightChange={(v) => onWeightChange(index, v)}
          onRepsChange={(v) => onRepsChange(index, v)}
          onComplete={() => onCompleteSet(index)}
        />
      ))}

      <TouchableOpacity style={styles.addRow} onPress={onAddSet} activeOpacity={0.7}>
        <View style={styles.addIcon}>
          <Ionicons name="add" size={16} color={Colors.onSurfaceVariant} />
        </View>
        <Text style={styles.addLabel}>Add Set</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    marginBottom: 4,
  },
  headerCell: {
    width: 36,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.label,
    opacity: 0.6,
  },
  center: {
    flex: 1,
    textAlign: "center",
    width: undefined,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 8,
    opacity: 0.5,
  },
  addIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    alignItems: "center",
    justifyContent: "center",
  },
  addLabel: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.onSurfaceVariant,
    letterSpacing: 1,
  },
});