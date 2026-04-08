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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";
import { useAppFonts } from "@/hooks/useAppFonts";
import { useAuth } from "@/context/AuthContext";
import { ScreenBackground } from "@/components/ui/ScreenBackground";
import { AppLogo } from "@/components/ui/AppLogo";
import { InputField } from "@/components/ui/InputField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

export default function LoginScreen() {
  const fontsLoaded = useAppFonts();
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Invalid credentials.");
        return;
      }

      await login(data.token, data.user);
      const profileRes = await fetch(`${API_BASE}/profile`, {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      if (profileRes.status === 404) {
        router.replace("/(auth)/setup-profile");
      } else {
        switch (data.user.role) {
          case "trainer":
            router.replace("/(trainer)/home");
            break;
          case "gym_admin":
            router.replace("/(admin)/home");
            break;
          default:
            router.replace("/(tabs)/home");
        }
      }
    } catch (err) {
      setError("Something went wrong. Check your connection.");
      console.error(err);
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
                {"WELCOME\n"}
                <Text style={styles.heroAccent}>BACK.</Text>
              </Text>
              <Text style={styles.heroSubtitle}>
                Sign in to resume your peak performance journey.
              </Text>
            </View>

            <View style={styles.form}>
              <InputField
                label="Email Address"
                placeholder="name@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />

              <InputField
                label="Password"
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                labelRight={
                  <TouchableOpacity
                    onPress={() => router.push("/(auth)/forgot-password")}
                  >
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                  </TouchableOpacity>
                }
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
                label={loading ? "Signing in..." : "Login"}
                onPress={handleLogin}
                style={styles.buttonSpacing}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
            <Text style={styles.footerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
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
  forgotText: {
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: "700",
    textTransform: "uppercase",
    color: Colors.secondaryDim,
    fontFamily: Fonts.label,
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
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 32,
  },
  footerText: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.body,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
    fontFamily: Fonts.label,
  },
});
