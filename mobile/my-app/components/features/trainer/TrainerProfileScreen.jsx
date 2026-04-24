import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors, Fonts } from "@/constants/theme";
import { useAppFonts } from "@/hooks/useAppFonts";
import { ScreenBackground } from "@/components/ui/ScreenBackground";
import { useAuth } from "@/context/AuthContext";
import { fetchTrainerProfile, updateTrainerProfile } from "@/services/trainerDashboardService";

function InputField({ label, value, onChangeText, placeholder, keyboardType, multiline, numberOfLines }) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        keyboardType={keyboardType ?? "default"}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}

export default function TrainerProfileScreen() {
  const fontsLoaded = useAppFonts();
  const router = useRouter();
  const { token, user, logout } = useAuth();

  const [specialization, setSpecialization] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  const initials = `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`.toUpperCase();

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const profile = await fetchTrainerProfile(token);
      if (profile) {
        setSpecialization(profile.specialization ?? "");
        setExperienceYears(profile.experience_years?.toString() ?? "");
        setBio(profile.bio ?? "");
      }
    } catch {
      /* silent */
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!specialization.trim() || !experienceYears.trim()) {
      Alert.alert("Eroare", "Specializarea și anii de experiență sunt obligatorii.");
      return;
    }
    const years = Number(experienceYears);
    if (isNaN(years) || years < 0 || years > 50) {
      Alert.alert("Eroare", "Anii de experiență trebuie să fie între 0 și 50.");
      return;
    }
    setSaving(true);
    try {
      await updateTrainerProfile({ specialization: specialization.trim(), experience_years: years, bio: bio.trim() }, token);
      Alert.alert("Succes", "Profilul a fost salvat.");
    } catch (err) {
      Alert.alert("Eroare", err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Deconectare",
      "Ești sigur că vrei să te deconectezi?",
      [
        { text: "Anulează", style: "cancel" },
        { text: "Da, deconectează", style: "destructive", onPress: logout },
      ],
    );
  };

  if (!fontsLoaded) return null;

  return (
    <ScreenBackground>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Profilul Meu</Text>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.avatarSection}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <Text style={styles.userName}>{user?.first_name} {user?.last_name}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>Antrenor</Text>
              </View>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>Informații Profesionale</Text>
              <InputField
                label="Specializare"
                value={specialization}
                onChangeText={setSpecialization}
                placeholder="ex: Fitness, CrossFit, Yoga..."
              />
              <InputField
                label="Ani de experiență"
                value={experienceYears}
                onChangeText={setExperienceYears}
                placeholder="ex: 5"
                keyboardType="numeric"
              />
              <InputField
                label="Biografie"
                value={bio}
                onChangeText={setBio}
                placeholder="Descrie-te pe scurt..."
                multiline
                numberOfLines={5}
              />

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color={Colors.background} />
                ) : (
                  <Text style={styles.saveBtnText}>Salvează Profilul</Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color={Colors.error} />
              <Text style={styles.logoutText}>Deconectare</Text>
            </TouchableOpacity>

            <View style={styles.bottomPadding} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  scroll: { padding: 20, gap: 20 },
  avatarSection: { alignItems: "center", paddingVertical: 16, gap: 10 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryDimAlphaLight,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 26,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.primary,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
  },
  roleBadge: {
    backgroundColor: Colors.primaryDimAlphaLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleText: { fontSize: 12, color: Colors.primary, fontFamily: Fonts.label },
  formCard: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fieldWrapper: { gap: 6 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: Fonts.body,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  inputMultiline: {
    minHeight: 110,
    paddingTop: 12,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.background,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.error,
  },
  bottomPadding: { height: 110 },
});
