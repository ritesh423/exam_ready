import Ionicons from "@expo/vector-icons/Ionicons";
import * as DocumentPicker from "expo-document-picker";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  copyAdmitCard,
  deleteAdmitCard,
  getAdmitCardFile,
} from "../data/admitCards";
import { getExamPlan, setAdmitCard, type ExamPlan } from "../data/exams";
import { theme } from "../theme";

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ExamPlanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const examId = Number(id);
  const validId = Number.isSafeInteger(examId) && examId > 0;
  const [exam, setExam] = useState<ExamPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadExam = useCallback(() => {
    if (!validId) {
      setLoading(false);
      setError("This exam link is invalid.");
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    setExam(null);
    void getExamPlan(examId)
      .then((result) => {
        if (active) setExam(result);
      })
      .catch(() => {
        if (active) setError("Couldn’t load this exam. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [examId, validId]);

  useFocusEffect(loadExam);

  const attachPdf = async () => {
    if (!exam || busy) return;
    setBusy(true);
    setError(null);
    let newFileName: string | null = null;
    let stage: "picker" | "copy" | "database" = "picker";
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: Platform.OS !== "android",
        multiple: false,
      });
      if (result.canceled) return;

      const picked = result.assets[0];
      if (
        picked.mimeType !== "application/pdf" &&
        !picked.name.toLowerCase().endsWith(".pdf")
      ) {
        setError("Choose a PDF file for your admit card.");
        return;
      }

      stage = "copy";
      newFileName = await copyAdmitCard(exam.id, picked.uri);
      stage = "database";
      await setAdmitCard(exam.id, newFileName, picked.name);
      const oldFileName = exam.admitCardUri;
      setExam({
        ...exam,
        admitCardUri: newFileName,
        admitCardName: picked.name,
      });
      if (oldFileName) {
        try {
          deleteAdmitCard(oldFileName);
        } catch {
          // The replacement is saved; a stale old file can be cleaned up later.
        }
      }
    } catch (cause) {
      console.error(`Admit card ${stage} failed`, cause);
      if (newFileName) {
        try {
          deleteAdmitCard(newFileName);
        } catch {}
      }
      const message =
        stage === "picker"
          ? "Couldn’t read the selected PDF. Try downloading it to your device first."
          : stage === "copy"
            ? "Couldn’t save a copy of this PDF on your device."
            : "Couldn’t link the PDF to this exam. Please try again.";
      setError(
        __DEV__ && cause instanceof Error
          ? `${message} ${cause.message.slice(0, 160)}`
          : message,
      );
    } finally {
      setBusy(false);
    }
  };

  const openPdf = async () => {
    if (!exam?.admitCardUri || busy) return;
    setBusy(true);
    setError(null);
    try {
      const file = getAdmitCardFile(exam.admitCardUri);
      if (!file.exists) {
        setError("This PDF is missing. Attach it again to restore it.");
        return;
      }
      if (await file.canPreview({ mimeType: "application/pdf" })) {
        await file.preview({
          title: exam.admitCardName ?? "Admit card",
          mimeType: "application/pdf",
        });
      } else if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          dialogTitle: "Open admit card PDF",
          mimeType: "application/pdf",
          UTI: "com.adobe.pdf",
        });
      } else {
        setError("No PDF viewer is available on this device.");
      }
    } catch {
      setError("Couldn’t open the PDF. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const removePdf = () => {
    if (!exam?.admitCardUri || busy) return;
    Alert.alert(
      "Remove admit card?",
      "The PDF will be removed from this exam.",
      [
        { text: "Keep it", style: "cancel" },
        {
          text: "Remove PDF",
          style: "destructive",
          onPress: () => {
            void (async () => {
              if (!exam?.admitCardUri) return;
              setBusy(true);
              setError(null);
              try {
                await setAdmitCard(exam.id, null, null);
                const oldFileName = exam.admitCardUri;
                setExam({ ...exam, admitCardUri: null, admitCardName: null });
                try {
                  deleteAdmitCard(oldFileName);
                } catch {
                  // The record no longer points to this file.
                }
              } catch {
                setError("Couldn’t remove the PDF. Please try again.");
              } finally {
                setBusy(false);
              }
            })();
          },
        },
      ],
    );
  };

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
        <Text style={styles.topLabel}>EXAM PLAN</Text>
      </View>

      {loading ? (
        <ActivityIndicator
          color={theme.notebook.accent}
          style={styles.loader}
        />
      ) : !exam ? (
        <View style={styles.emptyCard}>
          <Text style={styles.heading}>No exam found.</Text>
          <Text style={styles.body}>
            {error ?? "This exam may have been removed."}
          </Text>
          <Pressable
            onPress={() => router.replace("/")}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryText}>Back to exams</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <Text style={styles.eyebrow}>ONE EXAM, ALL TOGETHER</Text>
          <Text style={styles.heading}>{exam.name}</Text>
          <Text style={styles.subheading}>{formatDate(exam.examDate)}</Text>

          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <Ionicons
                name="time-outline"
                size={21}
                color={theme.notebook.accent}
              />
            </View>
            <View style={styles.summaryCopy}>
              <Text style={styles.cardLabel}>REPORT BY</Text>
              <Text style={styles.summaryValue}>
                {formatTime(exam.reportingTime)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryCopy}>
              <Text style={styles.cardLabel}>LEAVE BY</Text>
              <Text style={styles.summaryValue}>
                {exam.leaveByTime ? formatTime(exam.leaveByTime) : "Not set"}
              </Text>
            </View>
          </View>

          <View style={styles.paperCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, styles.peachIcon]}>
                <Ionicons
                  name="document-text-outline"
                  size={22}
                  color={theme.notebook.ink}
                />
              </View>
              <View>
                <Text style={styles.cardTitle}>Admit card</Text>
                <Text style={styles.cardSubtitle}>
                  Keep your exam PDF close.
                </Text>
              </View>
            </View>

            {exam.admitCardUri ? (
              <View style={styles.attachedFile}>
                <Ionicons
                  name="document-attach-outline"
                  size={24}
                  color={theme.notebook.accent}
                />
                <View style={styles.fileCopy}>
                  <Text style={styles.fileName} numberOfLines={2}>
                    {exam.admitCardName ?? "Admit card.pdf"}
                  </Text>
                  <Text style={styles.fileStatus}>
                    PDF attached to this exam
                  </Text>
                </View>
                <Ionicons
                  name="checkmark-circle"
                  size={21}
                  color={theme.notebook.accent}
                />
              </View>
            ) : (
              <View style={styles.missingFile}>
                <Ionicons
                  name="cloud-upload-outline"
                  size={27}
                  color={theme.notebook.accent}
                />
                <Text style={styles.missingTitle}>No admit card yet</Text>
                <Text style={styles.body}>
                  Add the PDF from your device. A copy stays in this app for
                  this exam.
                </Text>
              </View>
            )}

            {error && (
              <Text accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
            )}

            {exam.admitCardUri && (
              <Pressable
                onPress={() => void openPdf()}
                disabled={busy}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="eye-outline" size={18} color={theme.white} />
                <Text style={styles.primaryText}>Open PDF</Text>
                <Ionicons name="arrow-forward" size={17} color={theme.white} />
              </Pressable>
            )}
            <Pressable
              onPress={() => void attachPdf()}
              disabled={busy}
              accessibilityRole="button"
              style={({ pressed }) => [
                exam.admitCardUri
                  ? styles.secondaryButton
                  : styles.primaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="attach-outline"
                size={18}
                color={exam.admitCardUri ? theme.notebook.accent : theme.white}
              />
              <Text
                style={
                  exam.admitCardUri ? styles.secondaryText : styles.primaryText
                }
              >
                {busy
                  ? "Working..."
                  : exam.admitCardUri
                    ? "Replace PDF"
                    : "Attach PDF"}
              </Text>
            </Pressable>
            {exam.admitCardUri && (
              <Pressable
                onPress={removePdf}
                disabled={busy}
                accessibilityRole="button"
                style={styles.removeButton}
              >
                <Text style={styles.removeText}>Remove PDF</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.paperCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, styles.sageIcon]}>
                <Ionicons
                  name="location-outline"
                  size={22}
                  color={theme.notebook.ink}
                />
              </View>
              <Text style={styles.cardTitle}>Exam centre</Text>
            </View>
            <Text style={styles.placeName}>{exam.centerName}</Text>
            <Text style={styles.body}>{exam.centerAddress}</Text>
          </View>

          {exam.notes ? (
            <View style={styles.paperCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, styles.lavenderIcon]}>
                  <Ionicons
                    name="reader-outline"
                    size={21}
                    color={theme.notebook.accent}
                  />
                </View>
                <Text style={styles.cardTitle}>Your notes</Text>
              </View>
              <Text style={styles.body}>{exam.notes}</Text>
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.notebook.canvas },
  topBar: {
    height: 62,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.layout.screenPadding,
    gap: 10,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.notebook.paper,
    borderWidth: 1,
    borderColor: theme.notebook.line,
  },
  brand: {
    fontFamily: "Caveat_700Bold",
    fontSize: 27,
    color: theme.notebook.ink,
  },
  topLabel: {
    marginLeft: "auto",
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 9,
    letterSpacing: 1.2,
    color: theme.notebook.muted,
  },
  content: {
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: 20,
    paddingBottom: 42,
    gap: 18,
  },
  eyebrow: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 10,
    letterSpacing: 1.3,
    color: theme.notebook.accent,
  },
  heading: {
    fontFamily: "Caveat_700Bold",
    fontSize: 43,
    lineHeight: 48,
    color: theme.notebook.ink,
  },
  subheading: {
    marginTop: -13,
    fontFamily: theme.fontFamily.regular,
    fontSize: 13,
    color: theme.notebook.muted,
  },
  loader: { marginTop: 90 },
  emptyCard: {
    margin: theme.layout.screenPadding,
    padding: 24,
    borderRadius: 20,
    backgroundColor: theme.notebook.paper,
    gap: 12,
  },
  summaryCard: {
    marginTop: 8,
    padding: 17,
    borderRadius: 18,
    backgroundColor: theme.notebook.lavender,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  summaryIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: theme.notebook.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCopy: { flex: 1, minWidth: 0 },
  summaryDivider: {
    height: 35,
    width: 1,
    backgroundColor: "rgba(89,88,168,0.2)",
  },
  cardLabel: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 9,
    letterSpacing: 0.8,
    color: theme.notebook.accent,
  },
  summaryValue: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 12,
    color: theme.notebook.ink,
    marginTop: 5,
  },
  paperCard: {
    borderRadius: 20,
    padding: 19,
    backgroundColor: theme.notebook.paper,
    borderWidth: 1,
    borderColor: theme.notebook.line,
    gap: 16,
    shadowColor: theme.notebook.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 11 },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  peachIcon: { backgroundColor: theme.notebook.peach },
  sageIcon: { backgroundColor: theme.notebook.sage },
  lavenderIcon: { backgroundColor: theme.notebook.lavender },
  cardTitle: {
    fontFamily: "Caveat_700Bold",
    fontSize: 25,
    lineHeight: 30,
    color: theme.notebook.ink,
  },
  cardSubtitle: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 11,
    color: theme.notebook.muted,
  },
  attachedFile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    backgroundColor: theme.notebook.lavender,
    borderRadius: 14,
  },
  fileCopy: { flex: 1 },
  fileName: {
    fontFamily: theme.fontFamily.semiBold,
    color: theme.notebook.ink,
    fontSize: 12,
  },
  fileStatus: {
    marginTop: 3,
    fontFamily: theme.fontFamily.regular,
    color: theme.notebook.muted,
    fontSize: 10,
  },
  missingFile: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: theme.notebook.line,
    borderRadius: 14,
    gap: 7,
  },
  missingTitle: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 13,
    color: theme.notebook.ink,
  },
  body: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 12,
    lineHeight: 19,
    color: theme.notebook.muted,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 13,
    paddingHorizontal: 16,
    backgroundColor: theme.notebook.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  primaryText: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 12,
    color: theme.white,
  },
  secondaryButton: {
    minHeight: 45,
    borderRadius: 13,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.notebook.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  secondaryText: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 12,
    color: theme.notebook.accent,
  },
  removeButton: { alignItems: "center", paddingVertical: 6 },
  removeText: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 11,
    color: theme.danger,
  },
  placeName: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 13,
    color: theme.notebook.ink,
  },
  pressed: { opacity: 0.78 },
  error: {
    color: theme.danger,
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 11,
    lineHeight: 17,
  },
});
