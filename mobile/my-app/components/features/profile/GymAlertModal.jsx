import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

const DAY_OPTIONS = [1, 2, 3, 7];

export default function GymAlertModal({ visible, token, gymId, onClose }) {
  const [current, setCurrent] = useState(null);
  const [message, setMessage] = useState("");
  const [days, setDays] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible && token && gymId) load();
  }, [visible, token, gymId]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/gyms/${gymId}/alerts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCurrent(data.message ?? null);
      setMessage("");
    } catch {
      setError("Nu s-a putut încărca alerta curentă.");
    } finally {
      setLoading(false);
    }
  };

  const handleSet = async () => {
    if (!message.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/gym-admin/gym/${gymId}/alert`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: message.trim(), days }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCurrent(data.message);
      setMessage("");
    } catch (err) {
      setError(err.message ?? "Eroare la salvare.");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/gym-admin/gym/${gymId}/alert`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: null }),
      });
      if (!res.ok) throw new Error("Eroare la ștergere.");
      setCurrent(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>ALERTĂ SALĂ</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            {loading ? (
              <View style={styles.centered}>
                <ActivityIndicator color={Colors.primary} />
              </View>
            ) : (
              <>
                {current ? (
                  <View style={styles.activeAlert}>
                    <View style={styles.activeAlertHeader}>
                      <Ionicons name="warning" size={16} color={Colors.error} />
                      <Text style={styles.activeAlertLabel}>ALERTĂ ACTIVĂ</Text>
                    </View>
                    <Text style={styles.activeAlertText}>{current}</Text>
                    <TouchableOpacity
                      style={styles.clearBtn}
                      onPress={handleClear}
                      disabled={saving}
                    >
                      <Ionicons name="trash-outline" size={14} color={Colors.error} />
                      <Text style={styles.clearBtnText}>Șterge alerta</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.noAlert}>
                    <Ionicons name="checkmark-circle-outline" size={20} color={Colors.secondary} />
                    <Text style={styles.noAlertText}>Nicio alertă activă</Text>
                  </View>
                )}

                <Text style={styles.sectionLabel}>ALERTĂ NOUĂ</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Ex: Sala va fi închisă mâine pentru curățenie generală."
                  placeholderTextColor={Colors.onSurfaceVariant}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={3}
                />

                <Text style={styles.sectionLabel}>DURATA</Text>
                <View style={styles.daysRow}>
                  {DAY_OPTIONS.map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.dayChip, days === d && styles.dayChipActive]}
                      onPress={() => setDays(d)}
                    >
                      <Text style={[styles.dayChipText, days === d && styles.dayChipTextActive]}>
                        {d === 1 ? "1 zi" : `${d} zile`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {error && (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle-outline" size={14} color={Colors.error} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.submitBtn, (!message.trim() || saving) && styles.submitBtnDisabled]}
                  onPress={handleSet}
                  disabled={!message.trim() || saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={Colors.background} />
                  ) : (
                    <Text style={styles.submitBtnText}>PUBLICĂ ALERTA</Text>
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
  body: {
    padding: 24,
    gap: 14,
    paddingBottom: 40,
  },
  centered: {
    paddingVertical: 32,
    alignItems: "center",
  },
  activeAlert: {
    backgroundColor: "rgba(255,115,81,0.08)",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,115,81,0.25)",
    gap: 8,
  },
  activeAlertHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  activeAlertLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    color: Colors.error,
    fontFamily: Fonts.label,
  },
  activeAlertText: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontFamily: Fonts.body,
    lineHeight: 20,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  clearBtnText: {
    fontSize: 12,
    color: Colors.error,
    fontFamily: Fonts.body,
  },
  noAlert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  noAlertText: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.body,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.label,
  },
  input: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 16,
    color: Colors.textPrimary,
    fontFamily: Fonts.body,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
  },
  daysRow: {
    flexDirection: "row",
    gap: 10,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  dayChipActive: {
    backgroundColor: Colors.primaryDimAlphaLight,
    borderColor: Colors.primary,
  },
  dayChipText: {
    fontSize: 13,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
  },
  dayChipTextActive: {
    color: Colors.primary,
    fontWeight: "600",
  },
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
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
    color: Colors.background,
    fontFamily: Fonts.label,
  },
});
