import { Tabs, useRouter } from "expo-router";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

function TabBarButton({ onPress, accessibilityState, icon }) {
  const focused = accessibilityState?.selected;

  return (
    <TouchableOpacity onPress={onPress} style={styles.tabButton} activeOpacity={0.8}>
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

export default function TrainerLayout() {
  const { token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !token) {
      router.replace("/(auth)/login");
    }
  }, [token, loading]);

  if (!token) return null;

  return (
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
          tabBarButton: (props) => <TabBarButton {...props} icon="grid-outline" />,
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          tabBarButton: (props) => <TabBarButton {...props} icon="people-outline" />,
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          tabBarButton: (props) => <TabBarButton {...props} icon="mail-outline" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarButton: (props) => <TabBarButton {...props} icon="person-outline" />,
        }}
      />
    </Tabs>
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
});
