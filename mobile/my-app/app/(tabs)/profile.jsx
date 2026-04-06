import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { Colors, Fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

export default function Profile() {
  const { logout, user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.name}>
          {user?.first_name} {user?.last_name}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.role}>{user?.role}</Text>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    gap: 8,
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: Fonts.headline,
    color: Colors.textPrimary,
  },
  email: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    fontFamily: Fonts.body,
  },
  role: {
    fontSize: 12,
    color: Colors.secondary,
    fontFamily: Fonts.label,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 40,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,115,81,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,115,81,0.2)",
    borderRadius: 12,
    padding: 16,
    alignSelf: "flex-start",
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.error,
    fontFamily: Fonts.label,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
