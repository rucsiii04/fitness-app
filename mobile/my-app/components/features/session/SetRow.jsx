import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";

export function SetRow({ setNumber, weight, reps, status, onWeightChange, onRepsChange, onComplete }) {
  const isCompleted = status === "completed";
  const isActive = status === "active";
  const isPending = status === "pending";

  return (
    <View style={[
      styles.row,
      isActive && styles.rowActive,
      isPending && styles.rowPending,
    ]}>
      <Text style={[styles.setNumber, isCompleted && styles.setNumberDim]}>
        {setNumber}
      </Text>

      <View style={styles.cell}>
        <TextInput
          style={[styles.input, isCompleted && styles.inputDim]}
          value={String(weight)}
          onChangeText={onWeightChange}
          keyboardType="numeric"
          selectionColor={Colors.secondary}
         
        />
      </View>

      <View style={styles.cell}>
        <TextInput
          style={[styles.input, isCompleted && styles.inputDim]}
          value={String(reps)}
          onChangeText={onRepsChange}
          keyboardType="numeric"
          selectionColor={Colors.secondary}
     
        />
      </View>

      <TouchableOpacity
        style={styles.checkCell}
        onPress={onComplete}
        disabled={isPending}
      >
        <Ionicons
          name={isCompleted ? "checkmark-circle" : "checkmark"}
          size={22}
          color={
            isCompleted
              ? Colors.primary
              : isActive
              ? Colors.onSurfaceVariant
              : Colors.outlineVariant
          }
        />
      </TouchableOpacity>
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
  checkCell: {
    width: 40,
    alignItems: "flex-end",
  },
});