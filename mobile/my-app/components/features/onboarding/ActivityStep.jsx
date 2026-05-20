import React from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import { Colors, Fonts } from "@/constants/theme";
import { OnboardingLayout } from "@/components/ui/OnboardingLayout";
import { SelectionCard } from "@/components/ui/SelectionCard";

const ACTIVITIES = [
  {
    value: "sedentary",
    label: "Sedentar",
    description:
      "Job la birou, mișcare minimă, fără exerciții intenționate.",
    icon: "bed-outline",
    level: "Nivel 01",
  },
  {
    value: "light",
    label: "Ușor activ",
    description: "Exerciții ușoare sau sport 1-3 zile pe săptămână.",
    icon: "walk-outline",
    level: "Nivel 02",
  },
  {
    value: "moderate",
    label: "Moderat activ",
    description: "Exerciții moderate sau sport 3-5 zile pe săptămână.",
    icon: "barbell-outline",
    level: "Nivel 03",
  },
  {
    value: "active",
    label: "Foarte activ",
    description: "Exerciții intense sau sport 6-7 zile pe săptămână.",
    icon: "bicycle-outline",
    level: "Nivel 04",
  },
  {
    value: "very_active",
    label: "Extrem de activ",
    description:
      "Exerciții foarte intense, antrenament de 2x pe zi sau muncă fizică.",
    icon: "flash-outline",
    level: "Nivel 05",
  },
];

export function ActivityStep({ data, onChange, onNext, onBack }) {
  return (
    <OnboardingLayout
      step={3}
      onNext={() => {
        if (!data.activity_level) return;
        onNext();
      }}
      onBack={onBack}
      nextLabel="Continuă"
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.title}>
            NIVELUL TĂU <Text style={styles.titleAccent}>DE ACTIVITATE</Text>
          </Text>
          <Text style={styles.subtitle}>
            Selectează nivelul de activitate care reflectă cel mai bine stilul tău de viață zilnic.
          </Text>
        </View>

        <View style={styles.list}>
          {ACTIVITIES.map((item) => (
            <SelectionCard
              key={item.value}
              label={item.label}
              description={item.description}
              icon={item.icon}
              level={item.level}
              selected={data.activity_level === item.value}
              onPress={() => onChange({ activity_level: item.value })}
            />
          ))}
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
    gap: 12,
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
    color: Colors.primaryDim,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 24,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.body,
  },
  list: {
    gap: 12,
  },
});
