import * as Notifications from "expo-notifications";
import type { ReminderSettings } from "@/db/queries";

// All notifications here are *local* and scheduled on-device — no push token, no
// server, in keeping with the app's offline-first promise. A weekly repeating
// trigger fires at the chosen time on each selected weekday until cancelled.

const REMINDER_TITLE = "Time to log fines";
const REMINDER_BODY = "Tap to add today's fines before you forget.";

// expo-notifications weekday numbering matches our storage: 1 = Sunday … 7 = Saturday.
export const WEEKDAYS: { value: number; short: string; name: string }[] = [
  { value: 1, short: "S", name: "Sunday" },
  { value: 2, short: "M", name: "Monday" },
  { value: 3, short: "T", name: "Tuesday" },
  { value: 4, short: "W", name: "Wednesday" },
  { value: 5, short: "T", name: "Thursday" },
  { value: 6, short: "F", name: "Friday" },
  { value: 7, short: "S", name: "Saturday" },
];

/** Ask for notification permission if not already granted. Returns true if usable. */
export async function ensureReminderPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

function parseTime(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(":").map(Number);
  return { hour: h ?? 20, minute: m ?? 0 };
}

/**
 * Reconcile the OS notification schedule with the saved settings: clear whatever
 * was scheduled and, if enabled, lay down one weekly trigger per selected day at
 * that day's own time. Idempotent — safe to call on every save and on startup.
 */
export async function syncReminders(settings: ReminderSettings): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!settings.enabled || settings.schedule.length === 0) return;

  for (const { day, time } of settings.schedule) {
    const { hour, minute } = parseTime(time);
    await Notifications.scheduleNotificationAsync({
      content: { title: REMINDER_TITLE, body: REMINDER_BODY },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: day,
        hour,
        minute,
      },
    });
  }
}
