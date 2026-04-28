import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Colors, Fonts } from "@/constants/theme";
import { ScreenBackground } from "@/components/ui/ScreenBackground";
import { useAuth } from "@/context/AuthContext";
import {
  fetchGymSessions,
  fetchGymClassTypes,
  createGymClassSession,
} from "@/services/trainerDashboardService";

const MONTHS_RO = [
  "Ianuarie",
  "Februarie",
  "Martie",
  "Aprilie",
  "Mai",
  "Iunie",
  "Iulie",
  "August",
  "Septembrie",
  "Octombrie",
  "Noiembrie",
  "Decembrie",
];
const DAY_HEADERS = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"];
const DAY_NAMES_LONG = [
  "Duminică",
  "Luni",
  "Marți",
  "Miercuri",
  "Joi",
  "Vineri",
  "Sâmbătă",
];

function toDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function sessionDateKey(session) {
  const d = new Date(session.start_datetime);
  return toDateKey(d.getFullYear(), d.getMonth(), d.getDate());
}

function buildCalendarWeeks(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // Mon=0
  const days = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}

function fmtTime(isoStr) {
  const d = new Date(isoStr);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function fmtDayTitle(dateKey) {
  if (!dateKey) return "";
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${DAY_NAMES_LONG[date.getDay()]}, ${d} ${MONTHS_RO[m - 1]}`;
}

function TimePicker({ hour, minute, onHourChange, onMinuteChange }) {
  const stepMinute = (delta) => {
    let m = minute + delta * 5;
    if (m >= 60) m = 0;
    if (m < 0) m = 55;
    onMinuteChange(m);
  };

  return (
    <View style={tpStyles.root}>
      <View style={tpStyles.col}>
        <TouchableOpacity
          onPress={() => onHourChange((hour + 1) % 24)}
          style={tpStyles.btn}
          hitSlop={6}
        >
          <Ionicons name="chevron-up" size={13} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={tpStyles.val}>{String(hour).padStart(2, "0")}</Text>
        <TouchableOpacity
          onPress={() => onHourChange((hour + 23) % 24)}
          style={tpStyles.btn}
          hitSlop={6}
        >
          <Ionicons name="chevron-down" size={13} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      <Text style={tpStyles.colon}>:</Text>
      <View style={tpStyles.col}>
        <TouchableOpacity
          onPress={() => stepMinute(1)}
          style={tpStyles.btn}
          hitSlop={6}
        >
          <Ionicons name="chevron-up" size={13} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={tpStyles.val}>{String(minute).padStart(2, "0")}</Text>
        <TouchableOpacity
          onPress={() => stepMinute(-1)}
          style={tpStyles.btn}
          hitSlop={6}
        >
          <Ionicons name="chevron-down" size={13} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const tpStyles = StyleSheet.create({
  root: { flexDirection: "row", alignItems: "center", gap: 2 },
  col: { alignItems: "center", gap: 3 },
  btn: {
    width: 34,
    height: 26,
    borderRadius: 6,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: "center",
    justifyContent: "center",
  },
  val: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    minWidth: 38,
    textAlign: "center",
  },
  colon: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.textPrimary,
    paddingHorizontal: 2,
    marginBottom: 4,
  },
});

function SessionCard({ session, userId, onPress }) {
  const isMine = session.trainer_id === userId;
  const typeName = session.Class_Type?.name ?? "Clasă";
  const trainer = session.Trainer;
  const trainerLabel = isMine
    ? "Tu"
    : trainer
      ? `${trainer.first_name} ${trainer.last_name}`
      : "—";

  const inner = (
    <View style={[scStyles.card, isMine && scStyles.cardMine]}>
      <View style={scStyles.timeCol}>
        <Text style={scStyles.timeStart}>
          {fmtTime(session.start_datetime)}
        </Text>
        <View style={scStyles.timeLine} />
        <Text style={scStyles.timeEnd}>{fmtTime(session.end_datetime)}</Text>
      </View>
      <View style={scStyles.info}>
        <Text style={scStyles.typeName} numberOfLines={1}>
          {typeName}
        </Text>
        <View style={scStyles.metaRow}>
          <Ionicons
            name="person-outline"
            size={11}
            color={Colors.onSurfaceVariant}
          />
          <Text style={[scStyles.metaText, isMine && scStyles.metaMine]}>
            {trainerLabel}
          </Text>
          <Text style={scStyles.metaSep}>·</Text>
          <Ionicons
            name="people-outline"
            size={11}
            color={Colors.onSurfaceVariant}
          />
          <Text style={scStyles.metaText}>
            {session.confirmed_count ?? 0}/{session.max_participants}
          </Text>
        </View>
      </View>
      {isMine && (
        <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
        {inner}
      </TouchableOpacity>
    );
  }
  return inner;
}

const scStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 14,
    gap: 12,
    alignItems: "center",
  },
  cardMine: {
    borderColor: "rgba(209,255,0,0.25)",
  },
  timeCol: { alignItems: "center", width: 44, gap: 3 },
  timeStart: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.textPrimary,
  },
  timeLine: {
    width: 1,
    minHeight: 10,
    flex: 1,
    backgroundColor: Colors.borderSubtle,
  },
  timeEnd: {
    fontSize: 11,
    fontFamily: Fonts.label,
    color: Colors.onSurfaceVariant,
  },
  info: { flex: 1, gap: 5 },
  typeName: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: {
    fontSize: 11,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
  },
  metaMine: { color: Colors.primary },
  metaSep: { fontSize: 11, color: Colors.outlineVariant },
  badge: {
    backgroundColor: Colors.primaryDimAlphaLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(194,237,0,0.3)",
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    color: Colors.primary,
    fontFamily: Fonts.label,
  },
});

// ─── CreateSessionModal ───────────────────────────────────────
function CreateSessionModal({
  visible,
  selectedDay,
  gymId,
  token,
  onClose,
  onCreated,
}) {
  const [classTypes, setClassTypes] = useState([]);
  const [typesLoading, setTypesLoading] = useState(false);
  const [classTypeId, setClassTypeId] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [startH, setStartH] = useState(9);
  const [startM, setStartM] = useState(0);
  const [endH, setEndH] = useState(10);
  const [endM, setEndM] = useState(0);
  const [maxPart, setMaxPart] = useState(10);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setClassTypeId(null);
    setDropdownOpen(false);
    setStartH(9);
    setStartM(0);
    setEndH(10);
    setEndM(0);
    setMaxPart(10);
    if (!gymId || !token) return;
    setTypesLoading(true);
    fetchGymClassTypes(gymId, token)
      .then((data) => setClassTypes(Array.isArray(data) ? data : []))
      .catch(() => setClassTypes([]))
      .finally(() => setTypesLoading(false));
  }, [visible, gymId, token]);

  const handleSave = async () => {
    if (!classTypeId) {
      Alert.alert("Eroare", "Selectează tipul clasei.");
      return;
    }
    const [y, m, d] = selectedDay.split("-").map(Number);
    const startDt = new Date(y, m - 1, d, startH, startM, 0).toISOString();
    const endDt = new Date(y, m - 1, d, endH, endM, 0).toISOString();

    if (new Date(startDt) >= new Date(endDt)) {
      Alert.alert(
        "Eroare",
        "Ora de sfârșit trebuie să fie după ora de început.",
      );
      return;
    }

    setSaving(true);
    try {
      await createGymClassSession(
        {
          class_type_id: classTypeId,
          gym_id: gymId,
          start_datetime: startDt,
          end_datetime: endDt,
          max_participants: maxPart,
        },
        token,
      );
      onCreated();
    } catch (err) {
      Alert.alert("Eroare", err.message ?? "Nu s-a putut crea sesiunea.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={cmStyles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={cmStyles.sheet}
          activeOpacity={1}
          onPress={() => {}}
        >
          <View style={cmStyles.handle} />
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={cmStyles.sheetTitle}>SESIUNE NOUĂ</Text>
            {selectedDay ? (
              <View style={cmStyles.dateRow}>
                <Ionicons
                  name="calendar-outline"
                  size={13}
                  color={Colors.primary}
                />
                <Text style={cmStyles.dateText}>
                  {fmtDayTitle(selectedDay)}
                </Text>
              </View>
            ) : null}

            <Text style={cmStyles.label}>TIP CLASĂ</Text>
            {typesLoading ? (
              <ActivityIndicator
                size="small"
                color={Colors.primary}
                style={{ marginVertical: 8 }}
              />
            ) : (
              <View>
                <TouchableOpacity
                  style={[
                    cmStyles.dropdownBtn,
                    dropdownOpen && cmStyles.dropdownBtnOpen,
                  ]}
                  onPress={() =>
                    classTypes.length > 0 && setDropdownOpen((v) => !v)
                  }
                  activeOpacity={0.8}
                >
                  <Text
                    style={
                      classTypeId
                        ? cmStyles.dropdownValue
                        : cmStyles.dropdownPlaceholder
                    }
                    numberOfLines={1}
                  >
                    {classTypeId
                      ? (classTypes.find((t) => t.class_type_id === classTypeId)
                          ?.name ?? "Selectează")
                      : classTypes.length === 0
                        ? "Niciun tip configurat de sală"
                        : "Selectează tipul clasei"}
                  </Text>
                  <Ionicons
                    name={dropdownOpen ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={Colors.onSurfaceVariant}
                  />
                </TouchableOpacity>

                {dropdownOpen && (
                  <View style={cmStyles.dropdownList}>
                    {classTypes.map((ct, idx) => {
                      const isSelected = ct.class_type_id === classTypeId;
                      const isLast = idx === classTypes.length - 1;
                      return (
                        <TouchableOpacity
                          key={ct.class_type_id}
                          style={[
                            cmStyles.dropdownItem,
                            isSelected && cmStyles.dropdownItemActive,
                            isLast && cmStyles.dropdownItemLast,
                          ]}
                          onPress={() => {
                            setClassTypeId(ct.class_type_id);
                            setDropdownOpen(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              cmStyles.dropdownItemText,
                              isSelected && cmStyles.dropdownItemTextActive,
                            ]}
                          >
                            {ct.name}
                          </Text>
                          {isSelected && (
                            <Ionicons
                              name="checkmark"
                              size={16}
                              color={Colors.primary}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            <View style={cmStyles.timesRow}>
              <View style={cmStyles.timeBlock}>
                <Text style={cmStyles.label}>START</Text>
                <TimePicker
                  hour={startH}
                  minute={startM}
                  onHourChange={setStartH}
                  onMinuteChange={setStartM}
                />
              </View>
              <View style={cmStyles.timeSepIcon}>
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color={Colors.outlineVariant}
                />
              </View>
              <View style={cmStyles.timeBlock}>
                <Text style={cmStyles.label}>FINAL</Text>
                <TimePicker
                  hour={endH}
                  minute={endM}
                  onHourChange={setEndH}
                  onMinuteChange={setEndM}
                />
              </View>
            </View>

            <Text style={cmStyles.label}>PARTICIPANȚI MAX.</Text>
            <View style={cmStyles.counterRow}>
              <TouchableOpacity
                style={cmStyles.counterBtn}
                onPress={() => setMaxPart((p) => Math.max(1, p - 1))}
                hitSlop={6}
              >
                <Ionicons name="remove" size={18} color={Colors.textPrimary} />
              </TouchableOpacity>
              <Text style={cmStyles.counterVal}>{maxPart}</Text>
              <TouchableOpacity
                style={cmStyles.counterBtn}
                onPress={() => setMaxPart((p) => p + 1)}
                hitSlop={6}
              >
                <Ionicons name="add" size={18} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[cmStyles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color={Colors.background} />
              ) : (
                <Text style={cmStyles.saveBtnText}>SALVEAZĂ SESIUNEA</Text>
              )}
            </TouchableOpacity>
            <View style={{ height: 12 }} />
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const cmStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.surfaceContainerLow,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    maxHeight: "90%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.outlineVariant,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.label,
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  label: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    color: Colors.secondary,
    fontFamily: Fonts.label,
    marginTop: 20,
    marginBottom: 10,
  },
  dropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  dropdownBtnOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomColor: "transparent",
  },
  dropdownPlaceholder: {
    fontSize: 14,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  dropdownValue: {
    fontSize: 14,
    fontFamily: Fonts.body,
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1,
  },
  dropdownList: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: Colors.borderSubtle,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  dropdownItemActive: {
    backgroundColor: Colors.primaryDimAlphaLight,
  },
  dropdownItemLast: {},
  dropdownItemText: {
    fontSize: 14,
    fontFamily: Fonts.body,
    color: Colors.textPrimary,
  },
  dropdownItemTextActive: {
    color: Colors.primary,
    fontWeight: "700",
  },
  timesRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 4,
  },
  timeBlock: { flex: 1 },
  timeSepIcon: { paddingBottom: 14, paddingHorizontal: 2 },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  counterBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: "center",
    justifyContent: "center",
  },
  counterVal: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    minWidth: 44,
    textAlign: "center",
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    fontFamily: Fonts.label,
    color: Colors.background,
  },
});

// ─── Main Screen ──────────────────────────────────────────────
export default function TrainerScheduleScreen() {
  const router = useRouter();
  const { token, user } = useAuth();
  const gymId = user?.gym_id;

  const today = new Date();
  const todayKey = toDateKey(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(todayKey);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createVisible, setCreateVisible] = useState(false);

  const load = useCallback(async () => {
    if (!token || !gymId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchGymSessions(gymId, token);
      setSessions(Array.isArray(data) ? data : []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [token, gymId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const daysWithSessions = useMemo(() => {
    const s = new Set();
    sessions.forEach((sess) => s.add(sessionDateKey(sess)));
    return s;
  }, [sessions]);

  const daySessions = useMemo(() => {
    if (!selectedDay) return [];
    return sessions
      .filter((s) => sessionDateKey(s) === selectedDay)
      .sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime));
  }, [sessions, selectedDay]);

  const calWeeks = useMemo(
    () => buildCalendarWeeks(calYear, calMonth),
    [calYear, calMonth],
  );

  const goMonthPrev = () => {
    if (calMonth === 0) {
      setCalYear((y) => y - 1);
      setCalMonth(11);
    } else setCalMonth((m) => m - 1);
  };
  const goMonthNext = () => {
    if (calMonth === 11) {
      setCalYear((y) => y + 1);
      setCalMonth(0);
    } else setCalMonth((m) => m + 1);
  };

  return (
    <ScreenBackground>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={Colors.primary}
            />
            <Text style={styles.headerTitle}>ORAR</Text>
          </View>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => {
              if (!gymId) {
                Alert.alert("Eroare", "Nu ești asociat unui centru fitness.");
                return;
              }
              setCreateVisible(true);
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={20} color={Colors.background} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : !gymId ? (
          <View style={styles.noGym}>
            <Ionicons
              name="business-outline"
              size={40}
              color={Colors.outlineVariant}
            />
            <Text style={styles.noGymText}>
              Nu ești asociat unui centru fitness.{"\n"}Contactează
              administratorul sălii.
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Calendar card */}
            <View style={styles.calCard}>
              <View style={styles.monthNav}>
                <TouchableOpacity
                  onPress={goMonthPrev}
                  style={styles.monthNavBtn}
                  hitSlop={8}
                >
                  <Ionicons
                    name="chevron-back"
                    size={20}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
                <Text style={styles.monthTitle}>
                  {MONTHS_RO[calMonth]} {calYear}
                </Text>
                <TouchableOpacity
                  onPress={goMonthNext}
                  style={styles.monthNavBtn}
                  hitSlop={8}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.weekRow}>
                {DAY_HEADERS.map((d) => (
                  <Text key={d} style={styles.weekHeader}>
                    {d}
                  </Text>
                ))}
              </View>

              {calWeeks.map((week, wi) => (
                <View key={wi} style={styles.weekRow}>
                  {week.map((day, di) => {
                    if (!day) return <View key={di} style={styles.dayCell} />;
                    const dk = toDateKey(calYear, calMonth, day);
                    const isToday = dk === todayKey;
                    const isSelected = dk === selectedDay;
                    const hasSess = daysWithSessions.has(dk);
                    return (
                      <TouchableOpacity
                        key={di}
                        style={[
                          styles.dayCell,
                          isSelected && styles.dayCellSelected,
                        ]}
                        onPress={() => setSelectedDay(dk)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.dayNum,
                            isToday && !isSelected && styles.dayNumToday,
                            isSelected && styles.dayNumSelected,
                          ]}
                        >
                          {day}
                        </Text>
                        <View
                          style={[
                            styles.dayDot,
                            hasSess
                              ? isSelected
                                ? styles.dayDotActiveSelected
                                : styles.dayDotActive
                              : styles.dayDotEmpty,
                          ]}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}

              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.dayDot, styles.dayDotActive]} />
                  <Text style={styles.legendText}>Cu sesiuni</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.dayDot,
                      styles.dayDotEmpty,
                      styles.dayDotEmptyVisible,
                    ]}
                  />
                  <Text style={styles.legendText}>Liberă</Text>
                </View>
              </View>
            </View>

            {/* Day sessions */}
            <View style={styles.daySection}>
              <Text style={styles.daySectionTitle}>
                {fmtDayTitle(selectedDay)}
              </Text>
              {daySessions.length === 0 ? (
                <View style={styles.emptyDay}>
                  <Ionicons
                    name="calendar-outline"
                    size={32}
                    color={Colors.outlineVariant}
                  />
                  <Text style={styles.emptyDayText}>
                    Nicio sesiune în această zi
                  </Text>
                  <Text style={styles.emptyDayHint}>
                    Apasă + pentru a crea una
                  </Text>
                </View>
              ) : (
                daySessions.map((sess) => {
                  const isMine = sess.trainer_id === user?.user_id;
                  return (
                    <SessionCard
                      key={sess.session_id}
                      session={sess}
                      userId={user?.user_id}
                      onPress={
                        isMine
                          ? () =>
                              router.push({
                                pathname: `/class-session/${sess.session_id}`,
                                params: {
                                  name: sess.Class_Type?.name ?? "Clasă",
                                  start: sess.start_datetime,
                                  end: sess.end_datetime,
                                },
                              })
                          : undefined
                      }
                    />
                  );
                })
              )}
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>
        )}
      </SafeAreaView>

      <CreateSessionModal
        visible={createVisible}
        selectedDay={selectedDay}
        gymId={gymId}
        token={token}
        onClose={() => setCreateVisible(false)}
        onCreated={() => {
          setCreateVisible(false);
          load();
        }}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  backBtn: { padding: 4, minWidth: 32 },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
    fontFamily: Fonts.label,
    color: Colors.primary,
  },
  createBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },

  // Calendar
  calCard: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 4,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  monthNavBtn: { padding: 4 },
  monthTitle: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  weekRow: { flexDirection: "row" },
  weekHeader: {
    flex: 1,
    textAlign: "center",
    fontSize: 10,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
    paddingBottom: 10,
    paddingTop: 4,
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
    minHeight: 44,
    justifyContent: "center",
  },
  dayCellSelected: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryDimAlphaLight,
  },
  dayNum: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: Fonts.label,
    color: Colors.textPrimary,
  },
  dayNumToday: { color: Colors.primary, fontWeight: "800" },
  dayNumSelected: { color: Colors.primary, fontWeight: "800" },
  dayDot: { width: 5, height: 5, borderRadius: 3 },
  dayDotActive: { backgroundColor: Colors.primary },
  dayDotActiveSelected: { backgroundColor: Colors.primary },
  dayDotEmpty: { backgroundColor: "transparent" },
  dayDotEmptyVisible: { backgroundColor: Colors.outlineVariant },

  legend: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendText: {
    fontSize: 10,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
  },

  // Day section
  daySection: { gap: 10 },
  daySectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  emptyDay: {
    alignItems: "center",
    paddingVertical: 36,
    gap: 8,
  },
  emptyDayText: {
    fontSize: 14,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
  },
  emptyDayHint: {
    fontSize: 12,
    fontFamily: Fonts.body,
    color: Colors.outlineVariant,
  },

  // No gym
  noGym: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 14,
  },
  noGymText: {
    fontSize: 14,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 22,
  },
});
