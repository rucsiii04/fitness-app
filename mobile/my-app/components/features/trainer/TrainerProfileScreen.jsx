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
  Modal,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Colors, Fonts } from "@/constants/theme";
import { useAppFonts } from "@/hooks/useAppFonts";
import { ScreenBackground } from "@/components/ui/ScreenBackground";
import { useAuth } from "@/context/AuthContext";
import { fetchTrainerProfile, updateTrainerProfile } from "@/services/trainerDashboardService";

function ConfirmModal({ visible, title, message, buttons, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <TouchableOpacity style={cm.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={cm.card} activeOpacity={1} onPress={() => {}}>
          <View style={cm.handle} />
          <Text style={cm.title}>{title}</Text>
          {message ? <Text style={cm.message}>{message}</Text> : null}
          <View style={cm.btnCol}>
            {buttons.map((btn, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  cm.btn,
                  btn.variant === "destructive" && cm.btnDestructive,
                  btn.variant === "primary" && cm.btnPrimary,
                  btn.variant === "cancel" && cm.btnCancel,
                ]}
                onPress={btn.onPress}
                activeOpacity={0.8}
                disabled={btn.disabled}
              >
                {btn.loading ? (
                  <ActivityIndicator
                    size="small"
                    color={btn.variant === "cancel" ? Colors.onSurfaceVariant : Colors.background}
                  />
                ) : (
                  <Text style={[
                    cm.btnText,
                    btn.variant === "destructive" && cm.btnTextDestructive,
                    btn.variant === "primary" && cm.btnTextPrimary,
                    btn.variant === "cancel" && cm.btnTextCancel,
                  ]}>
                    {btn.label}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const cm = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 24,
    gap: 16,
  },
  handle: {
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.outlineVariant,
    alignSelf: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
    textAlign: "center",
  },
  message: {
    fontSize: 13,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 19,
  },
  btnCol: { gap: 8, marginTop: 4 },
  btn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  btnDestructive: { backgroundColor: Colors.error, borderColor: Colors.error },
  btnPrimary: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  btnCancel: { backgroundColor: "transparent", borderColor: Colors.borderSubtle },
  btnText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  btnTextDestructive: { color: Colors.background },
  btnTextPrimary: { color: Colors.background },
  btnTextCancel: { color: Colors.onSurfaceVariant },
});

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
  const { token, user, logout } = useAuth();

  const [specialization, setSpecialization] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [bio, setBio] = useState("");
  const [modal, setModal] = useState({ visible: false, title: "", message: "", buttons: [] });
  const closeModal = () => setModal((m) => ({ ...m, visible: false }));
  const showInfo = (title, message) => setModal({
    visible: true, title, message,
    buttons: [{ label: "OK", variant: "cancel", onPress: () => setModal((m) => ({ ...m, visible: false })) }],
  });
  const [imageUri, setImageUri] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);
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
        setExistingImageUrl(profile.image_url ?? null);
      }
    } catch {
      /* silent */
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showInfo("Permisiune necesară", "Acordă acces la galerie pentru a selecta o fotografie.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!specialization.trim() || !experienceYears.trim()) {
      showInfo("Eroare", "Specializarea și anii de experiență sunt obligatorii.");
      return;
    }
    const years = Number(experienceYears);
    if (isNaN(years) || years < 0 || years > 50) {
      showInfo("Eroare", "Anii de experiență trebuie să fie între 0 și 50.");
      return;
    }
    setSaving(true);
    try {
      const updated = await updateTrainerProfile(
        { specialization: specialization.trim(), experience_years: years, bio: bio.trim() },
        imageUri,
        token,
      );
      setExistingImageUrl(updated.image_url ?? existingImageUrl);
      setImageUri(null);
      setModal({
        visible: true,
        title: "Profil salvat",
        message: "Modificările au fost salvate cu succes.",
        buttons: [{ label: "OK", variant: "primary", onPress: closeModal }],
      });
    } catch (err) {
      showInfo("Eroare", err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    setModal({
      visible: true,
      title: "Deconectare",
      message: "Ești sigur că vrei să te deconectezi?",
      buttons: [
        { label: "Da, deconectează", variant: "destructive", onPress: logout },
        { label: "Anulează", variant: "cancel", onPress: closeModal },
      ],
    });
  };

  if (!fontsLoaded) return null;

  const displayImage = imageUri ?? existingImageUrl;

  return (
    <ScreenBackground>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Profilul Meu</Text>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.avatarSection}>
              <TouchableOpacity onPress={pickImage} activeOpacity={0.8} style={styles.avatarWrapper}>
                {displayImage ? (
                  <Image source={{ uri: displayImage }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                )}
                <View style={styles.avatarEditBadge}>
                  <Ionicons name="camera" size={14} color={Colors.background} />
                </View>
              </TouchableOpacity>
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

      <ConfirmModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        buttons={modal.buttons}
        onClose={closeModal}
      />
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
  avatarWrapper: { position: "relative" },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryDimAlphaLight,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.primary,
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.background,
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
  bottomPadding: { height: 20 },
});
