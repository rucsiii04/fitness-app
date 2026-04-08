import React from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";
import { OnboardingLayout } from "@/components/ui/OnboardingLayout";

const RESTRICTIONS = [
  {
    value: "heart",
    label: "Heart Condition",
    icon: "heart-outline",
    color: Colors.errorDim,
  },
  {
    value: "asthma",
    label: "Asthma / Breathing",
    icon: "wind-outline",
    color: Colors.secondary,
  },
  {
    value: "joint",
    label: "Joint or Bone Pain",
    icon: "body-outline",
    color: Colors.tertiaryDim,
  },
  {
    value: "blood_pressure",
    label: "High Blood Pressure",
    icon: "speedometer-outline",
    color: Colors.primaryDim,
  },
];

export function MedicalStep({ data, onChange, onSubmit, loading }) {
  const selected = data.restrictions || [];

  const toggleRestriction = (value) => {
    const current = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onChange({ restrictions: current });
  };

  const noRestrictions = data.no_restrictions || false;

  return (
    <OnboardingLayout
      step={4}
      onNext={onSubmit}
      nextLabel="Complete"
      loading={loading}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Text style={styles.title}>
            MEDICAL{"\n"}
            <Text style={styles.titleAccent}>RESTRICTIONS</Text>
          </Text>
          <View style={styles.progressPct}>
            <Text style={styles.pctText}>100%</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.toggleRow}
          onPress={() =>
            onChange({ no_restrictions: !noRestrictions, restrictions: [] })
          }
          activeOpacity={0.85}
        >
          <View style={styles.toggleText}>
            <Text style={styles.toggleLabel}>No medical restrictions</Text>
            <Text style={styles.toggleSub}>
              I am cleared for high-intensity activity
            </Text>
          </View>
          <View style={[styles.toggle, noRestrictions && styles.toggleActive]}>
            {noRestrictions && (
              <Ionicons name="checkmark" size={16} color={Colors.background} />
            )}
          </View>
        </TouchableOpacity>

        {!noRestrictions && (
          <View style={styles.grid}>
            {RESTRICTIONS.map((item) => {
              const isSelected = selected.includes(item.value);
              return (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.restrictionCard,
                    isSelected && styles.restrictionCardSelected,
                  ]}
                  onPress={() => toggleRestriction(item.value)}
                  activeOpacity={0.85}
                >
                  {isSelected && (
                    <View style={styles.checkBadge}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={Colors.primaryDim}
                      />
                    </View>
                  )}
                  <Ionicons name={item.icon} size={24} color={item.color} />
                  <Text style={styles.restrictionLabel}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.notesSection}>
          <View style={styles.notesLabel}>
            <Ionicons
              name="create-outline"
              size={16}
              color={Colors.secondary}
            />
            <Text style={styles.notesSectionLabel}>
              Other details or surgeries
            </Text>
          </View>
          <TextInput
            style={styles.textArea}
            placeholder="Describe any other conditions or recent injuries..."
            placeholderTextColor={Colors.outlineVariant}
            multiline
            numberOfLines={4}
            value={data.medical_restriction || ""}
            onChangeText={(v) => onChange({ medical_restriction: v })}
            selectionColor={Colors.secondary}
          />
        </View>

        <View style={styles.disclaimer}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={Colors.error}
          />
          <Text style={styles.disclaimerText}>
            <Text style={styles.disclaimerBold}>Safety First: </Text>
            By continuing, you acknowledge that you have consulted a medical
            professional before beginning a new exercise program.
          </Text>
        </View>
      </ScrollView>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 24,
  },
  hero: {
    paddingTop: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 42,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    letterSpacing: -2,
    lineHeight: 44,
    textTransform: "uppercase",
  },
  titleAccent: {
    color: Colors.primaryFixed,
  },
  progressPct: {
    paddingTop: 8,
  },
  pctText: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.secondary,
    letterSpacing: -1,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  toggleText: { gap: 4, flex: 1 },
  toggleLabel: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
  },
  toggleSub: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.body,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 999,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 16,
  },
  toggleActive: {
    backgroundColor: Colors.primaryDim,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  restrictionCard: {
    width: "47%",
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 16,
    padding: 20,
    gap: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  restrictionCardSelected: {
    borderColor: Colors.primaryDimAlpha,
    backgroundColor: Colors.surfaceContainerHighest,
  },
  checkBadge: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  restrictionLabel: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
  },
  notesSection: {
    gap: 10,
  },
  notesLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  notesSectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.label,
  },
  textArea: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 16,
    padding: 20,
    fontSize: 14,
    color: Colors.textPrimary,
    fontFamily: Fonts.body,
    minHeight: 120,
    textAlignVertical: "top",
  },
  disclaimer: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: "flex-start",
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.body,
    lineHeight: 18,
  },
  disclaimerBold: {
    color: Colors.textPrimary,
    fontWeight: "700",
  },
});
