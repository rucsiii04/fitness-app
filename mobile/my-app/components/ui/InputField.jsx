import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { Colors, Fonts } from "@/constants/theme";

export function InputField({ label, rightElement, labelRight, ...inputProps }) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {labelRight}
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.outlineVariant}
          selectionColor={Colors.secondary}
          {...inputProps}
        />
        {rightElement && <View style={styles.rightSlot}>{rightElement}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "700",
    textTransform: "uppercase",
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.label,
  },
  inputContainer: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 20,
    fontSize: 15,
    color: Colors.textPrimary,
    fontFamily: Fonts.body,
  },
  rightSlot: {
    paddingRight: 16,
  },
});