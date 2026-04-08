import React from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import { Colors, Fonts } from "@/constants/theme";
import { OnboardingLayout } from "@/components/ui/OnboardingLayout";
import { SelectionCard } from "@/components/ui/SelectionCard";

const ACTIVITIES = [
  {
    value: "sedentary",
    label: "Sedentary",
    description:
      "Typical office job, minimal movement, no intentional exercise.",
    icon: "bed-outline",
    level: "Level 01",
  },
  {
    value: "light",
    label: "Lightly Active",
    description: "Light exercise or sports 1-3 days per week.",
    icon: "walk-outline",
    level: "Level 02",
  },
  {
    value: "moderate",
    label: "Moderately Active",
    description: "Moderate exercise or sports 3-5 days per week.",
    icon: "barbell-outline",
    level: "Level 03",
  },
  {
    value: "active",
    label: "Very Active",
    description: "Hard exercise or sports 6-7 days per week.",
    icon: "bicycle-outline",
    level: "Level 04",
  },
  {
    value: "very_active",
    label: "Extra Active",
    description:
      "Very hard exercise, training 2x per day, or physical labor job.",
    icon: "flash-outline",
    level: "Level 05",
  },
];

export function ActivityStep({ data, onChange, onNext }) {
  return (
    <OnboardingLayout
      step={3}
      onNext={() => {
        if (!data.activity_level) return;
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
            DEFINE YOUR <Text style={styles.titleAccent}>OUTPUT</Text>
          </Text>
          <Text style={styles.subtitle}>
            Select the activity level that best reflects your daily lifestyle.
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
