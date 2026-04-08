import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Colors, Fonts } from "@/constants/theme";
import { useAppFonts } from "@/hooks/useAppFonts";
import { AppLogo } from "@/components/ui/AppLogo";

const { width, height } = Dimensions.get("window");

export default function KineticSplash() {
  const fontsLoaded = useAppFonts();
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const ctaFade = useRef(new Animated.Value(0)).current;
  const ctaSlide = useRef(new Animated.Value(30)).current;
  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!fontsLoaded) return;

    Animated.timing(headerFade, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(600),
      Animated.parallel([
        Animated.timing(ctaFade, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(ctaSlide, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <ImageBackground
        source={require("../../../assets/images/splashImg.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlayBottom} />
      </ImageBackground>

      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.header, { opacity: headerFade }]}>
          <AppLogo />
        </Animated.View>

        <Animated.View
          style={[
            styles.heroContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.eyebrow}>Precision Performance</Text>
          <Text style={styles.heroTitle}>
            {"BEYOND\n"}
            <Text style={styles.heroTitleAccent}>LIMITS</Text>
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.ctaContainer,
            {
              opacity: ctaFade,
              transform: [{ translateY: ctaSlide }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={() => router.push("/(auth)/register")}
          >
            <Text style={styles.primaryButtonText}>JOIN THE ELITE</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.85}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.secondaryButtonText}>LOGIN</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
  },
  overlayBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.7,
    backgroundColor: Colors.overlayHeavy,
  },
  safeArea: {
    flex: 1,
    justifyContent: "space-between",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  heroContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 4,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    marginBottom: 16,
    fontFamily: Fonts.label,
  },
  heroTitle: {
    fontSize: width < 380 ? 72 : 86,
    fontWeight: "700",
    color: Colors.textPrimary,
    lineHeight: width < 380 ? 64 : 76,
    letterSpacing: -3,
    textAlign: "center",
    fontFamily: Fonts.headline,
  },
  heroTitleAccent: {
    color: Colors.primary,
    fontFamily: Fonts.headline,
  },
  ctaContainer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 12,
    alignItems: "center",
  },
  primaryButton: {
    width: "100%",
    paddingVertical: 20,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 3,
    color: Colors.background,
    textTransform: "uppercase",
    fontFamily: Fonts.label,
  },
  secondaryButton: {
    width: "100%",
    paddingVertical: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: "transparent",
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 3,
    color: Colors.textPrimary,
    textTransform: "uppercase",
    fontFamily: Fonts.label,
  },
});
