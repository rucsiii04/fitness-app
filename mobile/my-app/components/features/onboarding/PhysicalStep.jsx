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
import { useRouter } from "expo-router";
import { Colors, Fonts } from "@/constants/theme";
import { OnboardingLayout } from "@/components/ui/OnboardingLayout";

export function PhysicalStep({ data, onChange, onNext }) {
  return (
    <OnboardingLayout
      step={2}
      onNext={() => {
        if (!data.gender || !data.height || !data.current_weight) return;
        onNext();
      }}
      nextLabel="Next"
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Text style={styles.title}>
            PHYSICAL{"\n"}
            <Text style={styles.titleAccent}>PROFILE</Text>
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Biological Sex</Text>
          <View style={styles.genderRow}>
            {["male", "female"].map((g) => (
              <TouchableOpacity
                key={g}
                style={[
                  styles.genderCard,
                  data.gender === g && styles.genderCardSelected,
                ]}
                onPress={() => onChange({ gender: g })}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={g === "male" ? "male" : "female"}
                  size={24}
                  color={
                    data.gender === g
                      ? Colors.background
                      : Colors.onSurfaceVariant
                  }
                />
                <Text
                  style={[
                    styles.genderLabel,
                    data.gender === g && styles.genderLabelSelected,
                  ]}
                >
                  {g.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Height</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.bigInput}
              placeholder="180"
              placeholderTextColor={Colors.outlineVariant}
              keyboardType="numeric"
              value={data.height ? String(data.height) : ""}
              onChangeText={(v) => onChange({ height: v })}
              selectionColor={Colors.secondary}
            />
            <Text style={styles.unit}>CM</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Weight</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.bigInput}
              placeholder="75.0"
              placeholderTextColor={Colors.outlineVariant}
              keyboardType="numeric"
              value={data.current_weight ? String(data.current_weight) : ""}
              onChangeText={(v) => onChange({ current_weight: v })}
              selectionColor={Colors.secondary}
            />
            <Text style={styles.unit}>KG</Text>
          </View>
        </View>
      </ScrollView>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 28,
  },
  hero: {
    paddingTop: 24,
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
  section: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: Colors.textPrimary,
    fontFamily: Fonts.label,
  },
  genderRow: {
    flexDirection: "row",
    gap: 12,
  },
  genderCard: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 20,
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerHighest,
    borderWidth: 2,
    borderColor: "transparent",
  },
  genderCardSelected: {
    backgroundColor: Colors.primaryDim,
    borderColor: Colors.primaryDim,
  },
  genderLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.label,
  },
  genderLabelSelected: {
    color: Colors.background,
  },
  inputWrapper: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  bigInput: {
    flex: 1,
    fontSize: 40,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    paddingVertical: 20,
    letterSpacing: -2,
  },
  unit: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.outlineVariant,
    fontFamily: Fonts.headline,
  },
});
