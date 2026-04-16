import { ThemeProvider, DarkTheme } from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { OnboardingProvider } from "@/context/OnboardingContext";
import { ActiveSessionProvider } from "@/context/ActiveSessionContext";

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
    const inOnboarding = segments[0] === "(onboarding)";
    const inSplash = segments[0] === undefined;
    const inTabs = segments[0] === "(tabs)";
    const inTrainer = segments[0] === "(trainer)";

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

  if (loading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      {token && <Stack.Screen name="(tabs)" />}
      {token && <Stack.Screen name="(trainer)" />}
      {token && <Stack.Screen name="(workout)" />}
      {token && <Stack.Screen name="coach" />}
      {token && <Stack.Screen name="membership" />}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ActiveSessionProvider>
        <OnboardingProvider>
          <ThemeProvider value={DarkTheme}>
            <RootNavigator />
            <StatusBar style="light" />
          </ThemeProvider>
        </OnboardingProvider>
      </ActiveSessionProvider>
    </AuthProvider>
  );
}
