import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from "react-native";

const SCREEN_HEIGHT = Dimensions.get("window").height;
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

function isGymOpen(opening_time, closing_time) {
  if (!opening_time || !closing_time) return false;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = opening_time.split(":").map(Number);
  const [ch, cm] = closing_time.split(":").map(Number);
  return cur >= oh * 60 + om && cur <= ch * 60 + cm;
}

const DIFFICULTY = {
  beginner: {
    label: "Începător",
    color: Colors.secondary,
    bg: "rgba(0,227,253,0.1)",
    border: "rgba(0,227,253,0.25)",
  },
  intermediate: {
    label: "Intermediar",
    color: Colors.tertiary,
    bg: "rgba(255,238,171,0.1)",
    border: "rgba(255,238,171,0.25)",
  },
  advanced: {
    label: "Avansat",
    color: Colors.error,
    bg: "rgba(255,115,81,0.1)",
    border: "rgba(255,115,81,0.25)",
  },
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

const fmtTime = (d) =>
  new Date(d).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

export function GymDetailSheet({ visible, gym, onClose }) {
  const { token } = useAuth();
  const [classTypes, setClassTypes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [membershipTypes, setMembershipTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState(null);

  const toggleSection = (key) =>
    setActiveSection((prev) => (prev === key ? null : key));

  useEffect(() => {
    if (!visible || !gym) return;
    setClassTypes([]);
    setSessions([]);
    setMembershipTypes([]);
    setActiveSection(null);
    const load = async () => {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [typesRes, sessionsRes, membershipsRes] = await Promise.all([
          fetch(`${API_BASE}/classes/gyms/${gym.gym_id}/class-types`, { headers }),
          fetch(`${API_BASE}/classes/gyms/${gym.gym_id}/class-sessions`, { headers }),
          fetch(`${API_BASE}/memberships/gyms/${gym.gym_id}/types`, { headers }),
        ]);
        if (typesRes.ok) setClassTypes(await typesRes.json());
        if (membershipsRes.ok) setMembershipTypes(await membershipsRes.json());
        if (sessionsRes.ok) {
          const all = await sessionsRes.json();
          const now = new Date();
          setSessions(
            all
              .filter(
                (s) =>
                  new Date(s.start_datetime) > now && s.status !== "cancelled",
              )
              .slice(0, 20),
          );
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [visible, gym?.gym_id]);

  if (!gym) return null;

  const open = isGymOpen(gym.opening_time, gym.closing_time);
  const hasAlert =
    gym.alert_message &&
    (!gym.alert_expires_at || new Date(gym.alert_expires_at) > new Date());

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.gymName} numberOfLines={1}>
                {gym.name}
              </Text>
              <View style={styles.addressRow}>
                <Ionicons
                  name="location-outline"
                  size={12}
                  color={Colors.onSurfaceVariant}
                />
                <Text style={styles.gymAddress} numberOfLines={1}>
                  {gym.address}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close"
                size={18}
                color={Colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.metaRow}>
            <View
              style={[
                styles.openBadge,
                {
                  backgroundColor: open
                    ? "rgba(209,255,0,0.1)"
                    : "rgba(255,115,81,0.1)",
                },
              ]}
            >
              <View
                style={[
                  styles.openDot,
                  { backgroundColor: open ? Colors.primary : Colors.error },
                ]}
              />
              <Text
                style={[
                  styles.openText,
                  { color: open ? Colors.primary : Colors.error },
                ]}
              >
                {open ? "DESCHIS ACUM" : "ÎNCHIS"}
              </Text>
            </View>
            <View style={styles.hoursChip}>
              <Ionicons
                name="time-outline"
                size={12}
                color={Colors.onSurfaceVariant}
              />
              <Text style={styles.hoursText}>
                {gym.opening_time} – {gym.closing_time}
              </Text>
            </View>
          </View>

          {hasAlert && (
            <View style={styles.alertBox}>
              <Ionicons
                name="megaphone-outline"
                size={14}
                color={Colors.tertiary}
                style={{ marginTop: 1 }}
              />
              <Text style={styles.alertText}>{gym.alert_message}</Text>
            </View>
          )}

          {loading ? (
            <ActivityIndicator
              color={Colors.primary}
              style={{ marginTop: 40 }}
            />
          ) : (
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* ABONAMENTE */}
              <View style={styles.accordionItem}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleSection("memberships")}
                  activeOpacity={0.8}
                >
                  <Text style={styles.sectionLabel}>ABONAMENTE DISPONIBILE</Text>
                  <Ionicons
                    name={activeSection === "memberships" ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={Colors.onSurfaceVariant}
                  />
                </TouchableOpacity>
                {activeSection === "memberships" && (
                  <View style={styles.sectionContent}>
                    {membershipTypes.length === 0 ? (
                      <View style={styles.emptySessions}>
                        <Ionicons name="card-outline" size={28} color={Colors.outlineVariant} />
                        <Text style={styles.emptyText}>Niciun abonament disponibil.</Text>
                      </View>
                    ) : (
                      membershipTypes.map((mt) => (
                        <View key={mt.membership_type_id} style={styles.membershipCard}>
                          <View style={styles.membershipTop}>
                            <Text style={styles.membershipName}>{mt.name}</Text>
                            <Text style={styles.membershipPrice}>
                              {mt.price % 1 === 0 ? mt.price : mt.price.toFixed(2)} RON
                            </Text>
                          </View>
                          <Text style={styles.membershipDuration}>
                            {mt.duration_days} zile
                          </Text>
                          <View style={styles.membershipFeatures}>
                            <View style={styles.featureRow}>
                              <Ionicons
                                name={mt.includes_group_classes ? "checkmark-circle" : "close-circle"}
                                size={14}
                                color={mt.includes_group_classes ? Colors.primary : Colors.onSurfaceVariant}
                              />
                              <Text style={[styles.featureText, !mt.includes_group_classes && styles.featureTextOff]}>
                                {mt.includes_group_classes ? "Cursuri de grup incluse" : "Fără cursuri de grup"}
                              </Text>
                            </View>
                            <View style={styles.featureRow}>
                              <Ionicons name="snow-outline" size={14} color={Colors.secondary} />
                              <Text style={styles.featureText}>
                                {mt.freeze_days} zile de îngheț disponibile
                              </Text>
                            </View>
                            {mt.description ? (
                              <View style={styles.featureRow}>
                                <Ionicons name="information-circle-outline" size={14} color={Colors.onSurfaceVariant} />
                                <Text style={[styles.featureText, { flex: 1 }]}>{mt.description}</Text>
                              </View>
                            ) : null}
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                )}
              </View>

              {/* CURSURI */}
              <View style={styles.accordionItem}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleSection("classes")}
                  activeOpacity={0.8}
                >
                  <Text style={styles.sectionLabel}>CURSURI DISPONIBILE</Text>
                  <Ionicons
                    name={activeSection === "classes" ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={Colors.onSurfaceVariant}
                  />
                </TouchableOpacity>
                {activeSection === "classes" && (
                  <View style={styles.sectionContent}>
                    {classTypes.length === 0 ? (
                      <View style={styles.emptySessions}>
                        <Ionicons name="barbell-outline" size={28} color={Colors.outlineVariant} />
                        <Text style={styles.emptyText}>Niciun curs disponibil.</Text>
                      </View>
                    ) : (
                      <View style={styles.chipsWrap}>
                        {classTypes.map((ct) => {
                          const cfg = DIFFICULTY[ct.difficulty_level] ?? DIFFICULTY.beginner;
                          return (
                            <View
                              key={ct.class_type_id}
                              style={[styles.chip, { backgroundColor: cfg.bg, borderColor: cfg.border }]}
                            >
                              <Text style={[styles.chipName, { color: cfg.color }]}>{ct.name}</Text>
                              <Text style={[styles.chipDiff, { color: cfg.color }]}>{cfg.label}</Text>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* SESIUNI */}
              <View style={styles.accordionItem}>
                <TouchableOpacity
                  style={styles.sectionHeader}
                  onPress={() => toggleSection("sessions")}
                  activeOpacity={0.8}
                >
                  <Text style={styles.sectionLabel}>SESIUNI VIITOARE</Text>
                  <Ionicons
                    name={activeSection === "sessions" ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={Colors.onSurfaceVariant}
                  />
                </TouchableOpacity>
                {activeSection === "sessions" && (
                  <View style={styles.sectionContent}>
                    {sessions.length === 0 ? (
                      <View style={styles.emptySessions}>
                        <Ionicons name="calendar-outline" size={28} color={Colors.outlineVariant} />
                        <Text style={styles.emptyText}>Nicio sesiune programată.</Text>
                      </View>
                    ) : (
                      sessions.map((s) => {
                        const spotsLeft = s.max_participants - (s.confirmed_count ?? 0);
                        const full = spotsLeft <= 0;
                        return (
                          <View key={s.session_id} style={styles.sessionRow}>
                            <View style={styles.sessionDateCol}>
                              <Text style={styles.sessionDay}>
                                {new Date(s.start_datetime)
                                  .toLocaleDateString(undefined, { weekday: "short" })
                                  .toUpperCase()}
                              </Text>
                              <Text style={styles.sessionDayNum}>
                                {new Date(s.start_datetime).getDate()}
                              </Text>
                            </View>
                            <View style={styles.sessionInfo}>
                              <Text style={styles.sessionClassName}>
                                {s.Class_Type?.name ?? "Class"}
                              </Text>
                              <Text style={styles.sessionTime}>
                                {fmtTime(s.start_datetime)} – {fmtTime(s.end_datetime)}
                              </Text>
                              {s.Trainer && (
                                <Text style={styles.sessionTrainer}>
                                  {s.Trainer.first_name} {s.Trainer.last_name}
                                </Text>
                              )}
                            </View>
                            <View style={[styles.spotsBadge, full && styles.spotsBadgeFull]}>
                              <Text style={[styles.spotsText, full && styles.spotsTextFull]}>
                                {full ? "COMPLET" : `${spotsLeft}\nloc`}
                              </Text>
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
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
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 40,
    height: SCREEN_HEIGHT * 0.82,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.outlineVariant,
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  gymName: {
    fontSize: 20,
    fontFamily: Fonts.headline,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  gymAddress: {
    fontSize: 12,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  openBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  openDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  openText: {
    fontSize: 10,
    fontFamily: Fonts.label,
    fontWeight: "700",
    letterSpacing: 1,
  },
  hoursChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: Colors.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  hoursText: {
    fontSize: 11,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
  },
  alertBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "rgba(255,238,171,0.07)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,238,171,0.2)",
    padding: 12,
    marginBottom: 14,
  },
  alertText: {
    flex: 1,
    fontSize: 12,
    fontFamily: Fonts.body,
    color: Colors.tertiary,
    lineHeight: 18,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  accordionItem: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  sectionContent: {
    paddingBottom: 16,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.onSurfaceVariant,
    letterSpacing: 2,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 2,
  },
  chipName: {
    fontSize: 12,
    fontFamily: Fonts.label,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  chipDiff: {
    fontSize: 9,
    fontFamily: Fonts.label,
    fontWeight: "700",
    letterSpacing: 0.5,
    opacity: 0.8,
  },
  emptySessions: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 12,
    gap: 12,
  },
  sessionDateCol: {
    width: 36,
    alignItems: "center",
    gap: 2,
  },
  sessionDay: {
    fontSize: 9,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 1,
  },
  sessionDayNum: {
    fontSize: 20,
    fontFamily: Fonts.headline,
    fontWeight: "700",
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  sessionInfo: {
    flex: 1,
    gap: 2,
  },
  sessionClassName: {
    fontSize: 14,
    fontFamily: Fonts.headline,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  sessionTime: {
    fontSize: 11,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
  },
  sessionTrainer: {
    fontSize: 11,
    fontFamily: Fonts.body,
    color: Colors.textSecondary,
  },
  spotsBadge: {
    minWidth: 36,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(209,255,0,0.1)",
    alignItems: "center",
  },
  spotsBadgeFull: {
    backgroundColor: "rgba(255,115,81,0.1)",
  },
  spotsText: {
    fontSize: 10,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  spotsTextFull: {
    color: Colors.error,
  },

  membershipCard: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 16,
    gap: 10,
  },
  membershipTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  membershipName: {
    fontSize: 16,
    fontFamily: Fonts.headline,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: -0.3,
    flex: 1,
  },
  membershipPrice: {
    fontSize: 16,
    fontFamily: Fonts.headline,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: -0.3,
  },
  membershipDuration: {
    fontSize: 11,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.onSurfaceVariant,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  membershipFeatures: {
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureText: {
    fontSize: 12,
    fontFamily: Fonts.body,
    color: Colors.textPrimary,
  },
  featureTextOff: {
    color: Colors.onSurfaceVariant,
  },
});
