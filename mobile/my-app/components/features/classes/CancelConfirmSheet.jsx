import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";

export function CancelConfirmSheet({
  visible,
  onConfirm,
  onClose,
  isWaitlist = false,
}) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />

          <View style={styles.iconWrap}>
            <Ionicons
              name="alert-circle-outline"
              size={44}
              color={Colors.error}
            />
          </View>

          <Text style={styles.title}>
            {isWaitlist ? "Leave Waitlist?" : "Cancel Enrollment?"}
          </Text>
          <Text style={styles.message}>
            {isWaitlist
              ? "You'll lose your spot on the waiting list. This can't be undone."
              : "You'll lose your confirmed spot. This can't be undone."}
          </Text>

          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={onConfirm}
            activeOpacity={0.85}
          >
            <Text style={styles.confirmText}>
              {isWaitlist ? "Leave Waitlist" : "Cancel Enrollment"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.dismissText}>Keep It</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    alignItems: "center",
    gap: 0,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.outlineVariant,
    marginBottom: 24,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,115,81,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontFamily: Fonts.headline,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 10,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 32,
  },
  confirmBtn: {
    width: "100%",
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: Colors.error,
    alignItems: "center",
    marginBottom: 12,
  },
  confirmText: {
    fontSize: 14,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
  dismissBtn: {
    width: "100%",
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: "center",
  },
  dismissText: {
    fontSize: 14,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
});
