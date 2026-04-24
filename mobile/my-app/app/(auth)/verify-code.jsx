import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
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
import { PrimaryButton } from "@/components/ui/PrimaryButton";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;
const CODE_LENGTH = 6;

export default function VerifyCodeScreen() {
  const fontsLoaded = useAppFonts();
  const router = useRouter();
  const { email } = useLocalSearchParams();

  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef([]);

  const handleDigitChange = (value, index) => {
    const cleaned = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);
    if (cleaned && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otp = digits.join("");
    if (otp.length < CODE_LENGTH) {
      setError("Please enter the full 6-digit code.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Invalid code.");
        return;
      }

      router.push({
        pathname: "/(auth)/new-password",
        params: { userId: data.userId, otp },
      });
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
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
                {"ENTER\n"}
                <Text style={styles.heroAccent}>CODE.</Text>
              </Text>
              <Text style={styles.heroSubtitle}>
                We sent a 6-digit code to{"\n"}
                <Text style={styles.emailHighlight}>{email}</Text>
              </Text>
            </View>

            <View style={styles.codeRow}>
              {digits.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(r) => (inputRefs.current[i] = r)}
                  style={[styles.codeBox, digit ? styles.codeBoxFilled : null]}
                  value={digit}
                  onChangeText={(v) => handleDigitChange(v, i)}
                  onKeyPress={(e) => handleKeyPress(e, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

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
              label={loading ? "Verifying..." : "Verify Code"}
              onPress={handleVerify}
              style={styles.buttonSpacing}
            />

            <TouchableOpacity
              style={styles.resendRow}
              onPress={() => router.back()}
            >
              <Text style={styles.resendText}>Didn't receive a code? </Text>
              <Text style={styles.resendLink}>Resend</Text>
            </TouchableOpacity>
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    gap: 12,
  },
  backBtn: { padding: 4 },
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
  },
  emailHighlight: {
    color: Colors.textPrimary,
    fontFamily: Fonts.label,
    fontWeight: "700",
  },
  codeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 28,
  },
  codeBox: {
    flex: 1,
    height: 56,
    borderWidth: 1.5,
    borderColor: Colors.borderSubtle,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    paddingVertical: 0,
    includeFontPadding: false,
  },
  codeBoxFilled: {
    borderColor: Colors.secondary,
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
    marginBottom: 20,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: Colors.error,
    fontFamily: Fonts.body,
    lineHeight: 20,
  },
  buttonSpacing: {
    marginTop: 4,
  },
  resendRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  resendText: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.body,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
    fontFamily: Fonts.label,
  },
});
