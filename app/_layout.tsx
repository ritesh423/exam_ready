import Ionicons from "@expo/vector-icons/Ionicons";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from "@expo-google-fonts/plus-jakarta-sans";
import { Caveat_700Bold } from "@expo-google-fonts/caveat";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "../theme";

export default function Layout() {
  const insets = useSafeAreaInsets();
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
        tabBarActiveTintColor: theme.notebook.accent,
        tabBarInactiveTintColor: theme.notebook.muted,
        tabBarLabelPosition: "below-icon",
        tabBarHideOnKeyboard: true,
        tabBarStyle: [
          styles.tabBar,
          {
            height: theme.layout.tabBarHeight + insets.bottom,
            paddingBottom: insets.bottom + 2,
          },
        ],
        tabBarIconStyle: styles.tabIcon,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Exams",
          tabBarIcon: ({ focused }) => (
            <NotebookTabIcon
              name={focused ? "book" : "book-outline"}
              focused={focused}
              paperColor={theme.notebook.sage}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="addExam"
        options={{
          title: "New exam",
          tabBarIcon: ({ focused }) => (
            <NotebookTabIcon
              name={focused ? "add-circle" : "add-circle-outline"}
              focused={focused}
              paperColor={theme.notebook.peach}
              alwaysHighlighted
            />
          ),
        }}
      />
      <Tabs.Screen
        name="examDay"
        options={{
          title: "Exam Day",
          tabBarIcon: ({ focused }) => (
            <NotebookTabIcon
              name={focused ? "calendar" : "calendar-outline"}
              focused={focused}
              paperColor={theme.notebook.lavender}
            />
          ),
        }}
      />
    </Tabs>
  );
}

function NotebookTabIcon({
  name,
  focused,
  paperColor,
  alwaysHighlighted = false,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  focused: boolean;
  paperColor: string;
  alwaysHighlighted?: boolean;
}) {
  const highlighted = focused || alwaysHighlighted;

  return (
    <View
      style={[
        styles.iconSticker,
        highlighted && { backgroundColor: paperColor },
      ]}
    >
      <Ionicons
        name={name}
        size={20}
        color={highlighted ? theme.notebook.ink : theme.notebook.muted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: theme.notebook.line,
    backgroundColor: theme.notebook.paper,
    shadowColor: theme.notebook.ink,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 5,
  },
  tabIcon: {
    width: 40,
    height: 30,
  },
  tabLabel: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.2,
  },
  iconSticker: {
    width: 40,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
});
