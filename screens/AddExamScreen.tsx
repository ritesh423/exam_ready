import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import {
  FieldLabel,
  FormTextInput,
  PickerField,
} from "../components/add-exam/FormField";
import { FormCard } from "../components/add-exam/FormCard";
import { theme } from "../theme";
import { useState } from "react";

import { saveExam } from "../data/exams";
import {
  cancelReminder,
  eveningBeforeReminderTime,
  ReminderPermissionError,
  ReminderTimePassedError,
  scheduleEveningBeforeReminder,
} from "../data/reminders";

const twoDigits = (number: number) => String(number).padStart(2, "0");

const formatDate = (date: Date) =>
  `${date.getFullYear()}-${twoDigits(date.getMonth() + 1)}-${twoDigits(date.getDate())}`;

const formatTime = (date: Date) =>
  `${twoDigits(date.getHours())}:${twoDigits(date.getMinutes())}`;

export default function AddExamScreen() {
  const [examName, setExamName] = useState("");
  const [centerName, setCenterName] = useState("");
  const [centerAddress, setCenterAddress] = useState("");
  const [notes, setNotes] = useState("");

  const [reminderEnabled, setReminderEnabled] = useState(false);

  const [examDate, setExamDate] = useState<Date | null>(null);
  const [reportingTime, setReportingTime] = useState<Date | null>(null);
  const [leaveByTime, setLeaveByTime] = useState<Date | null>(null);

  const [activePicker, setActivePicker] = useState<
    "examDate" | "reportingTime" | "leaveByTime" | null
  >(null);

  const [formError, setFormError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  const handlePickerChange = (
    event: DateTimePickerEvent,
    selectedValue?: Date,
  ) => {
    if (Platform.OS === "android") {
      setActivePicker(null);
    }

    if (event.type === "dismissed" || !selectedValue) {
      return;
    }

    if (activePicker === "examDate") {
      setExamDate(selectedValue);
    }

    if (activePicker === "reportingTime") {
      setReportingTime(selectedValue);
    }

    if (activePicker === "leaveByTime") {
      setLeaveByTime(selectedValue);
    }
  };

  const validateExam = () => {
    if (!examName.trim()) {
      setFormError("Enter an exam name.");
      return false;
    }
    if (!examDate) {
      setFormError("Select the exam date.");
      return false;
    }
    if (!reportingTime) {
      setFormError("Select the reporting time.");
      return false;
    }
    if (!centerName.trim() || !centerAddress.trim()) {
      setFormError("Enter the centre name and full address.");
      return false;
    }

    setFormError(null);
    return true;
  };

  const handleCreateExam = async () => {
    if (isSaving || !validateExam() || !examDate || !reportingTime) return;

    if (
      reminderEnabled &&
      eveningBeforeReminderTime(examDate).getTime() <= Date.now()
    ) {
      setFormError(
        "The evening-before reminder time has passed. Choose a later exam date or turn the reminder off.",
      );
      return;
    }

    setIsSaving(true);
    let notificationId: string | null = null;

    try {
      if (reminderEnabled) {
        notificationId = await scheduleEveningBeforeReminder(
          examName.trim(),
          examDate,
        );
      }

      await saveExam({
        name: examName.trim(),
        examDate: formatDate(examDate),
        reportingTime: formatTime(reportingTime),
        leaveByTime: leaveByTime ? formatTime(leaveByTime) : null,
        centerName: centerName.trim(),
        centerAddress: centerAddress.trim(),
        notes: notes.trim(),
        reminderNotificationId: notificationId,
      });

      setExamName("");
      setExamDate(null);
      setReportingTime(null);
      setLeaveByTime(null);
      setCenterName("");
      setCenterAddress("");
      setNotes("");
      setReminderEnabled(false);

      router.replace("/");
    } catch (error) {
      if (notificationId) {
        try {
          await cancelReminder(notificationId);
        } catch (cancelError) {
          console.error("Could not cancel unsaved exam reminder", cancelError);
        }
      }
      setFormError(
        error instanceof ReminderPermissionError
          ? "Allow notifications in your device settings, or turn off the reminder to save this exam."
          : error instanceof ReminderTimePassedError
            ? "The evening-before reminder time has passed. Choose a later exam date or turn the reminder off."
            : reminderEnabled && !notificationId
              ? "Could not schedule the reminder. Try again or turn it off to save this exam."
              : "Could not save the exam. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="dark" />
      <NotebookHeader />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <IntroSection />

          <View style={styles.formFlow}>
            <FormCard
              title="The exam"
              stepLabel="01 / WHAT & WHEN"
              icon="book-outline"
            >
              <View style={styles.field}>
                <FieldLabel label="Exam name" required showRequiredText />
                <FormTextInput
                  value={examName}
                  onChangeText={(text) => setExamName(text)}
                  placeholder="e.g. Operating Systems"
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>

              <View style={styles.field}>
                <FieldLabel label="Exam date" required />
                <PickerField
                  onPress={() => setActivePicker("examDate")}
                  icon="calendar-outline"
                  placeholder="Select exam date"
                  value={examDate?.toLocaleDateString()}
                />
              </View>
            </FormCard>

            <FormCard
              title="The timing"
              stepLabel="02 / SET YOUR CLOCK"
              icon="time-outline"
              tone="peach"
            >
              <View style={styles.field}>
                <FieldLabel label="Reporting time" tone="peach" />
                <PickerField
                  onPress={() => setActivePicker("reportingTime")}
                  icon="alarm-outline"
                  placeholder="Select reporting time"
                  value={reportingTime?.toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                />
              </View>

              <View style={styles.field}>
                <FieldLabel label="Leave-by time" tone="peach" />
                <PickerField
                  onPress={() => setActivePicker("leaveByTime")}
                  icon="walk-outline"
                  placeholder="Select leave-by time"
                  value={leaveByTime?.toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                />
              </View>

              <View style={styles.helperRow}>
                <Ionicons
                  name="information-circle-outline"
                  size={15}
                  color={theme.notebook.accent}
                />
                <Text style={styles.peachHelperText}>
                  Enter the time you plan to leave. ExamReady does not calculate
                  travel time automatically.
                </Text>
              </View>
            </FormCard>

            <FormCard
              title="The place"
              stepLabel="03 / WHERE TO GO"
              icon="location-outline"
            >
              <View style={styles.field}>
                <FieldLabel label="Centre name" />
                <FormTextInput
                  value={centerName}
                  onChangeText={(text) => setCenterName(text)}
                  placeholder="e.g. Turing Science Concourse"
                  autoCapitalize="words"
                  returnKeyType="next"
                  trailingIcon="business-outline"
                />
              </View>

              <View style={styles.field}>
                <FieldLabel label="Full centre address" />
                <FormTextInput
                  value={centerAddress}
                  onChangeText={(text) => setCenterAddress(text)}
                  placeholder="Enter the address used for directions"
                  autoCapitalize="sentences"
                  multiline
                  style={styles.addressInput}
                />
                <Text style={styles.fieldHelperText}>
                  This address will be used when you open Directions.
                </Text>
              </View>
            </FormCard>

            <FormCard
              title="Little reminders"
              stepLabel="04 / BEFORE YOU GO"
              icon="sparkles-outline"
            >
              <View style={styles.reminderRow}>
                <View style={styles.reminderCopy}>
                  <Text style={styles.reminderTitle}>
                    Remind me the evening before
                  </Text>
                  <Text style={styles.fieldHelperText}>
                    Receive a preparation reminder around 7:00 PM.
                  </Text>
                </View>
                <Switch
                  value={reminderEnabled}
                  onValueChange={(it) => setReminderEnabled(it)}
                  trackColor={{
                    false: theme.notebook.line,
                    true: theme.notebook.accent,
                  }}
                  thumbColor={theme.white}
                  ios_backgroundColor={theme.notebook.line}
                />
              </View>

              <View style={styles.field}>
                <FieldLabel label="Notes" optional />
                <FormTextInput
                  value={notes}
                  onChangeText={(text) => setNotes(text)}
                  placeholder="Gate instructions, room details or anything else to remember"
                  autoCapitalize="sentences"
                  multiline
                />
              </View>
            </FormCard>

            <View style={styles.notices}>
              <View style={styles.checklistNotice}>
                <View style={styles.checklistIcon}>
                  <Ionicons
                    name="checkmark-done-outline"
                    size={16}
                    color={theme.notebook.ink}
                  />
                </View>
                <View style={styles.noticeCopy}>
                  <Text style={styles.noticeTitle}>
                    Check your official instructions
                  </Text>
                  <Text style={styles.noticeBody}>
                    Use Notes for any items or entry rules specific to this
                    exam.
                  </Text>
                </View>
              </View>

              <View style={styles.admitCardNote}>
                <Ionicons
                  name="attach-outline"
                  size={15}
                  color={theme.notebook.accent}
                />
                <Text style={styles.admitCardText}>
                  You can attach one admit-card PDF from the Exam Plan after
                  creating this exam.
                </Text>
              </View>
            </View>

            {formError && (
              <Text accessibilityRole="alert" style={styles.formError}>
                {formError}
              </Text>
            )}
            <Pressable
              onPress={handleCreateExam}
              disabled={isSaving}
              accessibilityRole="button"
              accessibilityLabel="Create exam"
              style={({ pressed }) => [
                styles.createButton,
                pressed && styles.createButtonPressed,
              ]}
            >
              <Text style={styles.createButtonText}>
                {isSaving ? "Saving..." : "Create exam"}
              </Text>
              <Ionicons name="arrow-forward" size={16} color={theme.white} />
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {activePicker !== null && (
        <View style={Platform.OS === "ios" && styles.iosPickerContainer}>
          {Platform.OS === "ios" && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Done selecting date or time"
              onPress={() => setActivePicker(null)}
              style={styles.pickerDoneButton}
            >
              <Text style={styles.pickerDoneText}>Done</Text>
            </Pressable>
          )}
          <DateTimePicker
            value={
              activePicker === "examDate"
                ? (examDate ?? new Date())
                : activePicker === "reportingTime"
                  ? (reportingTime ?? new Date())
                  : (leaveByTime ?? new Date())
            }
            mode={activePicker === "examDate" ? "date" : "time"}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handlePickerChange}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

function IntroSection() {
  return (
    <View style={styles.intro}>
      <View style={styles.introTextGroup}>
        <Text style={styles.eyebrow}>A NEW PAGE IN YOUR PLANNER</Text>
        <Text style={styles.heading}>Let’s get you ready.</Text>
        <Text style={styles.introText}>
          One calm place for everything exam day needs.
        </Text>
      </View>
      <Image
        source={require("../assets/add-exam-notebook-hero.png")}
        style={styles.heroIllustration}
        resizeMode="contain"
        accessibilityLabel="Exam ticket, checklist, calendar and pencil"
      />
    </View>
  );
}

function NotebookHeader() {
  return (
    <View style={styles.notebookHeader}>
      <View style={styles.notebookBrand}>
        <View style={styles.brandMark}>
          <Ionicons name="book-outline" size={17} color={theme.notebook.ink} />
        </View>
        <Text style={styles.brandText}>examready</Text>
      </View>
      <View style={styles.pageLabel}>
        <Text style={styles.pageLabelText}>NEW EXAM / 01</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.notebook.canvas,
  },
  keyboardView: {
    flex: 1,
  },
  iosPickerContainer: {
    backgroundColor: theme.notebook.paper,
    paddingBottom: theme.spacing.xl,
  },
  pickerDoneButton: {
    alignSelf: "flex-end",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  pickerDoneText: {
    color: theme.notebook.accent,
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 16,
  },
  scrollContent: {
    paddingTop: 12,
    paddingHorizontal: theme.layout.screenPadding,
    paddingBottom: 40,
  },
  notebookHeader: {
    height: 60,
    paddingHorizontal: theme.layout.screenPadding,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  notebookBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.notebook.sage,
    transform: [{ rotate: "-7deg" }],
  },
  brandText: {
    color: theme.notebook.ink,
    fontFamily: "Caveat_700Bold",
    fontSize: 27,
    lineHeight: 32,
  },
  pageLabel: {
    borderBottomWidth: 1,
    borderBottomColor: theme.notebook.ink,
    paddingBottom: 3,
  },
  pageLabelText: {
    color: theme.notebook.muted,
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 9,
    letterSpacing: 1.2,
  },
  intro: {
    minHeight: 154,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  introTextGroup: {
    flex: 1,
  },
  eyebrow: {
    color: theme.notebook.accent,
    fontFamily: theme.fontFamily.bold,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  heading: {
    color: theme.notebook.ink,
    fontFamily: "Caveat_700Bold",
    fontSize: 40,
    lineHeight: 43,
    marginTop: 3,
  },
  introText: {
    marginTop: 4,
    color: theme.notebook.muted,
    fontFamily: theme.fontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  heroIllustration: {
    width: 116,
    height: 116,
    marginRight: -4,
  },
  formFlow: {
    gap: 16,
  },
  field: {
    gap: 6,
  },
  addressInput: {
    minHeight: 72,
  },
  helperRow: {
    paddingHorizontal: 2,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  peachHelperText: {
    flex: 1,
    color: theme.notebook.muted,
    fontFamily: theme.fontFamily.regular,
    fontSize: 11,
    lineHeight: 18,
    letterSpacing: 0.44,
  },
  fieldHelperText: {
    paddingHorizontal: 2,
    color: theme.notebook.muted,
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.44,
  },
  reminderRow: {
    paddingVertical: theme.spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  reminderCopy: {
    flex: 1,
    gap: 2,
  },
  reminderTitle: {
    color: theme.notebook.ink,
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 18,
    lineHeight: 26,
    letterSpacing: -0.09,
  },
  notices: {
    gap: 12,
    paddingBottom: theme.spacing.sm,
  },
  checklistNotice: {
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.md,
    borderRadius: 8,
    backgroundColor: theme.notebook.sage,
    transform: [{ rotate: "-1deg" }],
  },
  checklistIcon: {
    width: 28,
    height: 28,
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#F8F7EE",
  },
  noticeCopy: {
    flex: 1,
  },
  noticeTitle: {
    color: theme.notebook.ink,
    fontFamily: theme.fontFamily.bold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.14,
  },
  noticeBody: {
    marginTop: 1,
    color: theme.notebook.muted,
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    lineHeight: 19,
  },
  admitCardNote: {
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
    backgroundColor: theme.notebook.lavender,
    borderRadius: 8,
    transform: [{ rotate: "1deg" }],
  },
  admitCardText: {
    flex: 1,
    color: theme.notebook.ink,
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.44,
  },
  createButton: {
    width: "100%",
    height: theme.primaryButton.height,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    borderRadius: 10,
    backgroundColor: theme.notebook.ink,
    shadowColor: theme.notebook.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 5,
  },
  createButtonPressed: {
    opacity: 0.88,
  },
  createButtonText: {
    color: theme.white,
    fontFamily: theme.fontFamily.bold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.14,
  },
  formError: {
    color: theme.danger,
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 13,
    lineHeight: 20,
  },
});
