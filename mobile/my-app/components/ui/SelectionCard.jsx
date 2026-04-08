import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";

export function SelectionCard({
  label,
  description,
  icon,
  selected,
  onPress,
  level,
}) {
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {selected && (
        <View style={styles.checkBadge}>
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={Colors.primaryDim}
          />
        </View>
      )}

      <View style={[styles.iconBox, selected && styles.iconBoxSelected]}>
        <Ionicons
          name={icon}
          size={24}
          color={selected ? Colors.background : Colors.secondary}
        />
      </View>

      {level && <Text style={styles.level}>{level}</Text>}

      <Text style={[styles.label, selected && styles.labelSelected]}>
        {label}
      </Text>

      {description && <Text style={styles.description}>{description}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: "transparent",
    gap: 8,
  },
  cardSelected: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderColor: Colors.primaryDimAlpha,
    shadowColor: Colors.primaryDim,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
  checkBadge: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxSelected: {
    backgroundColor: Colors.primaryDim,
  },
  level: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: Colors.secondary,
    fontFamily: Fonts.label,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    textTransform: "uppercase",
    letterSpacing: -0.5,
  },
  labelSelected: {
    color: Colors.primaryDim,
  },
  description: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.body,
    lineHeight: 18,
  },
});
