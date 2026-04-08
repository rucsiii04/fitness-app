import React, { useState } from "react";
import { ScrollView, Text, StyleSheet, View } from "react-native";
import { Colors, Fonts } from "@/constants/theme";
import { OnboardingLayout } from "@/components/ui/OnboardingLayout";
import { SelectionCard } from "@/components/ui/SelectionCard";

const GOALS = [
  {
    value: "lose_weight",
    label: "Lose Weight",
    description:
      "Metabolic conditioning optimized for fat oxidation and endurance.",
    icon: "scale-outline",
  },
  {
    value: "gain_weight",
    label: "Gain Muscle",
    description:
      "Hypertrophy-focused training designed for elite strength and volume.",
    icon: "barbell-outline",
  },
  {
    value: "maintain",
    label: "Build Endurance",
    description:
      "High-performance aerobic programming for stamina and cardiovascular power.",
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
      nextLabel="Next"
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.title}>
            CHOOSE YOUR <Text style={styles.titleAccent}>TARGET</Text>
          </Text>
          <Text style={styles.subtitle}>
            Define your primary objective. Our system will architect a precision
            program tailored to your profile.
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
