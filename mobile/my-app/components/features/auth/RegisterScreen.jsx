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

const PASSWORD_RULES = [
  { id: "length",  label: "Minim 8 caractere",    test: (p) => p.length >= 8 },
  { id: "upper",   label: "O literă mare (A-Z)",  test: (p) => /[A-Z]/.test(p) },
  { id: "lower",   label: "O literă mică (a-z)",  test: (p) => /[a-z]/.test(p) },
  { id: "number",  label: "O cifră (0-9)",         test: (p) => /[0-9]/.test(p) },
  { id: "symbol",  label: "Un simbol (!@#$…)",     test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function PasswordRules({ password }) {
  if (!password) return null;
  const allOk = PASSWORD_RULES.every((r) => r.test(password));
  return (
    <View style={ruleStyles.container}>
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(password);
        return (
          <View key={rule.id} style={ruleStyles.row}>
            <Ionicons
              name={ok ? "checkmark-circle" : "ellipse-outline"}
              size={14}
              color={ok ? Colors.primary : Colors.onSurfaceVariant}
            />
            <Text style={[ruleStyles.text, ok && ruleStyles.textOk]}>
              {rule.label}
            </Text>
          </View>
        );
      })}
      {allOk && (
        <View style={ruleStyles.strongRow}>
          <Ionicons name="shield-checkmark" size={13} color={Colors.primary} />
          <Text style={ruleStyles.strongText}>Parolă puternică</Text>
        </View>
      )}
    </View>
  );
}

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
      setError("Completează toate câmpurile.");
      return;
    }
    if (!PASSWORD_RULES.every((r) => r.test(password))) {
      setError("Parola nu îndeplinește toate cerințele de mai jos.");
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
          setError(data.message || "Înregistrare eșuată.");
        }
        return;
      }

      await login(data.token, data.user);
      router.replace("/(onboarding)");
    } catch (err) {
      setError("Ceva a mers greșit. Verifică conexiunea.");
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
                {"ÎNCEPE\n"}
                <Text style={styles.heroAccent}>ACUM.</Text>
              </Text>
              <Text style={styles.heroSubtitle}>
                Creează-ți contul și începe să îți urmărești progresul.
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.form}>
                <View style={styles.row}>
                  <View style={styles.rowItem}>
                    <InputField
                      label="Prenume"
                      placeholder="Alex"
                      autoCapitalize="words"
                      value={firstName}
                      onChangeText={setFirstName}
                    />
                  </View>
                  <View style={styles.rowItem}>
                    <InputField
                      label="Nume"
                      placeholder="Popescu"
                      autoCapitalize="words"
                      value={lastName}
                      onChangeText={setLastName}
                    />
                  </View>
                </View>

                <InputField
                  label="Număr de telefon"
                  placeholder="07xxxxxxxx"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />

                <InputField
                  label="Adresă email"
                  placeholder="alex@exemplu.ro"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />

                <InputField
                  label="Parolă"
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

                <PasswordRules password={password} />

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
                  label={loading ? "Se creează contul..." : "Creează cont"}
                  onPress={handleRegister}
                  style={styles.buttonSpacing}
                />

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>Înregistrare securizată</Text>
                  <View style={styles.dividerLine} />
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Ai deja un cont? </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
            <Text style={styles.footerLink}>Conectează-te</Text>
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

const ruleStyles = StyleSheet.create({
  container: {
    gap: 7,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  text: {
    fontSize: 12,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
  },
  textOk: {
    color: Colors.primary,
  },
  strongRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(209,255,0,0.15)",
  },
  strongText: {
    fontSize: 11,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 0.5,
  },
});
