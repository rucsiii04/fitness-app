import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,

  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors, Fonts } from "@/constants/theme";
import { ScreenBackground } from "@/components/ui/ScreenBackground";
import { AppLogo } from "@/components/ui/AppLogo";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

export function OnboardingLayout({
  children,
  step,
  totalSteps = 4,
  onNext,
  onBack,
  nextLabel = "Next",
  loading = false,
}) {
  const router = useRouter();

  return (
    <ScreenBackground>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onBack || (() => router.back())}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.primaryDim} />
          </TouchableOpacity>
          <AppLogo />
          <Text style={styles.stepText}>
            <Text style={styles.stepCurrent}>
              {String(step).padStart(2, "0")}
            </Text>
            <Text style={styles.stepTotal}>
              {" "}
              / {String(totalSteps).padStart(2, "0")}
            </Text>
          </Text>
        </View>

        <View style={styles.progressRow}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressSegment,
                i < step
                  ? styles.progressSegmentActive
                  : styles.progressSegmentInactive,
              ]}
            />
          ))}
        </View>

        <View style={styles.content}>{children}</View>

        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.backNav}
            onPress={onBack || (() => router.back())}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={Colors.onSurfaceVariant}
            />
            <Text style={styles.backNavText}>Back</Text>
          </TouchableOpacity>

          <PrimaryButton
            label={loading ? "..." : nextLabel}
            onPress={onNext}
            style={styles.nextButton}
          />
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  backButton: {
    padding: 4,
  },
  stepText: {
    fontFamily: Fonts.headline,
    fontSize: 13,
  },
  stepCurrent: {
    color: Colors.primaryDim,
    fontWeight: "700",
  },
  stepTotal: {
    color: Colors.outlineVariant,
  },
  progressRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 999,
  },
  progressSegmentActive: {
    backgroundColor: Colors.primaryDim,
  },
  progressSegmentInactive: {
    backgroundColor: Colors.surfaceContainerHighest,
  },
  content: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    backgroundColor: "rgba(14,14,14,0.8)",
  },
  backNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 12,
  },
  backNavText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.label,
  },
  nextButton: {
    width: "55%",
  },
});
