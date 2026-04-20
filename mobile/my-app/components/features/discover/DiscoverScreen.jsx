import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { Colors, Fonts } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { ScreenBackground } from "@/components/ui/ScreenBackground";
import { TrainerCard } from "./TrainerCard";
import {
  fetchTrainersByGym,
  fetchClientInbox,
  sendTrainerRequest,
  endTrainerCollaboration,
} from "@/services/trainerService";

function SearchBar({ value, onChange }) {
  return (
    <View style={styles.searchContainer}>
      <Ionicons
        name="search-outline"
        size={18}
        color={Colors.onSurfaceVariant}
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.searchInput}
        placeholder="Caută după numele trainerului..."
        placeholderTextColor={Colors.onSurfaceVariant}
        value={value}
        onChangeText={onChange}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChange("")} hitSlop={8}>
          <Ionicons name="close-circle" size={16} color={Colors.onSurfaceVariant} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function SectionLabel({ children }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function EmptyState({ hasSearch }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons
        name={hasSearch ? "search-outline" : "people-outline"}
        size={44}
        color={Colors.outlineVariant}
      />
      <Text style={styles.emptyTitle}>
        {hasSearch ? "Niciun trainer găsit" : "Niciun trainer disponibil"}
      </Text>
      <Text style={styles.emptySubtitle}>
        {hasSearch
          ? "Încearcă un alt nume sau șterge căutarea."
          : "Nu există traineri înregistrați la sala ta."}
      </Text>
    </View>
  );
}

function NoGymState() {
  return (
    <View style={styles.centered}>
      <Ionicons name="card-outline" size={40} color={Colors.outlineVariant} />
      <Text style={styles.emptyTitle}>Fără abonament activ</Text>
      <Text style={styles.emptySubtitle}>
        Ai nevoie de un abonament activ pentru a descoperi traineri.
      </Text>
    </View>
  );
}

export default function DiscoverScreen() {
  const { token, user } = useAuth();

  const [trainers, setTrainers] = useState([]);
  const [requestMap, setRequestMap] = useState({});
  const [busyMap, setBusyMap] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!token || !user?.gym_id) {
        setLoading(false);
        return;
      }
      loadAll();
    }, [token, user?.gym_id])
  );

  const loadAll = async () => {
    setLoading(true);
    try {
      const [trainerList, inbox] = await Promise.all([
        fetchTrainersByGym(user.gym_id, token),
        fetchClientInbox(token),
      ]);

      setTrainers(Array.isArray(trainerList) ? trainerList : []);

      const map = {};
      if (Array.isArray(inbox)) {
        for (const req of inbox) {
          if (["pending", "accepted"].includes(req.status)) {
            map[req.trainer_id] = req.status;
          }
        }
      }
      setRequestMap(map);
    } catch (err) {
      Alert.alert("Eroare", err.message ?? "Nu s-au putut încărca trainerii.");
    } finally {
      setLoading(false);
    }
  };

  const activeTrainerId = useMemo(
    () => Object.keys(requestMap).find((id) => requestMap[id] === "accepted") ?? null,
    [requestMap]
  );
  const hasActiveTrainer = activeTrainerId !== null;

  const activeTrainer = useMemo(
    () => (activeTrainerId ? trainers.find((t) => String(t.user_id) === String(activeTrainerId)) : null),
    [trainers, activeTrainerId]
  );

  const filteredOtherTrainers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return trainers
      .filter((t) => String(t.user_id) !== String(activeTrainerId))
      .filter((t) => {
        if (!q) return true;
        return `${t.first_name} ${t.last_name}`.toLowerCase().includes(q);
      });
  }, [trainers, activeTrainerId, search]);

  const setBusy = (id, val) =>
    setBusyMap((prev) => ({ ...prev, [id]: val }));

  const handleSendRequest = async (trainer) => {
    setBusy(trainer.user_id, true);
    try {
      await sendTrainerRequest(trainer.user_id, token);
      setRequestMap((prev) => ({ ...prev, [trainer.user_id]: "pending" }));
    } catch (err) {
      Alert.alert("Eroare", err.message ?? "Te rugăm să încerci din nou.");
    } finally {
      setBusy(trainer.user_id, false);
    }
  };

  const handleEndCollaboration = (trainer) => {
    Alert.alert(
      "Încheie colaborarea",
      `Ești sigur că vrei să închei colaborarea cu ${trainer.first_name} ${trainer.last_name}?`,
      [
        { text: "Anulează", style: "cancel" },
        {
          text: "Încheie",
          style: "destructive",
          onPress: async () => {
            setBusy(trainer.user_id, true);
            try {
              await endTrainerCollaboration(token);
              setRequestMap((prev) => {
                const next = { ...prev };
                delete next[trainer.user_id];
                return next;
              });
            } catch (err) {
              Alert.alert("Eroare", err.message ?? "Nu s-a putut încheia colaborarea.");
            } finally {
              setBusy(trainer.user_id, false);
            }
          },
        },
      ]
    );
  };

  if (!user?.gym_id && !loading) {
    return (
      <ScreenBackground>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <Header />
          <NoGymState />
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <Header />

        <View style={styles.searchWrapper}>
          <SearchBar value={search} onChange={setSearch} />
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={filteredOtherTrainers}
            keyExtractor={(item) => String(item.user_id)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              activeTrainer ? (
                <View style={styles.pinnedSection}>
                  <SectionLabel>TRAINERUL TĂU</SectionLabel>
                  <TrainerCard
                    trainer={activeTrainer}
                    requestStatus="accepted"
                    hasActiveTrainer={true}
                    onEndCollaboration={handleEndCollaboration}
                    onSendRequest={() => {}}
                    busy={!!busyMap[activeTrainer.user_id]}
                  />
                  {filteredOtherTrainers.length > 0 && (
                    <Text style={[styles.sectionLabel, { marginTop: 20 }]}>TOȚI TRAINERII</Text>
                  )}
                </View>
              ) : null
            }
            ListEmptyComponent={
              !activeTrainer ? (
                <EmptyState hasSearch={search.trim().length > 0} />
              ) : null
            }
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            renderItem={({ item }) => (
              <TrainerCard
                trainer={item}
                requestStatus={requestMap[item.user_id] ?? null}
                hasActiveTrainer={hasActiveTrainer}
                onSendRequest={handleSendRequest}
                onEndCollaboration={handleEndCollaboration}
                busy={!!busyMap[item.user_id]}
              />
            )}
          />
        )}
      </SafeAreaView>
    </ScreenBackground>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerTitle}>Discover</Text>
        <Text style={styles.headerSub}>Găsește-ți coachul de elită</Text>
      </View>
      <View style={styles.headerBadge}>
        <Ionicons name="people-outline" size={16} color={Colors.primary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: Fonts.headline,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  headerSub: {
    fontSize: 11,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  headerBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primaryDimAlphaLight,
    alignItems: "center",
    justifyContent: "center",
  },

  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  searchIcon: { flexShrink: 0 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.body,
    color: Colors.textPrimary,
    padding: 0,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 100,
    flexGrow: 1,
  },

  pinnedSection: {
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: Fonts.label,
    fontWeight: "700",
    color: Colors.onSurfaceVariant,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 10,
    marginTop: 4,
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: Fonts.headline,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: Fonts.body,
    color: Colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 20,
  },
});
