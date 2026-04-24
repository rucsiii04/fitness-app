import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";
import { useAppFonts } from "@/hooks/useAppFonts";
import { ScreenBackground } from "@/components/ui/ScreenBackground";
import { AppLogo } from "@/components/ui/AppLogo";
import { InputField } from "@/components/ui/InputField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

export default function NewPasswordScreen() {
  const fontsLoaded = useAppFonts();
  const router = useRouter();
  const { userId, otp } = useLocalSearchParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      setError("Please fill in both fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/reset-password-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, otp, newPassword: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Something went wrong.");
        return;
      }

      router.replace("/(auth)/login");
    } catch {
      setError("Something went wrong. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) return null;

  return (
    <ScreenBackground>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <AppLogo />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.heroSection}>
              <Text style={styles.heroTitle}>
                {"NEW\n"}
                <Text style={styles.heroAccent}>PASSWORD.</Text>
              </Text>
              <Text style={styles.heroSubtitle}>
                Choose a strong password for your account.
              </Text>
            </View>

            <View style={styles.form}>
              <InputField
                label="New Password"
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                rightElement={
                  <TouchableOpacity onPress={() => setShowPassword((p) => !p)}>
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={Colors.onSurfaceVariant}
                    />
                  </TouchableOpacity>
                }
              />

              <InputField
                label="Confirm Password"
                placeholder="••••••••"
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                rightElement={
                  <TouchableOpacity onPress={() => setShowConfirm((p) => !p)}>
                    <Ionicons
                      name={showConfirm ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={Colors.onSurfaceVariant}
                    />
                  </TouchableOpacity>
                }
              />

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={16}
                    color={Colors.error}
                  />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <PrimaryButton
                label={loading ? "Saving..." : "Set New Password"}
                onPress={handleReset}
                style={styles.buttonSpacing}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  heroSection: {
    marginTop: 40,
    marginBottom: 40,
  },
  heroTitle: {
    fontSize: 52,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    letterSpacing: -2,
    lineHeight: 52,
    marginBottom: 16,
    textTransform: "uppercase",
  },
  heroAccent: {
    color: Colors.secondary,
    fontFamily: Fonts.headline,
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.body,
    maxWidth: 280,
  },
  form: {
    gap: 20,
  },
  buttonSpacing: {
    marginTop: 12,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(255,115,81,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,115,81,0.2)",
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: Colors.error,
    fontFamily: Fonts.body,
    lineHeight: 20,
  },
});
