import React from "react";
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";

const GOAL_LABELS = { lose_weight: "Slăbire", maintain: "Menținere", gain_weight: "Masă Musculară" };
const GOAL_COLORS = { lose_weight: Colors.error, maintain: Colors.secondary, gain_weight: Colors.primary };
const ACTIVITY_LABELS = {
  sedentary: "Sedentar",
  light: "Ușor activ",
  moderate: "Moderat activ",
  active: "Activ",
  very_active: "Foarte activ",
};
const GENDER_LABELS = { male: "Masculin", female: "Feminin" };

function Row({ icon, label, value }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={16} color={Colors.onSurfaceVariant} style={styles.rowIcon} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export function ClientDetailModal({ visible, client, profile, onClose }) {
  if (!client) return null;
  const initials = `${client.first_name?.[0] ?? ""}${client.last_name?.[0] ?? ""}`.toUpperCase();
  const goal = profile?.main_goal;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.name}>{client.first_name} {client.last_name}</Text>
              {goal ? (
                <View style={[styles.goalBadge, { backgroundColor: GOAL_COLORS[goal] + "22" }]}>
                  <Text style={[styles.goalText, { color: GOAL_COLORS[goal] }]}>{GOAL_LABELS[goal]}</Text>
                </View>
              ) : null}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Contact</Text>
            <Row icon="mail-outline" label="Email" value={client.email} />
            <Row icon="call-outline" label="Telefon" value={client.phone} />

            {profile ? (
              <>
                <Text style={styles.sectionTitle}>Profil fizic</Text>
                <Row icon="person-outline" label="Gen" value={profile.gender ? GENDER_LABELS[profile.gender] : null} />
                <Row icon="barbell-outline" label="Greutate" value={profile.current_weight ? `${profile.current_weight} kg` : null} />
                <Row icon="resize-outline" label="Înălțime" value={profile.height ? `${profile.height} cm` : null} />
                <Row icon="flash-outline" label="Nivel activitate" value={profile.activity_level ? ACTIVITY_LABELS[profile.activity_level] : null} />
                {profile.medical_restriction ? (
                  <>
                    <Text style={styles.sectionTitle}>Restricții medicale</Text>
                    <View style={styles.restrictionBox}>
                      <Text style={styles.restrictionText}>{profile.medical_restriction}</Text>
                    </View>
                  </>
                ) : null}
              </>
            ) : (
              <View style={styles.noProfile}>
                <Text style={styles.noProfileText}>Clientul nu a completat încă profilul.</Text>
              </View>
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderSubtle,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryDimAlphaLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.primary,
  },
  headerInfo: { flex: 1, gap: 4 },
  name: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.textPrimary,
  },
  goalBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  goalText: { fontSize: 10, fontFamily: Fonts.label, fontWeight: "700" },
  closeBtn: { padding: 4 },
  body: { paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: Fonts.label,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginTop: 20,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    gap: 10,
  },
  rowIcon: { width: 20 },
  rowLabel: {
    fontSize: 13,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
    flex: 1,
  },
  rowValue: {
    fontSize: 13,
    fontFamily: Fonts.label,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  restrictionBox: {
    backgroundColor: Colors.error + "15",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.error + "33",
    marginBottom: 8,
  },
  restrictionText: {
    fontSize: 13,
    fontFamily: Fonts.body,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  noProfile: {
    paddingVertical: 24,
    alignItems: "center",
  },
  noProfileText: {
    fontSize: 13,
    fontFamily: Fonts.body,
    color: Colors.textMuted,
    textAlign: "center",
  },
});
