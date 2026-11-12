import Ionicons from "@expo/vector-icons/Ionicons";
import * as Linking from "expo-linking";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { listUpcomingExamDetails, type ExamDayDetails } from "../data/exams";
import { theme } from "../theme";

function todayString() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

function localDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function daysUntil(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const today = new Date();
  const start = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  return Math.round((Date.UTC(year, month - 1, day) - start) / 86400000);
}

function displayTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function countdownLabel(days: number) {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days} days to go`;
}

async function openDirections(exam: ExamDayDetails) {
  const destination = `${exam.centerName}, ${exam.centerAddress}`;
  const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert(
      "Couldn’t open directions",
      "Please try opening your maps app.",
    );
  }
}

export default function ExamDayScreen() {
  const [exams, setExams] = useState<ExamDayDetails[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [today, setToday] = useState(todayString());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const latestRequest = useRef(0);
  const lastLoadedDate = useRef<string | null>(null);

  const loadExams = useCallback(() => {
    const request = ++latestRequest.current;
    const currentDate = todayString();
    const dateChanged = lastLoadedDate.current !== currentDate;
    lastLoadedDate.current = currentDate;
    setToday(currentDate);
    setLoading(true);
    setError(false);

    void listUpcomingExamDetails(currentDate)
      .then((rows) => {
        if (request !== latestRequest.current) return;
        setExams(rows);
        setSelectedId((current) =>
          !dateChanged && rows.some((exam) => exam.id === current)
            ? current
            : (rows[0]?.id ?? null),
        );
      })
      .catch(() => {
        if (request !== latestRequest.current) return;
        setExams([]);
        setSelectedId(null);
        setError(true);
      })
      .finally(() => {
        if (request === latestRequest.current) setLoading(false);
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadExams();
      const subscription = AppState.addEventListener("change", (state) => {
        if (state === "active") loadExams();
      });
      return () => {
        subscription.remove();
        latestRequest.current += 1;
      };
    }, [loadExams]),
  );

  const selectedExam = exams.find((exam) => exam.id === selectedId) ?? exams[0];
  const isToday = !loading && selectedExam?.examDate === today;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <PageHeader isToday={isToday} />

        {loading ? (
          <ActivityIndicator
            color={theme.notebook.accent}
            style={styles.loading}
          />
        ) : error ? (
          <View style={styles.messageCard}>
            <Text style={styles.messageTitle}>This page couldn’t load.</Text>
            <Text style={styles.bodyText}>
              Try opening your saved exam again.
            </Text>
            <Pressable
              onPress={loadExams}
              accessibilityRole="button"
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : selectedExam ? (
          <>
            {exams.length > 1 && (
              <ExamSelector
                exams={exams}
                selectedId={selectedExam.id}
                onSelect={setSelectedId}
              />
            )}
            <DayHero exam={selectedExam} />
            <TimingCard exam={selectedExam} />
            <PlaceCard exam={selectedExam} />
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/exams/[id]",
                  params: { id: String(selectedExam.id) },
                })
              }
              accessibilityRole="button"
              style={styles.planLink}
            >
              <Ionicons
                name="document-text-outline"
                size={18}
                color={theme.notebook.accent}
              />
              <Text style={styles.planLinkText}>Exam plan & admit card</Text>
              <Ionicons
                name="arrow-forward"
                size={16}
                color={theme.notebook.accent}
              />
            </Pressable>
            {selectedExam.notes.trim() ? (
              <NotesCard notes={selectedExam.notes} />
            ) : null}
            <View style={styles.finalNote}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={theme.notebook.accent}
              />
              <Text style={styles.finalNoteText}>
                Check your official admit card for entry rules and permitted
                items.
              </Text>
            </View>
          </>
        ) : (
          <EmptyDay />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function PageHeader({ isToday }: { isToday: boolean }) {
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <View style={styles.brandMark}>
          <Ionicons name="book-outline" size={17} color={theme.notebook.ink} />
        </View>
        <Text style={styles.brandText}>examready</Text>
        <Text style={styles.pageLabel}>DAY-OF DESK</Text>
      </View>
      <Text style={styles.heading}>Exam day</Text>
      <Text style={styles.subtitle}>
        {isToday
          ? "Today is the day. One step at a time."
          : "Your next exam, all in one calm place."}
      </Text>
    </View>
  );
}

function EmptyDay() {
  return (
    <View style={styles.emptyCard}>
      <Image
        source={require("../assets/add-exam-notebook-hero.png")}
        style={styles.emptyImage}
        resizeMode="contain"
        accessibilityLabel="Illustrated exam calendar and checklist"
      />
      <Text style={styles.emptyHeading}>A clear page ahead.</Text>
      <Text style={styles.emptyText}>
        Your next exam’s timing and directions will appear here when you add it.
      </Text>
      <Pressable
        onPress={() => router.navigate("/addExam")}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.primaryButtonText}>Create an exam</Text>
        <Ionicons name="arrow-forward" size={17} color={theme.notebook.paper} />
      </Pressable>
    </View>
  );
}

function ExamSelector({
  exams,
  selectedId,
  onSelect,
}: {
  exams: ExamDayDetails[];
  selectedId: number;
  onSelect: (id: number) => void;
}) {
  return (
    <View style={styles.selectorSection}>
      <Text style={styles.selectorLabel}>CHOOSE AN EXAM</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.selectorContent}
      >
        {exams.map((exam) => {
          const selected = exam.id === selectedId;
          const date = localDate(exam.examDate);
          return (
            <Pressable
              key={exam.id}
              onPress={() => onSelect(exam.id)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${exam.name}, ${date.toLocaleDateString()}`}
              style={[styles.examChip, selected && styles.selectedChip]}
            >
              <Text
                style={[styles.chipText, selected && styles.selectedChipText]}
                numberOfLines={1}
              >
                {exam.name}
              </Text>
              <Text
                style={[styles.chipDate, selected && styles.selectedChipText]}
              >
                {date.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function DayHero({ exam }: { exam: ExamDayDetails }) {
  const date = localDate(exam.examDate);
  const days = daysUntil(exam.examDate);

  return (
    <View style={styles.heroStack}>
      <View style={styles.heroUnderlay} />
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <Text style={styles.cardEyebrow}>
            {days === 0 ? "TODAY’S EXAM" : "UP NEXT"}
          </Text>
          <Text style={styles.countdown}>{countdownLabel(days)}</Text>
        </View>
        <View style={styles.heroMain}>
          <View style={styles.heroCopy}>
            <Text style={styles.examName}>{exam.name}</Text>
            <Text style={styles.examDate}>
              {date.toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
          </View>
          <View style={styles.dateStamp}>
            <Text style={styles.dateMonth}>
              {date
                .toLocaleDateString(undefined, { month: "short" })
                .toUpperCase()}
            </Text>
            <Text style={styles.dateDay}>{date.getDate()}</Text>
          </View>
        </View>
        <View style={styles.heroRule} />
        <Text style={styles.heroFooter}>
          Your saved exam details, at a glance.
        </Text>
      </View>
    </View>
  );
}

function TimingCard({ exam }: { exam: ExamDayDetails }) {
  return (
    <View style={styles.paperCard}>
      <View style={styles.cardHeading}>
        <View style={[styles.cardIcon, styles.lavenderIcon]}>
          <Ionicons
            name="time-outline"
            size={20}
            color={theme.notebook.accent}
          />
        </View>
        <Text style={styles.cardTitle}>Your timing</Text>
      </View>
      <View style={styles.timeRow}>
        <View style={[styles.timeBlock, styles.leaveBlock]}>
          <Text style={styles.timeLabel}>LEAVE BY</Text>
          <Text style={styles.timeValue} numberOfLines={1} adjustsFontSizeToFit>
            {exam.leaveByTime ? displayTime(exam.leaveByTime) : "Not set"}
          </Text>
        </View>
        <View style={[styles.timeBlock, styles.reportBlock]}>
          <Text style={styles.timeLabel}>REPORT BY</Text>
          <Text style={styles.timeValue} numberOfLines={1} adjustsFontSizeToFit>
            {displayTime(exam.reportingTime)}
          </Text>
        </View>
      </View>
      <Text style={styles.helperText}>
        {exam.leaveByTime
          ? "Leave-by is the time you chose. Check your route and travel time before setting out."
          : "No leave-by time was saved. Check your route and travel time before setting out."}
      </Text>
    </View>
  );
}

function PlaceCard({ exam }: { exam: ExamDayDetails }) {
  return (
    <View style={styles.paperCard}>
      <View style={styles.cardHeading}>
        <View style={[styles.cardIcon, styles.peachIcon]}>
          <Ionicons
            name="location-outline"
            size={20}
            color={theme.notebook.ink}
          />
        </View>
        <Text style={styles.cardTitle}>Where to go</Text>
      </View>
      <Text style={styles.placeName}>{exam.centerName}</Text>
      <Text style={styles.address}>{exam.centerAddress}</Text>
      <Pressable
        onPress={() => void openDirections(exam)}
        accessibilityRole="button"
        accessibilityLabel={`Open directions to ${exam.centerName}`}
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons
          name="navigate-outline"
          size={17}
          color={theme.notebook.paper}
        />
        <Text style={styles.primaryButtonText}>Directions</Text>
        <Ionicons name="arrow-forward" size={16} color={theme.notebook.paper} />
      </Pressable>
    </View>
  );
}

function NotesCard({ notes }: { notes: string }) {
  return (
    <View style={[styles.paperCard, styles.notesCard]}>
      <View style={styles.cardHeading}>
        <View style={[styles.cardIcon, styles.sageIcon]}>
          <Ionicons
            name="reader-outline"
            size={20}
            color={theme.notebook.ink}
          />
        </View>
        <Text style={styles.cardTitle}>Your notes</Text>
      </View>
      <Text style={styles.notesText}>{notes}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  planLink: {
    minHeight: 50,
    borderRadius: 14,
    paddingHorizontal: 16,
    backgroundColor: theme.notebook.paper,
    borderWidth: 1,
    borderColor: theme.notebook.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  planLinkText: {
    flex: 1,
    fontFamily: theme.fontFamily.bold,
    fontSize: 12,
    color: theme.notebook.accent,
  },
  safeArea: { flex: 1, backgroundColor: theme.notebook.canvas },
  content: {
    paddingHorizontal: theme.layout.screenPadding,
    paddingBottom: 40,
    gap: 16,
  },
  header: { paddingTop: 12, paddingBottom: 5 },
  brandRow: {
    minHeight: 44,
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
    marginLeft: "auto",
    color: theme.notebook.muted,
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 9,
    letterSpacing: 1.2,
  },
  heading: {
    marginTop: 15,
    color: theme.notebook.ink,
    fontFamily: "Caveat_700Bold",
    fontSize: 44,
    lineHeight: 48,
  },
  subtitle: {
    color: theme.notebook.muted,
    fontFamily: theme.fontFamily.regular,
    fontSize: 13,
    lineHeight: 20,
  },
  loading: { marginTop: 80 },
  selectorSection: { gap: 8 },
  selectorLabel: {
    color: theme.notebook.accent,
    fontFamily: theme.fontFamily.bold,
    fontSize: 9,
    letterSpacing: 1.1,
  },
  selectorContent: { gap: 8, paddingRight: 20 },
  examChip: {
    maxWidth: 180,
    minWidth: 110,
    borderWidth: 1,
    borderColor: theme.notebook.line,
    borderRadius: 13,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: theme.notebook.paper,
  },
  selectedChip: {
    borderColor: theme.notebook.accent,
    backgroundColor: theme.notebook.lavender,
  },
  chipText: {
    color: theme.notebook.ink,
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 11,
  },
  chipDate: {
    marginTop: 4,
    color: theme.notebook.muted,
    fontFamily: theme.fontFamily.regular,
    fontSize: 10,
  },
  selectedChipText: { color: theme.notebook.accent },
  heroStack: { position: "relative", marginRight: 4, marginBottom: 5 },
  heroUnderlay: {
    position: "absolute",
    top: 5,
    right: -4,
    bottom: -5,
    left: 4,
    borderRadius: 20,
    backgroundColor: "rgba(217, 135, 121, 0.24)",
  },
  heroCard: {
    borderWidth: 1,
    borderColor: theme.notebook.line,
    borderRadius: 20,
    padding: 18,
    backgroundColor: theme.notebook.paper,
    shadowColor: theme.notebook.ink,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardEyebrow: {
    color: theme.notebook.accent,
    fontFamily: theme.fontFamily.bold,
    fontSize: 9,
    letterSpacing: 1.1,
  },
  countdown: {
    overflow: "hidden",
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 9,
    backgroundColor: theme.notebook.sage,
    color: theme.notebook.ink,
    fontFamily: theme.fontFamily.bold,
    fontSize: 10,
  },
  heroMain: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  heroCopy: { flex: 1 },
  examName: {
    color: theme.notebook.ink,
    fontFamily: theme.fontFamily.bold,
    fontSize: 19,
    lineHeight: 26,
  },
  examDate: {
    marginTop: 7,
    color: theme.notebook.muted,
    fontFamily: theme.fontFamily.regular,
    fontSize: 11,
    lineHeight: 17,
  },
  dateStamp: {
    width: 54,
    height: 66,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.notebook.peach,
    transform: [{ rotate: "4deg" }],
  },
  dateMonth: {
    color: theme.notebook.ink,
    fontFamily: theme.fontFamily.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
  dateDay: {
    color: theme.notebook.ink,
    fontFamily: "Caveat_700Bold",
    fontSize: 34,
    lineHeight: 36,
  },
  heroRule: {
    marginTop: 17,
    marginBottom: 12,
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderColor: theme.notebook.line,
  },
  heroFooter: {
    color: theme.notebook.muted,
    fontFamily: theme.fontFamily.regular,
    fontSize: 11,
    lineHeight: 17,
  },
  paperCard: {
    borderWidth: 1,
    borderColor: theme.notebook.line,
    borderRadius: 18,
    padding: 18,
    backgroundColor: theme.notebook.paper,
  },
  cardHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 17,
  },
  cardIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  lavenderIcon: { backgroundColor: theme.notebook.lavender },
  peachIcon: { backgroundColor: theme.notebook.peach },
  sageIcon: { backgroundColor: theme.notebook.sage },
  cardTitle: {
    color: theme.notebook.ink,
    fontFamily: "Caveat_700Bold",
    fontSize: 26,
    lineHeight: 30,
  },
  timeRow: { flexDirection: "row", gap: 10 },
  timeBlock: {
    flex: 1,
    minWidth: 0,
    borderRadius: 13,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  leaveBlock: { backgroundColor: theme.notebook.peach },
  reportBlock: { backgroundColor: theme.notebook.lavender },
  timeLabel: {
    color: theme.notebook.muted,
    fontFamily: theme.fontFamily.bold,
    fontSize: 9,
    letterSpacing: 0.9,
  },
  timeValue: {
    marginTop: 6,
    color: theme.notebook.ink,
    fontFamily: theme.fontFamily.bold,
    fontSize: 20,
    lineHeight: 26,
  },
  helperText: {
    marginTop: 12,
    color: theme.notebook.muted,
    fontFamily: theme.fontFamily.regular,
    fontSize: 11,
    lineHeight: 17,
  },
  placeName: {
    color: theme.notebook.ink,
    fontFamily: theme.fontFamily.bold,
    fontSize: 16,
    lineHeight: 23,
  },
  address: {
    marginTop: 5,
    color: theme.notebook.muted,
    fontFamily: theme.fontFamily.regular,
    fontSize: 12,
    lineHeight: 19,
  },
  primaryButton: {
    marginTop: 18,
    minHeight: 48,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: theme.notebook.ink,
  },
  primaryButtonText: {
    color: theme.notebook.paper,
    fontFamily: theme.fontFamily.bold,
    fontSize: 13,
  },
  pressed: { opacity: 0.8 },
  notesCard: { borderLeftWidth: 4, borderLeftColor: theme.notebook.sage },
  notesText: {
    color: theme.notebook.muted,
    fontFamily: theme.fontFamily.regular,
    fontSize: 12,
    lineHeight: 19,
  },
  finalNote: {
    flexDirection: "row",
    gap: 9,
    alignItems: "flex-start",
    paddingHorizontal: 3,
  },
  finalNoteText: {
    flex: 1,
    color: theme.notebook.muted,
    fontFamily: theme.fontFamily.regular,
    fontSize: 11,
    lineHeight: 18,
  },
  emptyCard: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.notebook.line,
    borderRadius: 21,
    padding: 24,
    alignItems: "center",
    backgroundColor: theme.notebook.paper,
  },
  emptyImage: { width: 132, height: 132 },
  emptyHeading: {
    marginTop: 8,
    color: theme.notebook.ink,
    fontFamily: "Caveat_700Bold",
    fontSize: 31,
    lineHeight: 36,
  },
  emptyText: {
    marginTop: 5,
    color: theme.notebook.muted,
    fontFamily: theme.fontFamily.regular,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
  },
  messageCard: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.notebook.line,
    borderRadius: 18,
    padding: 22,
    backgroundColor: theme.notebook.paper,
  },
  messageTitle: {
    color: theme.notebook.ink,
    fontFamily: "Caveat_700Bold",
    fontSize: 28,
    lineHeight: 32,
  },
  bodyText: {
    marginTop: 4,
    color: theme.notebook.muted,
    fontFamily: theme.fontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  retryButton: {
    alignSelf: "flex-start",
    marginTop: 14,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 11,
    backgroundColor: theme.notebook.lavender,
  },
  retryText: {
    color: theme.notebook.accent,
    fontFamily: theme.fontFamily.bold,
    fontSize: 12,
  },
});
