import { useRef } from "react";
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";
import { Colors, Fonts } from "@/constants/theme";

const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// Build an array of Date objects: today and the next 13 days
const buildWeek = () => {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
};

export function DateSelector({ selected, onChange }) {
  const days = buildWeek();
  const scrollRef = useRef(null);

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {days.map((day) => {
        const active = isSameDay(day, selected);
        return (
          <TouchableOpacity
            key={day.toISOString()}
            style={[styles.dayBtn, active && styles.dayBtnActive]}
            onPress={() => onChange(day)}
            activeOpacity={0.8}
          >
            <Text style={[styles.dayName, active && styles.dayNameActive]}>
              {DAY_NAMES[day.getDay()]}
            </Text>
            <Text style={[styles.dayNum, active && styles.dayNumActive]}>
              {day.getDate()}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  dayBtn: {
    width: 56,
    height: 80,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  dayBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: "transparent",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  dayName: {
    fontSize: 9,
    fontFamily: Fonts.label,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: Colors.onSurfaceVariant,
    textTransform: "uppercase",
  },
  dayNameActive: { color: Colors.background },
  dayNum: {
    fontSize: 22,
    fontFamily: Fonts.headline,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  dayNumActive: { color: Colors.background },
});
