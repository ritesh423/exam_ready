import type { ComponentProps, PropsWithChildren } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "../../theme";

type IconName = ComponentProps<typeof Ionicons>["name"];

type FormCardProps = PropsWithChildren<{
  title: string;
  stepLabel?: string;
  icon?: IconName;
  tone?: "default" | "peach";
}>;

export function FormCard({
  title,
  stepLabel,
  icon,
  tone = "default",
  children,
}: FormCardProps) {
  const isPeach = tone === "peach";

  return (
    <View style={[styles.card, isPeach && styles.peachCard]}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Text style={styles.stepText}>{stepLabel ?? "FIELD NOTE"}</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
        {icon && (
          <Ionicons name={icon} size={21} color={theme.notebook.accent} />
        )}
      </View>

      <View style={styles.rule} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    padding: 20,
    gap: 17,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.notebook.line,
    borderLeftWidth: 4,
    borderLeftColor: theme.notebook.coral,
    backgroundColor: theme.notebook.paper,
    shadowColor: theme.notebook.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2,
  },
  peachCard: {
    borderLeftColor: theme.notebook.accent,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  titleGroup: {
    gap: 2,
  },
  title: {
    color: theme.notebook.ink,
    fontFamily: theme.fontFamily.bold,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  stepText: {
    color: theme.notebook.accent,
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 1.8,
  },
  rule: {
    borderBottomWidth: 1,
    borderBottomColor: theme.notebook.line,
  },
});
