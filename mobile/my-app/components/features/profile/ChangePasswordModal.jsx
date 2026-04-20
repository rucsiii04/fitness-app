import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

function PasswordField({ label, value, onChangeText, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={placeholder}
          placeholderTextColor={Colors.onSurfaceVariant}
        />
        <TouchableOpacity
          style={styles.eyeBtn}
          onPress={() => setShow((v) => !v)}
          hitSlop={8}
        >
          <Ionicons
            name={show ? "eye-off-outline" : "eye-outline"}
            size={18}
            color={Colors.onSurfaceVariant}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ChangePasswordModal({ visible, token, onClose }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    setError(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("Completează toate câmpurile.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Parola nouă trebuie să aibă cel puțin 6 caractere.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Parola nouă și confirmarea nu coincid.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/update-password`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Eroare la schimbarea parolei.");
        return;
      }
      setSuccess(true);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Eroare de rețea. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>SCHIMBĂ PAROLA</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <View style={styles.sheetBody}>
            {success ? (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={48} color={Colors.primary} />
                <Text style={styles.successTitle}>Parolă actualizată!</Text>
                <Text style={styles.successSub}>
                  Parola ta a fost schimbată cu succes.
                </Text>
                <TouchableOpacity style={styles.doneBtn} onPress={handleClose} activeOpacity={0.85}>
                  <Text style={styles.doneBtnText}>ÎNCHIDE</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <PasswordField
                  label="PAROLA CURENTĂ"
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  placeholder="Introdu parola curentă"
                />
                <PasswordField
                  label="PAROLA NOUĂ"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Minimum 6 caractere"
                />
                <PasswordField
                  label="CONFIRMĂ PAROLA NOUĂ"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repetă parola nouă"
                />

                {error && (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle-outline" size={14} color={Colors.error} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.saveBtn, loading && styles.btnDisabled]}
                  onPress={handleSave}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={Colors.background} />
                  ) : (
                    <Text style={styles.saveBtnText}>ACTUALIZEAZĂ PAROLA</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
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
    gap: 16,
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
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingRight: 14,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.textPrimary,
    fontFamily: Fonts.body,
  },
  eyeBtn: { padding: 4 },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,115,81,0.08)",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,115,81,0.2)",
  },
  errorText: {
    flex: 1,
    color: Colors.error,
    fontSize: 13,
    fontFamily: Fonts.body,
  },

  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 4,
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    color: Colors.background,
    fontFamily: Fonts.label,
  },
  btnDisabled: { opacity: 0.6 },

  successBox: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 12,
  },
  successTitle: {
    fontSize: 20,
    fontFamily: Fonts.headline,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  successSub: {
    fontSize: 13,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
  },
  doneBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  doneBtnText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    color: Colors.background,
    fontFamily: Fonts.label,
  },
});
