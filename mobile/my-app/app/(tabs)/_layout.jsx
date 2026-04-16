import { Tabs, useRouter } from "expo-router";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Fonts } from "@/constants/theme";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { ActiveSessionBanner } from "@/components/ui/ActiveSessionBanner";
function TabBarButton({ onPress, accessibilityState, icon, label }) {
  const focused = accessibilityState?.selected;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.tabButton}
      activeOpacity={0.8}
    >
      <View style={[styles.tabItem, focused && styles.tabItemActive]}>
        <Ionicons
          name={icon}
          size={22}
          color={focused ? Colors.background : Colors.onSurfaceVariant}
        />
      </View>
    </TouchableOpacity>
  );
}

function QRButton({ onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.qrWrapper}
      activeOpacity={0.9}
    >
      <View style={styles.qrButton}>
        <Ionicons name="qr-code-outline" size={26} color={Colors.background} />
      </View>
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  const { token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !token) {
      router.replace("/(auth)/login");
    }
  }, [token, loading]);

  if (!token) return null;
  return (
    <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: styles.tabBar,
            tabBarShowLabel: false,
          }}
        >
          <Tabs.Screen
            name="home"
            options={{
              tabBarButton: (props) => <TabBarButton {...props} icon="home" />,
            }}
          />
          <Tabs.Screen name="classes" options={{ href: null }} />
          <Tabs.Screen
            name="coach"
            options={{
              tabBarButton: (props) => (
                <TabBarButton {...props} icon="sparkles-outline" />
              ),
            }}
          />
          <Tabs.Screen
            name="qr"
            options={{
              tabBarButton: (props) => <QRButton onPress={props.onPress} />,
            }}
          />
          <Tabs.Screen
            name="workouts"
            options={{
              tabBarButton: (props) => (
                <TabBarButton {...props} icon="barbell-outline" />
              ),
            }}
          />
          <Tabs.Screen name="gym" options={{ href: null }} />
          <Tabs.Screen
            name="profile"
            options={{
              tabBarButton: (props) => (
                <TabBarButton {...props} icon="person-outline" />
              ),
            }}
          />
          <Tabs.Screen name="community" options={{ href: null }} />
        </Tabs>
        <ActiveSessionBanner />
      </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: "rgba(14,14,14,0.92)",
    borderTopWidth: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 8,
    paddingBottom: 16,
    elevation: 0,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabItem: {
    padding: 12,
    borderRadius: 16,
  },
  tabItemActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },

  qrWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -28,
  },
  qrButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 3,
    borderColor: Colors.background,
  },
});
