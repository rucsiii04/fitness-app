import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";

function Avatar({ firstName, lastName, imageUrl }) {
  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={styles.avatar}
        resizeMode="cover"
      />
    );
  }
  const initials = (firstName?.[0] ?? "") + (lastName?.[0] ?? "");
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initials.toUpperCase()}</Text>
    </View>
  );
}

function BioSection({ bio }) {
  const [expanded, setExpanded] = useState(false);
  const [truncated, setTruncated] = useState(false);

  const onTextLayout = useCallback((e) => {
    setTruncated(e.nativeEvent.lines.length > 2);
  }, []);

  if (!bio) return null;

  return (
    <View style={styles.bioContainer}>
      {!expanded && (
        <Text
          style={[styles.bio, styles.measurer]}
          numberOfLines={0}
          onTextLayout={onTextLayout}
          aria-hidden
        >
          {bio}
        </Text>
      )}
      <Text style={styles.bio} numberOfLines={expanded ? undefined : 2}>
        {bio}
      </Text>
      {truncated && (
        <TouchableOpacity
          onPress={() => setExpanded((v) => !v)}
          hitSlop={8}
          activeOpacity={0.7}
        >
          <Text style={styles.showMore}>
            {expanded ? "show less" : "show more..."}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function TrainerCard({
  trainer,
  requestStatus,
  hasActiveTrainer,
  onSendRequest,
  onEndCollaboration,
  busy,
}) {
  const isAccepted = requestStatus === "accepted";
  const isPending = requestStatus === "pending";
  const profile = trainer.trainer_profile;

  const renderAction = () => {
    if (isAccepted) {
      return (
        <TouchableOpacity
          style={[styles.endBtn, busy && styles.btnBusy]}
          onPress={() => onEndCollaboration(trainer)}
          disabled={busy}
          activeOpacity={0.85}
        >
          {busy ? (
            <ActivityIndicator size="small" color={Colors.error} />
          ) : (
            <>
              <Ionicons
                name="close-circle-outline"
                size={14}
                color={Colors.error}
              />
              <Text style={styles.endBtnText}>ÎNCHEIE COLABORAREA</Text>
            </>
          )}
        </TouchableOpacity>
      );
    }

    if (isPending) {
      return (
        <View style={styles.pendingBtn}>
          <Ionicons
            name="hourglass-outline"
            size={14}
            color={Colors.tertiary}
          />
          <Text style={styles.pendingBtnText}>REQUEST TRIMIS</Text>
        </View>
      );
    }

    if (hasActiveTrainer) {
      return null;
    }

    return (
      <TouchableOpacity
        style={[styles.requestBtn, busy && styles.btnBusy]}
        onPress={() => onSendRequest(trainer)}
        disabled={busy}
        activeOpacity={0.85}
      >
        {busy ? (
          <ActivityIndicator size="small" color={Colors.background} />
        ) : (
          <>
            <Text style={styles.requestBtnText}>TRIMITE CERERE</Text>
            <Ionicons name="send" size={13} color={Colors.background} />
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.card, isAccepted && styles.cardActive]}>
      <View style={styles.row}>
        <Avatar
          firstName={trainer.first_name}
          lastName={trainer.last_name}
          imageUrl={profile?.image_url ?? null}
        />

        <View style={styles.info}>
          <Text style={styles.name}>
            {trainer.first_name} {trainer.last_name}
          </Text>
          <Text style={styles.email}>{trainer.email}</Text>
          {profile?.specialization ? (
            <View style={styles.specRow}>
              <Ionicons
                name="barbell-outline"
                size={11}
                color={Colors.onSurfaceVariant}
              />
              <Text style={styles.specText} numberOfLines={1}>
                {profile.specialization}
                {profile.experience_years
                  ? ` · ${profile.experience_years} ani exp.`
                  : ""}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.badgeContainer}>
          {isAccepted ? (
            <View style={styles.activeBadge}>
              <View style={styles.activeDot} />
              <Text style={styles.activeBadgeText}>ACTIV</Text>
            </View>
          ) : (
            <View style={styles.trainerBadge}>
              <Ionicons
                name="barbell-outline"
                size={10}
                color={Colors.secondary}
              />
              <Text style={styles.trainerBadgeText}>TRAINER</Text>
            </View>
          )}
        </View>
      </View>

      <BioSection bio={profile?.bio} />

      {renderAction()}
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
    gap: 14,
  },
  cardActive: {
    borderColor: "rgba(209,255,0,0.25)",
    backgroundColor: Colors.surfaceContainer,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  avatarText: {
    fontSize: 18,
    fontFamily: Fonts.headline,
    fontWeight: "700",
    color: Colors.background,
    letterSpacing: -0.5,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 17,
    fontFamily: Fonts.headline,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  email: {
    fontSize: 12,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
  },
  specRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 1,
  },
  specText: {
    fontSize: 11,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  badgeContainer: { flexShrink: 0 },
  trainerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,227,253,0.08)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trainerBadgeText: {
    fontSize: 8,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.secondary,
    letterSpacing: 1,
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(209,255,0,0.10)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  activeBadgeText: {
    fontSize: 8,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 1,
  },

  bioContainer: {
    gap: 4,
  },
  bio: {
    fontSize: 13,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
    lineHeight: 19,
  },
  measurer: {
    position: "absolute",
    opacity: 0,
    pointerEvents: "none",
  },
  showMore: {
    fontSize: 12,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.primary,
    marginTop: 2,
  },

  requestBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 13,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  requestBtnText: {
    fontSize: 11,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.background,
    letterSpacing: 1.5,
  },
  endBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,115,81,0.10)",
    borderRadius: 10,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: "rgba(255,115,81,0.25)",
  },
  endBtnText: {
    fontSize: 11,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.error,
    letterSpacing: 1.5,
  },
  pendingBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,238,171,0.08)",
    borderRadius: 10,
    paddingVertical: 13,
  },
  pendingBtnText: {
    fontSize: 11,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.tertiary,
    letterSpacing: 1.5,
  },
  btnBusy: { opacity: 0.7 },
});
