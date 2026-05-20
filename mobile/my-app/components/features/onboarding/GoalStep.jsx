import React, { useState } from "react";
import { ScrollView, Text, StyleSheet, View } from "react-native";
import { Colors, Fonts } from "@/constants/theme";
import { OnboardingLayout } from "@/components/ui/OnboardingLayout";
import { SelectionCard } from "@/components/ui/SelectionCard";

const GOALS = [
  {
    value: "lose_weight",
    label: "Slăbit",
    description:
      "Condiționare metabolică optimizată pentru arderea grăsimilor și rezistență.",
    icon: "scale-outline",
  },
  {
    value: "gain_weight",
    label: "Masă musculară",
    description:
      "Antrenament axat pe hipertrofie, conceput pentru forță și volum de elită.",
    icon: "barbell-outline",
  },
  {
    value: "maintain",
    label: "Rezistență",
    description:
      "Program aerobic de înaltă performanță pentru anduranță și putere cardiovasculară.",
    icon: "flash-outline",
  },
];

export function GoalStep({ data, onChange, onNext }) {

  return (
    <OnboardingLayout
      step={1}
      onNext={() => {
        if (!data.main_goal) return;
        onNext();
      }}
      nextLabel="Continuă"
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.title}>
            ALEGE-ȚI <Text style={styles.titleAccent}>OBIECTIVUL</Text>
          </Text>
          <Text style={styles.subtitle}>
            Definește-ți scopul principal. Sistemul nostru va construi un program
            precis adaptat profilului tău.
          </Text>
        </View>

        <View style={styles.grid}>
          {GOALS.map((goal) => (
            <SelectionCard
              key={goal.value}
              label={goal.label}
              description={goal.description}
              icon={goal.icon}
              selected={data.main_goal === goal.value}
              onPress={() => onChange({ main_goal: goal.value })}
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
  grid: {
    gap: 12,
  },
});
