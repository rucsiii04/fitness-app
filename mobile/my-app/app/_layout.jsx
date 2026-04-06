import { ThemeProvider, DarkTheme } from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import { AuthProvider, useAuth } from "@/context/AuthContext";

export const unstable_settings = {
  anchor: "(tabs)",
};

function RootNavigator() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inSplash = segments[0] === undefined;

    if (!token) {
      if (!inAuthGroup && !inSplash) {
        router.replace("/");
      }
      return;
    }

    if (inAuthGroup || inSplash) {
      switch (user?.role) {
        case "trainer":
          router.replace("/(trainer)/home");
          break;
        case "gym_admin":
          router.replace("/(admin)/home");
          break;
        default:
          router.replace("/(tabs)/home");
      }
    }
  }, [token, user, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(trainer)" />
      <Stack.Screen name="(admin)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider value={DarkTheme}>
        <RootNavigator />
        <StatusBar style="light" />
      </ThemeProvider>
    </AuthProvider>
  );
}