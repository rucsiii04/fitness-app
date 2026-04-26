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

const DIFFICULTY_CONFIG = {
  beginner: {
    label: "Beginner",
    color: Colors.primary,
    bg: "rgba(209,255,0,0.12)",
  },
  intermediate: {
    label: "Intermediate",
    color: Colors.tertiary,
    bg: "rgba(255,238,171,0.10)",
  },
  advanced: {
    label: "Advanced",
    color: Colors.error,
    bg: "rgba(255,115,81,0.12)",
  },
};

const formatTime = (dateString) => {
  return new Date(dateString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export function ClassCard({
  session,
  enrollment,
  onEnroll,
  onCancel,
  busy,
  membershipStatus = "none",
}) {
  const type = session.Class_Type;
  const trainer = session.Trainer;
  const diff =
    DIFFICULTY_CONFIG[type?.difficulty_level] ?? DIFFICULTY_CONFIG.beginner;
  const spotsLeft = session.max_participants - (session.confirmed_count ?? 0);
  const isFull = spotsLeft <= 0;
  const isCancelled = session.status === "cancelled";
  const isEnrolled = enrollment?.status === "confirmed";
  const isWaiting = enrollment?.status === "waiting_list";

  const now = new Date();
  const startTime = new Date(session.start_datetime);
  const endTime = new Date(session.end_datetime);
  const isOver = now > endTime;
  const isOngoing = now >= startTime && now <= endTime;

  const spotsColor = spotsLeft <= 3 ? Colors.error : Colors.primary;

  return (
    <View
      style={[styles.card, (isCancelled || isOver) && styles.cardCancelled]}
    >
      <View style={styles.topRow}>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: diff.bg }]}>
            <Text style={[styles.badgeText, { color: diff.color }]}>
              {diff.label}
            </Text>
          </View>
          {isCancelled && (
            <View
              style={[
                styles.badge,
                { backgroundColor: "rgba(255,115,81,0.12)" },
              ]}
            >
              <Text style={[styles.badgeText, { color: Colors.error }]}>
                Cancelled
              </Text>
            </View>
          )}
          {!isCancelled && isOver && (
            <View
              style={[
                styles.badge,
                { backgroundColor: "rgba(150,150,150,0.15)" },
              ]}
            >
              <Text
                style={[styles.badgeText, { color: Colors.onSurfaceVariant }]}
              >
                Over
              </Text>
            </View>
          )}
          {!isCancelled && isOngoing && (
            <View
              style={[
                styles.badge,
                { backgroundColor: "rgba(209,255,0,0.12)" },
              ]}
            >
              <Text style={[styles.badgeText, { color: Colors.primary }]}>
                Ongoing
              </Text>
            </View>
          )}
        </View>
        {!isCancelled && (
          <Text style={[styles.spotsText, { color: spotsColor }]}>
            {isFull ? "FULL" : `${spotsLeft}/${session.max_participants}`}
          </Text>
        )}
      </View>

      <Text
        style={[styles.className, isCancelled && styles.textDim]}
        numberOfLines={1}
      >
        {type?.name ?? "Class"}
      </Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons
            name="time-outline"
            size={13}
            color={Colors.onSurfaceVariant}
          />
          <Text style={styles.metaText}>
            {formatTime(session.start_datetime)} –{" "}
            {formatTime(session.end_datetime)}
          </Text>
        </View>
        {trainer && (
          <View style={styles.metaItem}>
            <Ionicons
              name="person-outline"
              size={13}
              color={Colors.onSurfaceVariant}
            />
            <Text style={styles.metaText}>
              {trainer.first_name} {trainer.last_name}
            </Text>
          </View>
        )}
      </View>

      {!isCancelled && !isOver && !isOngoing && (
        <>
          {isEnrolled ? (
            <View style={styles.enrolledRow}>
              <View style={styles.enrolledBadge}>
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color={Colors.primary}
                />
                <Text style={styles.enrolledText}>Enrolled</Text>
              </View>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onCancel}
                disabled={busy}
                activeOpacity={0.8}
              >
                {busy ? (
                  <ActivityIndicator size="small" color={Colors.error} />
                ) : (
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : isWaiting ? (
            <View style={styles.enrolledRow}>
              <View
                style={[
                  styles.enrolledBadge,
                  { backgroundColor: "rgba(255,238,171,0.1)" },
                ]}
              >
                <Ionicons
                  name="hourglass-outline"
                  size={14}
                  color={Colors.tertiary}
                />
                <Text style={[styles.enrolledText, { color: Colors.tertiary }]}>
                  Waitlisted
                </Text>
              </View>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onCancel}
                disabled={busy}
                activeOpacity={0.8}
              >
                {busy ? (
                  <ActivityIndicator size="small" color={Colors.error} />
                ) : (
                  <Text style={styles.cancelBtnText}>Leave</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : membershipStatus !== "ok" ? (
            <View style={styles.lockedBtn}>
              <Ionicons
                name="lock-closed-outline"
                size={14}
                color={Colors.onSurfaceVariant}
              />
              <Text style={styles.lockedBtnText}>
                {membershipStatus === "no_classes"
                  ? "Abonamentul nu include clase"
                  : "Membership Required"}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.enrollBtn, isFull && styles.enrollBtnWaiting]}
              onPress={onEnroll}
              disabled={busy}
              activeOpacity={0.85}
            >
              {busy ? (
                <ActivityIndicator size="small" color={Colors.background} />
              ) : (
                <>
                  <Text style={styles.enrollBtnText}>
                    {isFull ? "Join Waiting List" : "Enroll Now"}
                  </Text>
                  <Ionicons
                    name={isFull ? "hourglass-outline" : "arrow-forward"}
                    size={14}
                    color={Colors.background}
                  />
                </>
              )}
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 10,
  },
  cardCancelled: {
    opacity: 0.5,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badges: { flexDirection: "row", gap: 6 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: Fonts.label,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  spotsText: {
    fontSize: 10,
    fontFamily: Fonts.label,
    fontWeight: "700",
    letterSpacing: 1,
  },

  className: {
    fontSize: 22,
    fontFamily: Fonts.headline,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  textDim: { color: Colors.onSurfaceVariant },

  metaRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
  },

  enrollBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 13,
    marginTop: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  enrollBtnWaiting: {
    backgroundColor: Colors.surfaceContainerHigh,
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  enrollBtnText: {
    fontSize: 12,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.background,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  enrolledRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  enrolledBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(209,255,0,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  enrolledText: {
    fontSize: 11,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,115,81,0.3)",
  },
  cancelBtnText: {
    fontSize: 11,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.error,
    letterSpacing: 0.5,
  },
  lockedBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 10,
    paddingVertical: 13,
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  lockedBtnText: {
    fontSize: 12,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.onSurfaceVariant,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
