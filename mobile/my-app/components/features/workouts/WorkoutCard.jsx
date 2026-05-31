import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";

const DIFFICULTY = {
  beginner: { label: "Începător", color: Colors.primary, icon: "leaf-outline" },
  intermediate: {
    label: "Intermediar",
    color: Colors.tertiary,
    icon: "flash-outline",
  },
  advanced: { label: "Avansat", color: Colors.error, icon: "flame-outline" },
};

const SOURCE_ICON = {
  trainer: { icon: "person-outline", color: Colors.secondary },
  ai: { icon: "sparkles-outline", color: Colors.tertiary },
};

export function WorkoutCard({ workout, onLongPress, onStart, onPress, hideStart }) {
  const diff = DIFFICULTY[workout.difficulty_level] ?? DIFFICULTY.beginner;
  const src = SOURCE_ICON[workout.source] ?? null;
  const [expanded, setExpanded] = useState(false);
  const [truncated, setTruncated] = useState(false);

  const onTextLayout = useCallback((e) => {
    setTruncated(e.nativeEvent.lines.length > 2);
  }, []);

  return (
    <View style={styles.card}>
      <View style={[styles.accent, { backgroundColor: diff.color }]} />

      <TouchableOpacity
        style={styles.body}
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={350}
        activeOpacity={0.85}
      >
        <View style={styles.topRow}>
          <View style={styles.badges}>
            <View style={[styles.diffBadge, { borderColor: diff.color }]}>
              <Ionicons name={diff.icon} size={10} color={diff.color} />
              <Text style={[styles.diffText, { color: diff.color }]}>
                {diff.label}
              </Text>
            </View>
            {src && (
              <View style={styles.srcBadge}>
                <Ionicons name={src.icon} size={11} color={src.color} />
              </View>
            )}
          </View>
        </View>

        <Text style={styles.name} numberOfLines={1}>
          {workout.name}
        </Text>

        {workout.is_public && workout.creator_name ? (
          <View style={styles.creatorRow}>
            <Ionicons
              name="person-outline"
              size={11}
              color={Colors.secondary}
            />
            <Text style={styles.creatorText}>{workout.creator_name}</Text>
          </View>
        ) : null}

        {workout.description ? (
          <>
            {!expanded && (
              <Text
                style={[styles.description, styles.measurer]}
                numberOfLines={0}
                onTextLayout={onTextLayout}
                aria-hidden
              >
                {workout.description}
              </Text>
            )}
            <Text
              style={styles.description}
              numberOfLines={expanded ? undefined : 2}
            >
              {workout.description}
            </Text>
            {truncated && (
              <TouchableOpacity
                onPress={() => setExpanded((v) => !v)}
                hitSlop={8}
                activeOpacity={0.7}
              >
                <Text style={styles.showMore}>
                  {expanded ? "mai puțin" : "mai mult..."}
                </Text>
              </TouchableOpacity>
            )}
          </>
        ) : null}
      </TouchableOpacity>

      {!hideStart && (
        <TouchableOpacity
          style={styles.startBtnArea}
          onPress={onStart}
          activeOpacity={0.85}
        >
          <View style={styles.startBtn}>
            <Ionicons name="play" size={24} color={Colors.background} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  accent: {
    width: 4,
  },
  body: {
    flex: 1,
    padding: 16,
    gap: 8,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  diffBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  diffText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    fontFamily: Fonts.label,
  },
  srcBadge: {
    padding: 4,
  },
  startBtnArea: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  startBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.body,
    lineHeight: 18,
  },
  measurer: {
    position: "absolute",
    opacity: 0,
    pointerEvents: "none",
  },
  showMore: {
    fontSize: 11,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 0.3,
  },
  creatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  creatorText: {
    fontSize: 11,
    fontFamily: Fonts.body,
    color: Colors.secondary,
  },
});
