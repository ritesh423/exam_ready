import type { ComponentProps } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

import { theme } from "../../theme";

type IconName = ComponentProps<typeof Ionicons>["name"];

type FieldLabelProps = {
  label: string;
  required?: boolean;
  showRequiredText?: boolean;
  optional?: boolean;
  tone?: "default" | "peach";
};

export function FieldLabel({
  label,
  required = false,
  showRequiredText = false,
  optional = false,
  tone = "default",
}: FieldLabelProps) {
  const labelColor =
    tone === "peach" ? theme.notebook.accent : theme.notebook.muted;

  return (
    <View style={styles.labelRow}>
      <View style={styles.labelGroup}>
        <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
        {required ? <Text style={styles.requiredMark}>*</Text> : null}
        {showRequiredText ? (
          <Text style={styles.labelHint}>(Required)</Text>
        ) : null}
      </View>
      {optional ? <Text style={styles.labelHint}>Optional</Text> : null}
    </View>
  );
}

type FormTextInputProps = TextInputProps & {
  trailingIcon?: IconName;
};

export function FormTextInput({
  trailingIcon,
  multiline = false,
  style,
  ...props
}: FormTextInputProps) {
  return (
    <View style={styles.inputContainer}>
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={theme.notebook.muted}
        selectionColor={theme.notebook.accent}
        style={[
          styles.input,
          multiline && styles.multilineInput,
          trailingIcon && styles.inputWithIcon,
          style,
        ]}
      />
      {trailingIcon ? (
        <Ionicons
          name={trailingIcon}
          size={16}
          color={theme.notebook.muted}
          style={styles.trailingIcon}
        />
      ) : null}
    </View>
  );
}

type PickerFieldProps = {
  icon: IconName;
  placeholder: string;
  value?: string;
  onPress?: () => void;
};

export function PickerField({
  icon,
  placeholder,
  value,
  onPress,
}: PickerFieldProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${placeholder}: ${value}` : placeholder}
      disabled={!onPress}
      onPress={onPress}
      style={styles.picker}
    >
      <View style={styles.pickerContent}>
        <Ionicons name={icon} size={18} color={theme.notebook.accent} />
        <Text style={[styles.pickerText, value && styles.pickerValue]}>
          {value ?? placeholder}
        </Text>
      </View>
      <Ionicons name="chevron-down" size={14} color={theme.notebook.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    minHeight: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  labelGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  label: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.55,
    textTransform: "uppercase",
  },
  requiredMark: {
    color: theme.notebook.coral,
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 11,
    lineHeight: 14,
  },
  labelHint: {
    color: theme.notebook.muted,
    fontFamily: theme.fontFamily.regular,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.55,
  },
  inputContainer: {
    position: "relative",
    width: "100%",
  },
  input: {
    width: "100%",
    minHeight: theme.input.height,
    paddingHorizontal: theme.input.horizontalPadding,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.notebook.line,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    color: theme.notebook.ink,
    fontFamily: theme.fontFamily.regular,
    fontSize: 16,
    shadowOpacity: 0,
  },
  multilineInput: {
    minHeight: 64,
    paddingTop: 10,
    fontSize: 14,
    lineHeight: 22,
    textAlignVertical: "top",
  },
  inputWithIcon: {
    paddingRight: 40,
  },
  trailingIcon: {
    position: "absolute",
    top: 16,
    right: 12,
  },
  picker: {
    width: "100%",
    minHeight: theme.input.height,
    paddingHorizontal: theme.input.horizontalPadding,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: theme.notebook.line,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  pickerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pickerText: {
    color: theme.notebook.muted,
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    lineHeight: 22,
  },
  pickerValue: {
    color: theme.notebook.ink,
  },
});
