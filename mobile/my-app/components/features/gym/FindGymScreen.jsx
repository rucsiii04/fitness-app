import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { Colors, Fonts } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { ScreenBackground } from "@/components/ui/ScreenBackground";
import { GymCard } from "./GymCard";

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#131313" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#adaaaa" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0e0e0e" }] },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#262626" }],
  },
  {
    featureType: "administrative.country",
    elementType: "labels.text.fill",
    stylers: [{ color: "#adaaaa" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#1a1a1a" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#484847" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#20201f" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#131313" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#767575" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#262626" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1a1a1a" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#adaaaa" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1a1a1a" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0e0e0e" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#262626" }],
  },
];

const DEFAULT_REGION = {
  latitude: 44.4268,
  longitude: 26.1025,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

function isGymOpen(opening_time, closing_time) {
  if (!opening_time || !closing_time) return false;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = opening_time.split(":").map(Number);
  const [ch, cm] = closing_time.split(":").map(Number);
  return cur >= oh * 60 + om && cur <= ch * 60 + cm;
}

export default function FindGymScreen() {
  const { token } = useAuth();
  const mapRef = useRef(null);
  const [gyms, setGyms] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [locationGranted, setLocationGranted] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      setLocationGranted(true);
      const loc = await Location.getCurrentPositionAsync({});
      const userRegion = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      setRegion(userRegion);
      mapRef.current?.animateToRegion(userRegion, 800);
    })();
  }, []);

  const fetchGyms = useCallback(
    async (query = "") => {
      setLoading(true);
      try {
        const url = `${API_BASE}/gym-admin/gyms/all${
          query ? `?search=${encodeURIComponent(query)}` : ""
        }`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setGyms(Array.isArray(data) ? data : []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    fetchGyms();
  }, [fetchGyms]);

  useEffect(() => {
    const t = setTimeout(() => fetchGyms(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const focusGym = (gym) => {
    if (!gym.latitude || !gym.longitude) return;
    mapRef.current?.animateToRegion(
      {
        latitude: gym.latitude,
        longitude: gym.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      600,
    );
  };

  const gymsWithCoords = gyms.filter((g) => g.latitude && g.longitude);

  return (
    <ScreenBackground>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>FIND A GYM</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{gyms.length} FOUND</Text>
          </View>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons
              name="search-outline"
              size={18}
              color={Colors.onSurfaceVariant}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or address..."
              placeholderTextColor={Colors.onSurfaceVariant}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={Colors.onSurfaceVariant}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={region}
            customMapStyle={DARK_MAP_STYLE}
            showsUserLocation={locationGranted}
            showsMyLocationButton={false}
            showsCompass={false}
            toolbarEnabled={false}
          >
            {gymsWithCoords.map((gym) => {
              const open = isGymOpen(gym.opening_time, gym.closing_time);
              return (
                <Marker
                  key={gym.gym_id}
                  coordinate={{
                    latitude: gym.latitude,
                    longitude: gym.longitude,
                  }}
                  pinColor={open ? Colors.primary : Colors.error}
                >
                  <View style={styles.markerPin}>
                    <View
                      style={[
                        styles.markerDot,
                        {
                          backgroundColor: open ? Colors.primary : Colors.error,
                        },
                      ]}
                    />
                  </View>
                  <Callout tooltip>
                    <View style={styles.callout}>
                      <Text style={styles.calloutName}>{gym.name}</Text>
                      <Text style={styles.calloutAddress} numberOfLines={1}>
                        {gym.address}
                      </Text>
                      <Text
                        style={[
                          styles.calloutStatus,
                          { color: open ? Colors.primary : Colors.error },
                        ]}
                      >
                        {open ? "● OPEN" : "● CLOSED"}
                      </Text>
                    </View>
                  </Callout>
                </Marker>
              );
            })}
          </MapView>

          {locationGranted && (
            <TouchableOpacity
              style={styles.myLocationBtn}
              onPress={async () => {
                const loc = await Location.getCurrentPositionAsync({});
                mapRef.current?.animateToRegion(
                  {
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  },
                  600,
                );
              }}
            >
              <Ionicons
                name="locate-outline"
                size={20}
                color={Colors.primary}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.drawer}>
          <View style={styles.drawerHandle} />
          <Text style={styles.drawerTitle}>NEARBY LOCATIONS</Text>

          {loading ? (
            <ActivityIndicator
              color={Colors.primary}
              style={{ marginTop: 32 }}
            />
          ) : gyms.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="location-outline"
                size={36}
                color={Colors.outlineVariant}
              />
              <Text style={styles.emptyText}>No gyms found</Text>
            </View>
          ) : (
            <FlatList
              data={gyms}
              keyExtractor={(g) => String(g.gym_id)}
              renderItem={({ item }) => (
                <GymCard gym={item} onPress={() => focusGym(item)} />
              )}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  countBadge: {
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  countText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.label,
  },
  searchRow: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    fontFamily: Fonts.body,
  },
  mapContainer: {
    height: 220,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  markerPin: {
    alignItems: "center",
    justifyContent: "center",
  },
  markerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.background,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 6,
  },
  callout: {
    backgroundColor: "rgba(14,14,14,0.95)",
    borderRadius: 10,
    padding: 10,
    minWidth: 140,
    borderWidth: 1,
    borderColor: "rgba(209,255,0,0.2)",
    gap: 3,
  },
  calloutName: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textPrimary,
    fontFamily: Fonts.headline,
    textTransform: "uppercase",
    letterSpacing: -0.3,
  },
  calloutAddress: {
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.body,
  },
  calloutStatus: {
    fontSize: 9,
    fontWeight: "700",
    fontFamily: Fonts.label,
    letterSpacing: 1,
    marginTop: 2,
  },
  myLocationBtn: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  drawer: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLow,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    paddingTop: 12,
  },
  drawerHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.outlineVariant,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  drawerTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 3,
    color: Colors.primary,
    fontFamily: Fonts.label,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 40,
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.body,
  },
});
