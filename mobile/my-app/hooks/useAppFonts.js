import { useFonts } from "expo-font";
import { SpaceGrotesk_700Bold } from "@expo-google-fonts/space-grotesk";
import { Manrope_400Regular, Manrope_700Bold } from "@expo-google-fonts/manrope";

export function useAppFonts() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_700Bold,
    Manrope_400Regular,
    Manrope_700Bold,
  });

  return fontsLoaded;
}