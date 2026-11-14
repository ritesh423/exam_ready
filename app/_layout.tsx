import { Caveat_700Bold } from "@expo-google-fonts/caveat";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import { Stack } from "expo-router";

import "../data/reminders";

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    Caveat_700Bold,
  });

  if (!fontsLoaded && !fontError) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
