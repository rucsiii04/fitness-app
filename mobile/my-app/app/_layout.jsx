import { ThemeProvider, DarkTheme } from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { OnboardingProvider } from "@/context/OnboardingContext";
import { ActiveSessionProvider } from "@/context/ActiveSessionContext";
import * as Linking from "expo-linking";
export const unstable_settings = {
  anchor: "(tabs)",
};

function RootNavigator() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const isResetPassword = segments[0] === "reset-password";
    const inSplash = segments[0] === undefined;
    const inAuthGroup = segments[0] === "(auth)";
    if (!token) {
      if (!inAuthGroup && !inSplash && !isResetPassword) {
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

  useEffect(() => {
    const sub = Linking.addEventListener("url", (event) => {
      const data = Linking.parse(event.url);

      console.log("DEEPLINK:", data);

      if (data.path === "reset-password") {
        router.push({
          pathname: "/reset-password",
          params: {
            token: data.queryParams?.token,
            userId: data.queryParams?.userId,
          },
        });
      }
    });

    return () => sub.remove();
  }, []);
  if (loading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      {token && <Stack.Screen name="(tabs)" />}
      {token && <Stack.Screen name="(trainer)" />}
      {token && <Stack.Screen name="session" />}
      {token && <Stack.Screen name="workout" />}
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
