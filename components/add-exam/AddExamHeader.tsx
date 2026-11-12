import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "../../theme";

export function AddExamHeader() {
  return (
    <View style={styles.header}>
      <View style={styles.brandGroup}>
        <View style={styles.brandIcon}>
          <Ionicons
            name="shield-checkmark-outline"
            size={19}
            color={theme.white}
          />
        </View>
        <View>
          <Text style={styles.brandName}>ExamReady</Text>
          <Text style={styles.screenName}>Create Exam</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <View style={styles.notificationIcon}>
          <Ionicons name="notifications-outline" size={19} color={theme.text} />
        </View>
        <View style={styles.profileIcon}>
          <Ionicons name="person-outline" size={15} color={theme.white} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: theme.layout.headerHeight,
    paddingHorizontal: theme.layout.screenPadding,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(249, 249, 255, 0.96)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    zIndex: 2,
  },
  brandGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  brandIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.primary,
    shadowColor: theme.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 0,
    elevation: 2,
  },
  brandName: {
    color: theme.primaryDark,
    fontFamily: theme.fontFamily.bold,
    fontSize: 18,
    lineHeight: 18,
    letterSpacing: -0.45,
  },
  screenName: {
    marginTop: 2,
    color: theme.textMuted,
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.44,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  notificationIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  profileIcon: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: theme.primaryDark,
  },
});
