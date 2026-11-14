import * as Notifications from "expo-notifications";
import { AndroidImportance, IosAuthorizationStatus } from "expo-notifications";
import { Platform } from "react-native";

const REMINDER_CHANNEL = "exam-reminders";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class ReminderPermissionError extends Error {}
export class ReminderTimePassedError extends Error {}

export function eveningBeforeReminderTime(examDate: Date) {
  return new Date(
    examDate.getFullYear(),
    examDate.getMonth(),
    examDate.getDate() - 1,
    19,
    0,
  );
}

function canNotify(settings: Notifications.NotificationPermissionsStatus) {
  return (
    settings.granted ||
    settings.ios?.status === IosAuthorizationStatus.PROVISIONAL
  );
}

export async function scheduleEveningBeforeReminder(
  examName: string,
  examDate: Date,
): Promise<string> {
  const date = eveningBeforeReminderTime(examDate);
  if (date.getTime() <= Date.now()) throw new ReminderTimePassedError();

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL, {
      name: "Exam reminders",
      importance: AndroidImportance.HIGH,
    });
  }

  let permission = await Notifications.getPermissionsAsync();
  if (!canNotify(permission) && permission.canAskAgain) {
    permission = await Notifications.requestPermissionsAsync();
  }
  if (!canNotify(permission)) throw new ReminderPermissionError();
  if (date.getTime() <= Date.now()) throw new ReminderTimePassedError();

  return Notifications.scheduleNotificationAsync({
    content: {
      title: `${examName} is tomorrow`,
      body: "Check your admit card, route and essentials for exam day.",
      sound: "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      ...(Platform.OS === "android" ? { channelId: REMINDER_CHANNEL } : {}),
    },
  });
}

export async function cancelReminder(identifier: string) {
  await Notifications.cancelScheduledNotificationAsync(identifier);
}
