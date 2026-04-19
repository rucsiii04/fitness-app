import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";

const STATUS_CONFIG = {
  confirmed:    { label: "Confirmed",   color: Colors.primary,  icon: "checkmark-circle",  bg: "rgba(209,255,0,0.08)" },
  waiting_list: { label: "Waitlisted",  color: Colors.tertiary, icon: "hourglass-outline", bg: "rgba(255,238,171,0.08)" },
  attended:     { label: "Attended",    color: Colors.secondary,icon: "ribbon-outline",     bg: "rgba(0,227,253,0.08)" },
  no_show:      { label: "No Show",     color: Colors.error,    icon: "close-circle-outline",bg: "rgba(255,115,81,0.08)" },
  cancelled:    { label: "Cancelled",   color: Colors.onSurfaceVariant, icon: "ban-outline", bg: Colors.surfaceContainerHigh },
};

const formatDateTime = (dateString) => {
  const d = new Date(dateString);
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }) +
    "  ·  " +
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
};

export function EnrollmentCard({ enrollment, onCancel, busy, dimmed }) {
  const session = enrollment.Class_Session;
  const type = session?.Class_Type;
  const trainer = session?.Trainer;
  const cfg = STATUS_CONFIG[enrollment.status] ?? STATUS_CONFIG.cancelled;
  const canCancel = ["confirmed", "waiting_list"].includes(enrollment.status) &&
    session && new Date(session.start_datetime) > new Date();

  const title = [
    type?.name,
    trainer ? `${trainer.first_name} ${trainer.last_name}` : null,
  ].filter(Boolean).join(" · ");

  return (
    <View style={[styles.card, dimmed && styles.cardDimmed]}>
      <View style={styles.topRow}>
        <Text style={styles.className} numberOfLines={1}>
          {title || "Class"}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon} size={11} color={cfg.color} />
          <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Ionicons name="calendar-outline" size={13} color={Colors.onSurfaceVariant} />
        <Text style={styles.metaText}>
          {session ? formatDateTime(session.start_datetime) : "—"}
        </Text>
      </View>

      {canCancel && (
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onCancel}
          disabled={busy}
          activeOpacity={0.8}
        >
          {busy ? (
            <ActivityIndicator size="small" color={Colors.error} />
          ) : (
            <Text style={styles.cancelBtnText}>
              {enrollment.status === "waiting_list" ? "Leave Waitlist" : "Cancel Enrollment"}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  className: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.headline,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 9,
    fontFamily: Fonts.label,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
  },
  cancelBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,115,81,0.3)",
    marginTop: 2,
  },
  cancelBtnText: {
    fontSize: 11,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.error,
    letterSpacing: 0.5,
  },
  cardDimmed: {
    opacity: 0.55,
  },
});
