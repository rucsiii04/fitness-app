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

export default function RegisterScreen() {
  const fontsLoaded = useAppFonts();
  const router = useRouter();
  const { login } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (!firstName || !lastName || !phone || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // handle validation errors array from backend
        if (data.errors && data.errors.length > 0) {
          const messages = data.errors.map((e) => e.message).join("\n");
          setError(messages);
        } else {
          setError(data.message || "Registration failed.");
        }
        return;
      }

      await login(data.token, data.user);
      router.replace("/(tabs)/home");
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
                {"UNLOCK\n"}
                <Text style={styles.heroAccent}>PRECISION.</Text>
              </Text>
              <Text style={styles.heroSubtitle}>
                Join the elite tier of performance tracking. High-tech tools for
                the high-performance athlete.
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.form}>
                <View style={styles.row}>
                  <View style={styles.rowItem}>
                    <InputField
                      label="First Name"
                      placeholder="Alex"
                      autoCapitalize="words"
                      value={firstName}
                      onChangeText={setFirstName}
                    />
                  </View>
                  <View style={styles.rowItem}>
                    <InputField
                      label="Last Name"
                      placeholder="Rivera"
                      autoCapitalize="words"
                      value={lastName}
                      onChangeText={setLastName}
                    />
                  </View>
                </View>

                <InputField
                  label="Phone Number"
                  placeholder="07xxxxxxxx"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />

                <InputField
                  label="Email Address"
                  placeholder="alex@performance.tech"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />

                <InputField
                  label="Password"
                  placeholder="••••••••••••"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  rightElement={
                    <TouchableOpacity
                      onPress={() => setShowPassword((p) => !p)}
                    >
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
                  label={loading ? "Creating Account..." : "Create Account"}
                  onPress={handleRegister}
                  style={styles.buttonSpacing}
                />

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>Secure Registration</Text>
                  <View style={styles.dividerLine} />
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
            <Text style={styles.footerLink}>Login</Text>
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
    marginTop: 32,
    marginBottom: 32,
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
    color: Colors.primary,
    fontFamily: Fonts.headline,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 24,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.body,
    maxWidth: 300,
  },
  card: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 40,
    elevation: 8,
  },
  form: {
    gap: 20,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  rowItem: {
    flex: 1,
  },
  buttonSpacing: {
    marginTop: 4,
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
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderSubtle,
  },
  dividerText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.label,
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
    color: Colors.secondary,
    fontFamily: Fonts.label,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
