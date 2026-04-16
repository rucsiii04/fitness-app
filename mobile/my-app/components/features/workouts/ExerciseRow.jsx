import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";

export function ExerciseRow({ item, onChangeSets, onChangeReps, onRemove }) {
  const isFailure = item.reps === "failure";

  const toggleFailure = () => {
    onChangeReps(isFailure ? "10" : "failure");
  };

  return (
    <View style={styles.row}>
      <View style={styles.dragHandle}>
        <Ionicons name="reorder-three-outline" size={20} color={Colors.outlineVariant} />
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {item.exercise.name}
        </Text>
        <Text style={styles.muscle}>{item.exercise.muscle_group}</Text>

        <View style={styles.inputs}>
          {/* SETS */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>SETS</Text>
            <TextInput
              style={styles.input}
              value={String(item.sets)}
              onChangeText={onChangeSets}
              keyboardType="numeric"
              maxLength={2}
            />
          </View>

          <View style={styles.divider} />

          {/* REPS or failure toggle */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>REPS</Text>
            {isFailure ? (
              <TouchableOpacity style={styles.failurePill} onPress={toggleFailure} activeOpacity={0.8}>
                <Ionicons name="flame" size={11} color={Colors.background} />
                <Text style={styles.failurePillText}>FAILURE</Text>
              </TouchableOpacity>
            ) : (
              <TextInput
                style={styles.input}
                value={String(item.reps)}
                onChangeText={onChangeReps}
                keyboardType="numeric"
                maxLength={4}
              />
            )}
          </View>

          {/* Until failure toggle button */}
          <TouchableOpacity
            style={[styles.failureToggle, isFailure && styles.failureToggleActive]}
            onPress={toggleFailure}
            activeOpacity={0.8}
          >
            <Ionicons
              name="flame-outline"
              size={14}
              color={isFailure ? Colors.background : Colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="trash-outline" size={18} color={Colors.outlineVariant} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: Colors.borderSubtle,
    borderRightColor: Colors.borderSubtle,
    borderBottomColor: Colors.borderSubtle,
  },
  dragHandle: {
    paddingHorizontal: 2,
  },
  body: {
    flex: 1,
    gap: 6,
  },
  name: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
    textTransform: "uppercase",
  },
  muscle: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.secondary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  inputs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    color: Colors.secondary,
    fontFamily: Fonts.label,
  },
  input: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    minWidth: 44,
    textAlign: "center",
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: Colors.borderSubtle,
  },
  failurePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FF4D4D",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  failurePillText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    fontFamily: Fonts.label,
    color: Colors.background,
  },
  failureToggle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  failureToggleActive: {
    backgroundColor: "#FF4D4D",
    borderColor: "#FF4D4D",
  },
});
