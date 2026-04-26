import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";

function isGymOpen(opening_time, closing_time) {
  if (!opening_time || !closing_time) return false;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = opening_time.split(":").map(Number);
  const [ch, cm] = closing_time.split(":").map(Number);
  return cur >= oh * 60 + om && cur <= ch * 60 + cm;
}

export function GymCard({ gym, onPress, onView }) {
  const open = isGymOpen(gym.opening_time, gym.closing_time);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.iconArea, open && styles.iconAreaActive]}>
        <Ionicons
          name="barbell-outline"
          size={22}
          color={open ? Colors.background : Colors.onSurfaceVariant}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.nameBlock}>
            <Text style={styles.gymName} numberOfLines={1}>
              {gym.name}
            </Text>
            <Text style={styles.gymAddress} numberOfLines={1}>
              {gym.address}
            </Text>
          </View>
          <View style={styles.statusBadge}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: open ? Colors.primary : Colors.error },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: open ? Colors.primary : Colors.error },
              ]}
            >
              {open ? "OPEN" : "CLOSED"}
            </Text>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.hoursRow}>
            <Ionicons
              name="time-outline"
              size={12}
              color={Colors.onSurfaceVariant}
            />
            <Text style={styles.hoursText}>
              {gym.opening_time} – {gym.closing_time}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.viewBtn}
            onPress={onView ?? onPress}
            activeOpacity={0.85}
          >
            <Text style={styles.viewBtnText}>VIEW</Text>
            <Ionicons
              name="chevron-forward"
              size={12}
              color={Colors.background}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
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
  iconArea: {
    width: 64,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surfaceContainerHighest,
  },
  iconAreaActive: {
    backgroundColor: Colors.primary,
  },
  content: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  nameBlock: { flex: 1, paddingRight: 8, gap: 3 },
  gymName: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    textTransform: "uppercase",
  },
  gymAddress: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.body,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "700",
    fontFamily: Fonts.label,
    letterSpacing: 1,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hoursRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  hoursText: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.body,
  },
  viewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  viewBtnText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: Colors.background,
    fontFamily: Fonts.label,
  },
});
