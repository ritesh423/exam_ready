import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { listExams, type ExamSummary } from "../data/exams";
import { theme } from "../theme";

function localDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function todayString() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

function dateHint(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const today = new Date();
  const start = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const days = Math.round((Date.UTC(year, month - 1, day) - start) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days > 1) return `${days} days to go`;
  return "Date passed";
}

function displayTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ExamsScreen() {
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const latestRequest = useRef(0);

  const loadSavedExams = useCallback(() => {
    const request = ++latestRequest.current;
    setLoading(true);
    setError(false);
    void listExams()
      .then((rows) => {
        if (request === latestRequest.current) setExams(rows);
      })
      .catch(() => {
        if (request === latestRequest.current) {
          setExams([]);
          setError(true);
        }
      })
      .finally(() => {
        if (request === latestRequest.current) setLoading(false);
      });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSavedExams();
      return () => {
        latestRequest.current += 1;
      };
    }, [loadSavedExams]),
  );

  const today = todayString();
  const upcoming = exams.filter((exam) => exam.examDate >= today);
  const earlier = exams.filter((exam) => exam.examDate < today).reverse();
  const sections = [
    ...(upcoming.length ? [{ title: "Coming up", data: upcoming }] : []),
    ...(earlier.length ? [{ title: "Earlier dates", data: earlier }] : []),
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="dark" />
      <NotebookRules />
      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <PageHeader
            showIllustration={!loading && !error && exams.length > 0}
          />
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator
              color={theme.notebook.accent}
              style={styles.loading}
            />
          ) : error ? (
            <View style={styles.messageCard}>
              <Text style={styles.messageTitle}>
                Couldn’t open your planner.
              </Text>
              <Text style={styles.messageText}>
                We couldn’t load your saved exams. Please try again.
              </Text>
              <Pressable
                onPress={loadSavedExams}
                accessibilityRole="button"
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <EmptyPlanner />
          )
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionCount}>
              {section.data.length}{" "}
              {section.data.length === 1 ? "exam" : "exams"}
            </Text>
          </View>
        )}
        renderItem={({ item, index, section }) => (
          <ExamCard
            exam={item}
            featured={section.title === "Coming up" && index === 0}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.itemGap} />}
        renderSectionFooter={() => <View style={styles.sectionGap} />}
        ListFooterComponent={
          !loading && !error ? (
            <Text style={styles.illustrationCredit}>
              Illustration by Storyset
            </Text>
          ) : undefined
        }
      />
    </SafeAreaView>
  );
}

function NotebookRules() {
  return (
    <View pointerEvents="none" style={styles.rules}>
      {Array.from({ length: 36 }, (_, index) => (
        <View key={index} style={styles.ruleLine} />
      ))}
    </View>
  );
}

function PageHeader({ showIllustration }: { showIllustration: boolean }) {
  const { width } = useWindowDimensions();
  const illustrationWidth = Math.min(170, width * 0.43);

  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <View style={styles.brandMark}>
          <Ionicons name="book-outline" size={17} color={theme.notebook.ink} />
        </View>
        <Text style={styles.brandText}>examready</Text>
        <Text style={styles.pageLabel}>YOUR PLANNER</Text>
      </View>
      <View style={styles.headerIntro}>
        <View style={styles.headerCopy}>
          <Text
            style={[
              styles.heading,
              showIllustration && styles.illustratedHeading,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            Your exams
          </Text>
          <Text style={styles.subtitle}>A little order for the big day.</Text>
        </View>
        {showIllustration && (
          <Image
            source={require("../assets/exams-home-storyset.png")}
            style={{
              width: illustrationWidth,
              height: illustrationWidth,
            }}
            resizeMode="contain"
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        )}
      </View>
    </View>
  );
}

function EmptyPlanner() {
  return (
    <View style={styles.emptyCard}>
      <Image
        source={require("../assets/exams-home-storyset.png")}
        style={styles.emptyIllustration}
        resizeMode="contain"
        accessibilityLabel="Student working through exam papers"
      />
      <Text style={styles.emptyHeading}>A fresh page.</Text>
      <Text style={styles.emptyText}>
        Add your first exam and keep the date, timing and centre details
        together.
      </Text>
      <Pressable
        onPress={() => router.navigate("/addExam")}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.createButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.createText}>Create an exam</Text>
        <Ionicons name="arrow-forward" size={17} color={theme.notebook.paper} />
      </Pressable>
    </View>
  );
}

