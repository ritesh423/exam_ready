import Entypo from "@expo/vector-icons/Entypo";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import { Caveat_700Bold } from "@expo-google-fonts/caveat";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";

import { theme } from "../theme";

export default function Layout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    Caveat_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Exams",
          tabBarIcon: ({ size, color }) => (
            <Entypo
              name="calendar"
              size={size}
              color={typeof color === "string" ? color : theme.textMuted}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="addExam"
        options={{
          title: "Add Exam",
          tabBarLabel: () => null,
          tabBarIcon: () => (
            <View style={styles.addButton}>
              <Ionicons name="add" size={28} color={theme.white} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="examDay"
        options={{
          title: "Exam Day",
          tabBarIcon: ({ size, color }) => (
            <MaterialIcons
              name="event-available"
              size={size}
              color={typeof color === "string" ? color : theme.textMuted}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: theme.layout.tabBarHeight,
    paddingTop: 6,
    paddingBottom: 6,
    borderTopWidth: 0,
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    shadowColor: theme.text,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 12,
  },
  tabLabel: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.44,
  },
  addButton: {
    width: 56,
    height: 56,
    marginTop: -24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 28,
    backgroundColor: theme.primary,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
});
