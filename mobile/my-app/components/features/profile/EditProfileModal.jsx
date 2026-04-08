import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";

const ACTIVITY_OPTIONS = [
  { value: "sedentary", label: "Sedentary" },
  { value: "light", label: "Light" },
  { value: "moderate", label: "Moderate" },
  { value: "active", label: "Active" },
  { value: "very_active", label: "Very Active" },
];

const GOAL_OPTIONS = [
  { value: "lose_weight", label: "Lose Weight" },
  { value: "maintain", label: "Maintain" },
  { value: "gain_weight", label: "Gain Weight" },
];

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

function OptionPicker({ label, options, selected, onSelect }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.optionRow}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.optionBtn,
              selected === opt.value && styles.optionBtnActive,
            ]}
            onPress={() => onSelect(opt.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.optionText,
                selected === opt.value && styles.optionTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function EditProfileModal({
  visible,
  profile,
  token,
  apiBase,
  onClose,
  onSaved,
}) {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [activityLevel, setActivityLevel] = useState("moderate");
  const [mainGoal, setMainGoal] = useState("maintain");
  const [gender, setGender] = useState("male");
  const [medical, setMedical] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible && profile) {
      setWeight(String(profile.current_weight ?? ""));
      setHeight(String(profile.height ?? ""));
      setActivityLevel(profile.activity_level ?? "moderate");
      setMainGoal(profile.main_goal ?? "maintain");
      setGender(profile.gender ?? "male");
      setMedical(profile.medical_restriction ?? "");
      setError(null);
    }
  }, [visible, profile]);

  const handleSave = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_weight: parseFloat(weight),
          height: parseFloat(height),
          activity_level: activityLevel,
          main_goal: mainGoal,
          gender,
          medical_restriction: medical || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to save");
        return;
      }
      onSaved(data);
      onClose();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>EDIT PROFILE</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={22} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetBody}
          >
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>WEIGHT (KG)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                placeholderTextColor={Colors.onSurfaceVariant}
                placeholder="e.g. 70"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>HEIGHT (CM)</Text>
              <TextInput
                style={styles.input}
                value={height}
                onChangeText={setHeight}
                keyboardType="decimal-pad"
                placeholderTextColor={Colors.onSurfaceVariant}
                placeholder="e.g. 175"
              />
            </View>

            <OptionPicker
              label="GENDER"
              options={GENDER_OPTIONS}
              selected={gender}
              onSelect={setGender}
            />

            <OptionPicker
              label="ACTIVITY LEVEL"
              options={ACTIVITY_OPTIONS}
              selected={activityLevel}
              onSelect={setActivityLevel}
            />

            <OptionPicker
              label="MAIN GOAL"
              options={GOAL_OPTIONS}
              selected={mainGoal}
              onSelect={setMainGoal}
            />

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                MEDICAL RESTRICTIONS (optional)
              </Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={medical}
                onChangeText={setMedical}
                multiline
                numberOfLines={3}
                placeholderTextColor={Colors.onSurfaceVariant}
                placeholder="Any medical conditions or injuries..."
              />
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={Colors.background} size="small" />
              ) : (
                <Text style={styles.saveBtnText}>SAVE CHANGES</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    backgroundColor: Colors.surfaceContainerLow,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    maxHeight: "90%",
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 2,
    color: Colors.primary,
    fontFamily: Fonts.label,
  },
  sheetBody: {
    padding: 24,
    gap: 20,
  },
  fieldGroup: { gap: 8 },
  fieldLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.label,
  },
  input: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.textPrimary,
    fontFamily: Fonts.body,
  },
  inputMultiline: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  optionBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: "rgba(209,255,0,0.1)",
  },
  optionText: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.body,
    fontWeight: "500",
  },
  optionTextActive: {
    color: Colors.primary,
    fontWeight: "700",
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    fontFamily: Fonts.body,
    textAlign: "center",
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 3,
    color: Colors.background,
    fontFamily: Fonts.label,
  },
});
