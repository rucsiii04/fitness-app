import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Colors, Fonts } from "@/constants/theme";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CHART_HEIGHT = 120;

export function WeeklyChart({ sessions = [] }) {
  const dayTotals = DAYS.map((day, i) => {
    const daySessions = sessions.filter((s) => {
      const date = new Date(s.start_time);
      return date.getDay() === (i + 1) % 7;
    });
    return daySessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
  });

  const max = Math.max(...dayTotals, 1);
  const today = (new Date().getDay() + 6) % 7; // 0=Mon

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Weekly Intensity</Text>
      </View>
      <View style={styles.chart}>
        {DAYS.map((day, i) => {
          const heightPct = dayTotals[i] / max;
          const isToday = i === today;
          const hasData = dayTotals[i] > 0;

          return (
            <View key={day} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${Math.max(heightPct * 100, hasData ? 8 : 4)}%`,
                    },
                    isToday && styles.barToday,
                  ]}
                />
              </View>
              <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                {day}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: CHART_HEIGHT,
    gap: 6,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    height: "100%",
    gap: 8,
  },
  barTrack: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 6,
    minHeight: 4,
  },
  barToday: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  dayLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.label,
  },
  dayLabelToday: {
    color: Colors.primary,
  },
});