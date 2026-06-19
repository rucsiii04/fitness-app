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
    label: "Afecțiune cardiacă",
    icon: "heart-outline",
    color: Colors.errorDim,
  },
  {
    value: "asthma",
    label: "Astm / Respirație",
    icon: "wind-outline",
    color: Colors.secondary,
  },
  {
    value: "joint",
    label: "Dureri articulare",
    icon: "body-outline",
    color: Colors.tertiaryDim,
  },
  {
    value: "blood_pressure",
    label: "Tensiune arterială",
    icon: "speedometer-outline",
    color: Colors.primaryDim,
  },
];

export function MedicalStep({ data, onChange, onSubmit, loading, onBack }) {
  const selected = data.restrictions || [];

  const toggleRestriction = (value) => {
    const current = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onChange({ restrictions: current });
  };

  return (
    <OnboardingLayout
      step={4}
      onNext={onSubmit}
      onBack={onBack}
      nextLabel="Finalizează"
      loading={loading}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Text style={styles.title}>
            RESTRICȚII{"\n"}
            <Text style={styles.titleAccent}>MEDICALE</Text>
          </Text>
        </View>

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

        <View style={styles.notesSection}>
          <View style={styles.notesLabel}>
            <Ionicons
              name="create-outline"
              size={16}
              color={Colors.secondary}
            />
            <Text style={styles.notesSectionLabel}>
              Alte detalii sau intervenții chirurgicale
            </Text>
          </View>
          <TextInput
            style={styles.textArea}
            placeholder="Descrie alte afecțiuni sau accidentări recente..."
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
            <Text style={styles.disclaimerBold}>Siguranță pe primul loc: </Text>
            Continuând, confirmi că ai consultat un medic înainte de a începe
            un nou program de exerciții.
          </Text>
        </View>
      </ScrollView>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 16,
  },
  hero: {
    paddingTop: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    letterSpacing: -1,
    lineHeight: 32,
    textTransform: "uppercase",
  },
  titleAccent: {
    color: Colors.primaryFixed,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  restrictionCard: {
    width: "47%",
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 12,
    padding: 14,
    gap: 8,
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
    borderRadius: 12,
    padding: 14,
    fontSize: 13,
    color: Colors.textPrimary,
    fontFamily: Fonts.body,
    minHeight: 80,
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
