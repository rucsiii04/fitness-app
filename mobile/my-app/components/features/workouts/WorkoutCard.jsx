import React, { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";

const DIFFICULTY = {
  beginner: { label: "Beginner", color: Colors.primary, icon: "leaf-outline" },
  intermediate: { label: "Intermediate", color: Colors.tertiary, icon: "flash-outline" },
  advanced: { label: "Advanced", color: Colors.error, icon: "flame-outline" },
};

const SOURCE_ICON = {
  trainer: { icon: "person-outline", color: Colors.secondary },
  ai: { icon: "sparkles-outline", color: Colors.tertiary },
  user: { icon: "create-outline", color: Colors.onSurfaceVariant },
};

export function WorkoutCard({ workout, onLongPress, onStart }) {
  const diff = DIFFICULTY[workout.difficulty_level] ?? DIFFICULTY.beginner;
  const src = SOURCE_ICON[workout.source] ?? SOURCE_ICON.user;
  const [expanded, setExpanded] = useState(false);
  const [truncated, setTruncated] = useState(false);

  const onTextLayout = useCallback((e) => {
    setTruncated(e.nativeEvent.lines.length > 2);
  }, []);

  return (
    <Pressable style={styles.card} onLongPress={onLongPress} delayLongPress={350}>
      <View style={[styles.accent, { backgroundColor: diff.color }]} />

      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={styles.badges}>
            <View style={[styles.diffBadge, { borderColor: diff.color }]}>
              <Ionicons name={diff.icon} size={10} color={diff.color} />
              <Text style={[styles.diffText, { color: diff.color }]}>
                {diff.label}
              </Text>
            </View>
            <View style={styles.srcBadge}>
              <Ionicons name={src.icon} size={11} color={src.color} />
            </View>
          </View>

          <TouchableOpacity
            style={styles.startBtn}
            onPress={onStart}
            activeOpacity={0.85}
            hitSlop={8}
          >
            <Ionicons name="play" size={22} color={Colors.background} />
          </TouchableOpacity>
        </View>

        <Text style={styles.name} numberOfLines={1}>
          {workout.name}
        </Text>

        {workout.description ? (
          <>
            {/* Hidden measurer — no line limit, zero height, used only to count lines */}
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
                  {expanded ? "show less" : "show more..."}
                </Text>
              </TouchableOpacity>
            )}
          </>
        ) : null}
      </View>
    </Pressable>
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
  startBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
});