function ExamCard({
  exam,
  featured,
}: {
  exam: ExamSummary;
  featured: boolean;
}) {
  const date = localDate(exam.examDate);

  if (!featured) {
    return (
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/exams/[id]",
            params: { id: String(exam.id) },
          })
        }
        accessibilityRole="button"
        accessibilityLabel={`Open plan for ${exam.name}`}
        style={({ pressed }) => [styles.compactCard, pressed && styles.pressed]}
      >
        <View style={styles.compactDate}>
          <Text style={styles.dateMonth}>
            {date
              .toLocaleDateString(undefined, { month: "short" })
              .toUpperCase()}
          </Text>
          <Text style={styles.compactDay}>{date.getDate()}</Text>
        </View>
        <View style={styles.compactDetails}>
          <Text style={styles.compactName} numberOfLines={2}>
            {exam.name}
          </Text>
          <Text style={styles.compactMeta} numberOfLines={1}>
            Report by {displayTime(exam.reportingTime)} · {exam.centerName}
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={17}
          color={theme.notebook.accent}
        />
      </Pressable>
    );
  }

  return (
    <View style={styles.paperStack}>
      <View style={styles.paperUnderlay} />
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/exams/[id]",
            params: { id: String(exam.id) },
          })
        }
        accessibilityRole="button"
        accessibilityLabel={`Open plan for ${exam.name}`}
        style={({ pressed }) => [
          styles.featuredCard,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.featuredTopRow}>
          <Text style={styles.featuredLabel}>NEXT EXAM</Text>
          <Text style={styles.timeLeft}>{dateHint(exam.examDate)}</Text>
        </View>
        <View style={styles.featuredHeading}>
          <View style={styles.featuredTitleGroup}>
            <Text style={styles.examName} numberOfLines={2}>
              {exam.name}
            </Text>
            <Text style={styles.fullDate}>
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
        <View style={styles.perforation} />
        <View style={styles.detailRow}>
          <Ionicons
            name="time-outline"
            size={16}
            color={theme.notebook.accent}
          />
          <Text style={styles.detailText}>
            Report by{" "}
            <Text style={styles.detailEmphasis}>
              {displayTime(exam.reportingTime)}
            </Text>
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons
            name="location-outline"
            size={16}
            color={theme.notebook.accent}
          />
          <Text style={styles.detailText} numberOfLines={1}>
            {exam.centerName}
          </Text>
        </View>
        <View style={styles.openPlanRow}>
          <Text style={styles.openPlanText}>Open exam plan</Text>
          <Ionicons
            name="arrow-forward"
            size={16}
            color={theme.notebook.accent}
          />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.notebook.canvas },
  openPlanRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
  },
  openPlanText: {
    color: theme.notebook.accent,
    fontFamily: theme.fontFamily.bold,
    fontSize: 11,
  },
  rules: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: "hidden",
  },
  ruleLine: {
    height: 31,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(89, 88, 168, 0.05)",
  },
  content: { paddingHorizontal: theme.layout.screenPadding, paddingBottom: 40 },
  header: { paddingTop: 12, paddingBottom: 23 },
  headerIntro: {
    minHeight: 98,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerCopy: { flex: 1 },
  illustratedHeading: { marginTop: 0 },
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
    marginTop: 17,
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
  sectionHeading: {
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: theme.notebook.ink,
    fontFamily: "Caveat_700Bold",
    fontSize: 25,
    lineHeight: 30,
  },
  sectionCount: {
    paddingHorizontal: 10,
    height: 25,
    borderRadius: 13,
    overflow: "hidden",
    textAlign: "center",
    textAlignVertical: "center",
    backgroundColor: theme.notebook.lavender,
    color: theme.notebook.accent,
    fontFamily: theme.fontFamily.bold,
    fontSize: 10,
    lineHeight: 25,
  },
  itemGap: { height: 16 },
  sectionGap: { height: 22 },
  paperStack: {
    position: "relative",
    marginRight: 4,
    marginBottom: 6,
  },
  paperUnderlay: {
    position: "absolute",
    top: 6,
    right: -4,
    bottom: -6,
    left: 4,
    borderRadius: 18,
    backgroundColor: "rgba(217, 135, 121, 0.2)",
  },
  featuredCard: {
    borderWidth: 1,
    borderColor: theme.notebook.line,
    borderRadius: 18,
    padding: 18,
    backgroundColor: theme.notebook.paper,
    shadowColor: theme.notebook.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  featuredTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  featuredLabel: {
    color: theme.notebook.accent,
    fontFamily: theme.fontFamily.bold,
    fontSize: 9,
    letterSpacing: 1.2,
  },
  timeLeft: {
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: theme.notebook.sage,
    color: theme.notebook.ink,
    fontFamily: theme.fontFamily.bold,
    fontSize: 10,
  },
  featuredHeading: {
    marginTop: 18,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  featuredTitleGroup: { flex: 1 },
  dateStamp: {
    width: 54,
    height: 64,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.notebook.peach,
    transform: [{ rotate: "4deg" }],
  },
  dateMonth: {
    color: theme.notebook.ink,
    fontFamily: theme.fontFamily.bold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  dateDay: {
    color: theme.notebook.ink,
    fontFamily: "Caveat_700Bold",
    fontSize: 34,
    lineHeight: 36,
  },
  examName: {
    color: theme.notebook.ink,
    fontFamily: theme.fontFamily.bold,
    fontSize: 18,
    lineHeight: 25,
  },
  fullDate: {
    marginTop: 6,
    color: theme.notebook.muted,
    fontFamily: theme.fontFamily.regular,
    fontSize: 11,
    lineHeight: 16,
  },
  perforation: {
    marginBottom: 14,
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderColor: theme.notebook.line,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  detailText: {
    flex: 1,
    color: theme.notebook.muted,
    fontFamily: theme.fontFamily.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  detailEmphasis: {
    color: theme.notebook.ink,
    fontFamily: theme.fontFamily.bold,
  },
  compactCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: theme.notebook.line,
    borderRadius: 15,
    padding: 13,
    backgroundColor: theme.notebook.paper,
  },
  compactDate: {
    width: 48,
    height: 54,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.notebook.lavender,
  },
  compactDay: {
    color: theme.notebook.ink,
    fontFamily: "Caveat_700Bold",
    fontSize: 27,
    lineHeight: 29,
  },
  compactDetails: { flex: 1, gap: 4 },
  compactName: {
    color: theme.notebook.ink,
    fontFamily: theme.fontFamily.bold,
    fontSize: 13,
    lineHeight: 18,
  },
  compactMeta: {
    color: theme.notebook.muted,
    fontFamily: theme.fontFamily.regular,
    fontSize: 10,
    lineHeight: 16,
  },
  emptyCard: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: theme.notebook.line,
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
    backgroundColor: theme.notebook.paper,
  },
  emptyIllustration: { width: 190, height: 190 },
  emptyHeading: {
    marginTop: 8,
    color: theme.notebook.ink,
    fontFamily: "Caveat_700Bold",
    fontSize: 32,
    lineHeight: 36,
  },
  emptyText: {
    marginTop: 5,
    color: theme.notebook.muted,
    fontFamily: theme.fontFamily.regular,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  createButton: {
    marginTop: 20,
    minHeight: 48,
    alignSelf: "stretch",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: theme.notebook.ink,
  },
  pressed: { opacity: 0.8 },
  createText: {
    color: theme.notebook.paper,
    fontFamily: theme.fontFamily.bold,
    fontSize: 13,
  },
  messageCard: {
    marginTop: 14,
    borderRadius: 18,
    padding: 22,
    backgroundColor: theme.notebook.paper,
  },
  messageTitle: {
    color: theme.notebook.ink,
    fontFamily: "Caveat_700Bold",
    fontSize: 27,
  },
  messageText: {
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
  illustrationCredit: {
    color: theme.notebook.muted,
    fontFamily: theme.fontFamily.regular,
    fontSize: 10,
    textAlign: "center",
  },
});
