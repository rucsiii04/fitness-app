import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";

const FAILURE_COLOR = "#FF6B35";

export function SetRow({
  setNumber,
  weight,
  reps,
  status,
  onWeightChange,
  onRepsChange,
  onComplete,
}) {
  const isCompleted  = status === "completed";
  const isActive     = status === "active";
  const isPending    = status === "pending";
  const isToFailure  = isActive && reps === "failure";

  const inputsLocked = isCompleted || isPending;

  return (
    <View style={[
      styles.row,
      isActive  && styles.rowActive,
      isPending && styles.rowPending,
    ]}>
      <Text style={[styles.setNumber, isCompleted && styles.setNumberDim]}>
        {setNumber}
      </Text>

      {/* KG */}
      <View style={styles.cell}>
        <TextInput
          style={[styles.input, isCompleted && styles.inputDim]}
          value={String(weight)}
          onChangeText={onWeightChange}
          keyboardType="numeric"
          selectionColor={Colors.secondary}
          editable={!inputsLocked}
        />
      </View>

      {/* REPS */}
      <View style={styles.cell}>
        <TextInput
          style={[
            styles.input,
            isCompleted && styles.inputDim,
            isToFailure && styles.inputFailure,
          ]}
          value={reps === "failure" ? "MAX" : String(reps)}
          onChangeText={onRepsChange}
          keyboardType="numeric"
          selectionColor={Colors.secondary}
          editable={!inputsLocked}
        />
        {isActive && (
          <TouchableOpacity
            onPress={() => onRepsChange(isToFailure ? "8" : "failure")}
            hitSlop={{ top: 6, bottom: 6, left: 10, right: 10 }}
            style={styles.flameBtn}
          >
            <Ionicons
              name={isToFailure ? "flame" : "flame-outline"}
              size={13}
              color={isToFailure ? FAILURE_COLOR : Colors.outlineVariant}
            />
            <Text style={[styles.flameLabel, isToFailure && styles.flameLabelActive]}>
              to failure
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Checkmark */}
      <View style={styles.checkCell}>
        <TouchableOpacity
          onPress={onComplete}
          disabled={!isActive}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={isCompleted ? "checkmark-circle" : "checkmark"}
            size={22}
            color={
              isCompleted ? Colors.primary
              : isActive   ? Colors.onSurfaceVariant
              :              Colors.outlineVariant
            }
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  rowActive: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 12,
    borderBottomWidth: 0,
    marginVertical: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowPending: {
    opacity: 0.3,
  },
  setNumber: {
    width: 36,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
  },
  setNumberDim: {
    color: Colors.onSurfaceVariant,
  },
  cell: {
    flex: 1,
    alignItems: "center",
  },
  input: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    textAlign: "center",
    padding: 4,
    minWidth: 50,
  },
  inputDim: {
    color: Colors.onSurfaceVariant,
    opacity: 0.6,
  },
  inputFailure: {
    color: FAILURE_COLOR,
    fontSize: 16,
  },
  flameBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  flameLabel: {
    fontSize: 9,
    fontWeight: "700",
    fontFamily: Fonts.label,
    letterSpacing: 0.5,
    color: Colors.outlineVariant,
  },
  flameLabelActive: {
    color: FAILURE_COLOR,
  },
  checkCell: {
    width: 40,
    alignItems: "flex-end",
    justifyContent: "center",
  },
});
