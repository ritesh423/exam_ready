import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { theme } from "../theme";

const sections = [
  {
    title: "Information you save",
    body: "Examinute lets you save exam names, dates, times, centre details, notes and optional admit-card PDFs. The app stores these in its private storage on your device to show your exam plan. SoloStack Dev does not receive or upload this information.",
  },
  {
    title: "Reminders",
    body: "If you enable a reminder, Examinute asks for notification permission and schedules a local notification for 7:00 PM on the evening before your exam. The notification may show your exam name. We do not send push notifications or receive your reminder details.",
  },
  {
    title: "Directions and PDFs",
    body: "When you tap Directions, Examinute opens a Google Maps URL containing the exam centre name and address you saved. When you open or share an admit-card PDF, the viewer or sharing app you choose may receive that file. These actions are initiated by you, and those services have their own privacy practices. Examinute does not access your current location.",
  },
  {
    title: "Data use and security",
    body: "Examinute does not require an account and does not use ads, analytics or trackers. Your exam details are kept in app-private device storage, and we do not sell them. Your device's backup service may retain copies according to your device settings.",
  },
  {
    title: "Keeping and deleting data",
    body: "Your information stays in the app until you delete an exam or uninstall Examinute. Deleting an exam removes its saved details and attached PDF from the app and cancels its scheduled reminder. Device backups are managed by your device provider.",
  },
  {
    title: "Changes and contact",
    body: "We may update this policy if Examinute's features or data practices change. For privacy questions, contact SoloStack Dev at riteshsingh.py@gmail.com.",
  },
];

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <StatusBar style="dark" />
      <View style={styles.topBar}>
        <Pressable
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={20} color={theme.notebook.ink} />
        </Pressable>
        <Text style={styles.brand}>examinute</Text>
        <Text style={styles.topLabel}>PRIVACY</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>SOLOSTACK DEV</Text>
        <Text style={styles.title}>Privacy policy</Text>
        <Text style={styles.updated}>Last updated 16 November 2026</Text>

        <View style={styles.paper}>
          {sections.map((section, index) => (
            <View
              key={section.title}
              style={index > 0 ? styles.sectionWithDivider : undefined}
            >
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.body}>{section.body}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.notebook.canvas },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    minHeight: 64,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    borderWidth: 1,
    borderColor: theme.notebook.line,
    backgroundColor: theme.notebook.paper,
  },
  brand: {
    color: theme.notebook.ink,
    fontFamily: "Caveat_700Bold",
    fontSize: 26,
    lineHeight: 31,
  },
  topLabel: {
    marginLeft: "auto",
    color: theme.notebook.muted,
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  content: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 40 },
  eyebrow: {
    color: theme.notebook.accent,
    fontFamily: theme.fontFamily.bold,
    fontSize: 11,
    letterSpacing: 1.6,
  },
  title: {
    marginTop: 9,
    color: theme.notebook.ink,
    fontFamily: "Caveat_700Bold",
    fontSize: 43,
    lineHeight: 50,
  },
  updated: {
    color: theme.notebook.muted,
    fontFamily: theme.fontFamily.regular,
    fontSize: 12,
  },
  paper: {
    marginTop: 24,
    padding: 22,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.notebook.line,
    backgroundColor: theme.notebook.paper,
  },
  sectionWithDivider: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: theme.notebook.line,
  },
  sectionTitle: {
    color: theme.notebook.ink,
    fontFamily: theme.fontFamily.bold,
    fontSize: 15,
    lineHeight: 22,
  },
  body: {
    marginTop: 7,
    color: theme.notebook.muted,
    fontFamily: theme.fontFamily.regular,
    fontSize: 12,
    lineHeight: 20,
  },
});
