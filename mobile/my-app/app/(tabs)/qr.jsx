import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import { Colors, Fonts } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { ScreenBackground } from "@/components/ui/ScreenBackground";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

export default function QRScreen() {
  const { token } = useAuth();
  const [qrToken, setQrToken] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateQR = useCallback(async () => {
    setLoading(true);
    setError(null);
    setQrToken(null);
    try {
      const res = await fetch(`${API_BASE}/qr/generate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to generate QR");
        return;
      }
      const exp = new Date(Date.now() + 5 * 60 * 1000);
      setQrToken(data.token);
      setExpiresAt(exp);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setSecondsLeft(diff);
      if (diff === 0) {
        setQrToken(null);
        setExpiresAt(null);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const formatTime = (secs) => {
    if (secs === null) return "";
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const isExpiringSoon = secondsLeft !== null && secondsLeft <= 60;

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>GYM ACCESS</Text>
        </View>

        <View style={styles.body}>
          {loading && <ActivityIndicator size="large" color={Colors.primary} />}

          {!loading && error && (
            <View style={styles.errorBox}>
              <Ionicons name="warning-outline" size={32} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {!loading && qrToken && (
            <View style={styles.qrCard}>
              <View style={styles.qrWrapper}>
                <QRCode
                  value={qrToken}
                  size={220}
                  backgroundColor={Colors.textPrimary}
                  color={Colors.background}
                />
              </View>

              <View style={styles.timerRow}>
                <Ionicons
                  name="timer-outline"
                  size={16}
                  color={
                    isExpiringSoon ? Colors.error : Colors.onSurfaceVariant
                  }
                />
                <Text
                  style={[
                    styles.timerText,
                    isExpiringSoon && styles.timerTextUrgent,
                  ]}
                >
                  Expires in {formatTime(secondsLeft)}
                </Text>
              </View>

              <Text style={styles.hint}>
                Show this code at the front desk to enter
              </Text>
            </View>
          )}

          {!loading && !qrToken && !error && (
            <View style={styles.emptyBox}>
              <Ionicons
                name="qr-code-outline"
                size={64}
                color={Colors.outlineVariant}
              />
              <Text style={styles.emptyTitle}>NO ACTIVE QR</Text>
              <Text style={styles.emptySubtitle}>
                Generate a code to check in at the gym
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.generateBtn, loading && styles.generateBtnDisabled]}
            onPress={generateQR}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Ionicons
              name={qrToken ? "refresh-outline" : "flash-outline"}
              size={18}
              color={Colors.background}
            />
            <Text style={styles.generateBtnText}>
              {qrToken ? "REGENERATE" : "GENERATE QR"}
            </Text>
          </TouchableOpacity>
        </View>
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
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 32,
  },
  qrCard: {
    alignItems: "center",
    gap: 20,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    width: "100%",
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: Colors.textPrimary,
    borderRadius: 16,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timerText: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.onSurfaceVariant,
    letterSpacing: 1,
  },
  timerTextUrgent: {
    color: Colors.error,
  },
  hint: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.body,
    textAlign: "center",
  },
  emptyBox: {
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.body,
    textAlign: "center",
  },
  errorBox: {
    alignItems: "center",
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    fontFamily: Fonts.body,
    textAlign: "center",
  },
  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: "100%",
    justifyContent: "center",
  },
  generateBtnDisabled: { opacity: 0.6 },
  generateBtnText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 3,
    color: Colors.background,
    fontFamily: Fonts.label,
  },
});
