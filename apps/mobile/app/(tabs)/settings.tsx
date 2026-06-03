import { useState, useCallback, useRef } from "react";
import { Alert, KeyboardAvoidingView, StyleSheet, Switch, Platform } from "react-native";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Constants from "expo-constants";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import {
  getTeam,
  updateTeam,
  getReminderSettings,
  setReminderSettings,
  type DayReminder,
} from "@/db/queries";
import { currencies, getCurrencyInfo } from "@/lib/currency";
import { INTERVAL_OPTIONS, type Interval } from "@/lib/period";
import { ensureReminderPermission, syncReminders, WEEKDAYS } from "@/lib/reminders";
import { seedDemoData } from "@/lib/seed-demo";

function timeStringToDate(time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h ?? 20, m ?? 0, 0, 0);
  return d;
}

function dateToTimeString(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

const APP_VERSION = Constants.expoConfig?.version ?? "—";
const BUILD_NUMBER = Constants.nativeBuildVersion ?? null;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("ISK");
  const [selectedInterval, setSelectedInterval] = useState<Interval>("monthly");
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderSchedule, setReminderSchedule] = useState<DayReminder[]>([]);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useFocusEffect(
    useCallback(() => {
      loadData();
      return () => {
        if (savedTimer.current) clearTimeout(savedTimer.current);
      };
    }, [])
  );

  function loadData() {
    const team = getTeam();
    if (!team) return;
    setTeamId(team.id);
    setTeamName(team.name);
    setSelectedCurrency(team.currency);
    setSelectedInterval(team.fineInterval);
    const reminders = getReminderSettings(team);
    setReminderEnabled(reminders.enabled);
    setReminderSchedule(reminders.schedule);
  }

  async function handleToggleReminders(next: boolean) {
    if (process.env.EXPO_OS === "ios") Haptics.selectionAsync();
    if (!next) {
      setReminderEnabled(false);
      return;
    }
    const granted = await ensureReminderPermission();
    if (!granted) {
      Alert.alert(
        "Notifications are off",
        "Enable notifications for Team Tally in your device Settings to get reminders."
      );
      return;
    }
    setReminderEnabled(true);
    // Seed a sensible starting schedule (Tue + Thu at 20:00) so there's something
    // to fire; the collector adjusts days and per-day times from here.
    if (reminderSchedule.length === 0) {
      setReminderSchedule([
        { day: 3, time: "20:00" },
        { day: 5, time: "20:00" },
      ]);
    }
  }

  function toggleReminderDay(day: number) {
    if (process.env.EXPO_OS === "ios") Haptics.selectionAsync();
    setReminderSchedule((prev) => {
      if (prev.some((e) => e.day === day)) return prev.filter((e) => e.day !== day);
      // New day inherits the most recently set time so adding days stays quick.
      const time = prev.length ? prev[prev.length - 1].time : "20:00";
      return [...prev, { day, time }].sort((a, b) => a.day - b.day);
    });
  }

  function onChangeTime(day: number, event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === "android") setEditingDay(null);
    if (event.type === "set" && date) {
      const time = dateToTimeString(date);
      setReminderSchedule((prev) => prev.map((e) => (e.day === day ? { ...e, time } : e)));
    }
  }

  async function handleSave() {
    if (!teamId || !teamName.trim()) return;
    updateTeam(teamId, {
      name: teamName.trim(),
      currency: selectedCurrency,
      fineInterval: selectedInterval,
    });
    // A reminder with no days picked is effectively off — don't persist a
    // toggle that can never fire.
    const remindersOn = reminderEnabled && reminderSchedule.length > 0;
    const settings = { enabled: remindersOn, schedule: reminderSchedule };
    setReminderSettings(teamId, settings);
    await syncReminders(settings);
    if (process.env.EXPO_OS === "ios")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaved(true);
    savedTimer.current = setTimeout(() => setSaved(false), 1500);
  }

  const selectedInfo = getCurrencyInfo(selectedCurrency);

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <ScrollView
        className="flex-1 bg-surface"
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 8 }]}
        contentContainerClassName="px-5"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-text-muted text-xs font-medium uppercase tracking-widest mb-2">
          Team Name
        </Text>
        <TextInput
          className="bg-card border border-border rounded-xl px-4 min-h-[44px] text-text-primary text-base mb-6"
          style={styles.card}
          placeholder="Team name"
          placeholderTextColor="#6b7280"
          value={teamName}
          onChangeText={setTeamName}
          returnKeyType="done"
        />

        <Text className="text-text-muted text-xs font-medium uppercase tracking-widest mb-2">
          Currency
        </Text>
        <Pressable
          onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
          accessibilityRole="button"
          accessibilityLabel={`Currency: ${selectedInfo.code}`}
          className="bg-card border border-border rounded-xl px-4 min-h-[44px] mb-4 flex-row justify-between items-center active:opacity-70"
          style={styles.card}
        >
          <Text className="text-text-secondary text-sm">Currency</Text>
          <Text className="text-text-primary text-base">
            {selectedInfo.code} {selectedInfo.symbol}
          </Text>
        </Pressable>

        {showCurrencyPicker && (
          <View
            className="bg-card border border-border rounded-xl mb-6 max-h-48 overflow-hidden"
            style={styles.card}
          >
            <ScrollView nestedScrollEnabled>
              {currencies.map((c) => (
                <Pressable
                  key={c.code}
                  onPress={() => {
                    setSelectedCurrency(c.code);
                    setShowCurrencyPicker(false);
                  }}
                  className={`px-4 min-h-[44px] justify-center border-b border-border ${
                    c.code === selectedCurrency ? "bg-primary-muted" : ""
                  }`}
                >
                  <Text
                    className={`text-base ${c.code === selectedCurrency ? "text-primary" : "text-text-primary"}`}
                  >
                    {c.symbol} — {c.name} ({c.code})
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <Text className="text-text-muted text-xs font-medium uppercase tracking-widest mb-2">
          Payment Interval
        </Text>
        <View className="flex-row gap-2 mb-1">
          {INTERVAL_OPTIONS.map((opt) => {
            const active = opt.value === selectedInterval;
            return (
              <Pressable
                key={opt.value}
                onPress={() => {
                  setSelectedInterval(opt.value);
                  if (process.env.EXPO_OS === "ios") Haptics.selectionAsync();
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${opt.label} interval`}
                className={`flex-1 rounded-xl min-h-[44px] justify-center items-center border active:opacity-70 ${
                  active ? "bg-primary border-primary" : "bg-card border-border"
                }`}
                style={styles.card}
              >
                <Text
                  className={`text-sm font-semibold ${active ? "text-surface" : "text-text-primary"}`}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text className="text-text-muted text-xs mb-6">
          How the overview groups fines for collecting payments.
        </Text>

        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-text-muted text-xs font-medium uppercase tracking-widest">
            Fine Reminders
          </Text>
          <Switch
            value={reminderEnabled}
            onValueChange={handleToggleReminders}
            trackColor={{ false: "#3a3a46", true: "#f59e0b" }}
            thumbColor="#f5f5f5"
            ios_backgroundColor="#3a3a46"
          />
        </View>

        {reminderEnabled && (
          <View className="mb-2">
            <View className="flex-row gap-2 mb-3">
              {WEEKDAYS.map((d, i) => {
                const active = reminderSchedule.some((e) => e.day === d.value);
                return (
                  <Pressable
                    key={i}
                    onPress={() => toggleReminderDay(d.value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Reminder day ${d.name}`}
                    className={`flex-1 aspect-square rounded-full justify-center items-center border active:opacity-70 ${
                      active ? "bg-primary border-primary" : "bg-card border-border"
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${active ? "text-surface" : "text-text-secondary"}`}
                    >
                      {d.short}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {reminderSchedule.length === 0 ? (
              <Text className="text-text-muted text-xs">Pick the days you want a reminder.</Text>
            ) : (
              reminderSchedule.map((entry) => {
                const weekday = WEEKDAYS.find((d) => d.value === entry.day)!;
                const editing = editingDay === entry.day;
                return (
                  <View key={entry.day}>
                    <Pressable
                      onPress={() => setEditingDay(editing ? null : entry.day)}
                      accessibilityRole="button"
                      accessibilityLabel={`${weekday.name} reminder at ${entry.time}`}
                      className="bg-card border border-border rounded-xl px-4 min-h-[44px] flex-row justify-between items-center active:opacity-70 mb-2"
                      style={styles.card}
                    >
                      <Text className="text-text-primary text-base">{weekday.name}</Text>
                      <Text className="text-primary text-base font-semibold" style={styles.amount}>
                        {entry.time}
                      </Text>
                    </Pressable>
                    {editing && (
                      <View className="items-center mb-2">
                        <DateTimePicker
                          value={timeStringToDate(entry.time)}
                          mode="time"
                          display="spinner"
                          onChange={(event, date) => onChangeTime(entry.day, event, date)}
                          themeVariant="dark"
                        />
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}
        <Text className="text-text-muted text-xs mb-6">
          A local notification nudges you to log fines on each day at the time you set. Nothing leaves your phone.
        </Text>

        <Pressable
          onPress={handleSave}
          disabled={!teamName.trim()}
          accessibilityRole="button"
          accessibilityLabel={saved ? "Changes saved" : "Save changes"}
          className={`rounded-xl min-h-[44px] justify-center items-center mt-4 active:opacity-80 ${
            teamName.trim() ? "bg-primary" : "bg-card border border-border"
          }`}
          style={styles.card}
        >
          <Text
            className={`text-base font-semibold ${teamName.trim() ? "text-surface" : "text-text-muted"}`}
          >
            {saved ? "✓ Saved" : "Save Changes"}
          </Text>
        </Pressable>

        <View className="mt-8 items-center">
          <Text className="text-text-muted text-xs" style={styles.amount}>
            Team Tally v{APP_VERSION}
            {BUILD_NUMBER ? ` (build ${BUILD_NUMBER})` : ""}
          </Text>
        </View>

        {__DEV__ && (
          <Pressable
            onPress={() => {
              Alert.alert(
                "Reset & seed demo data?",
                "Wipes the database and loads FC Barcelona: 6 players, fines across 3 months, plus a couple of paid-status players in the current period. Dev builds only.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Reset & seed",
                    style: "destructive",
                    onPress: () => {
                      const { entryCount } = seedDemoData();
                      if (process.env.EXPO_OS === "ios")
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      loadData();
                      Alert.alert("Seeded", `Loaded ${entryCount} fine entries.`);
                    },
                  },
                ]
              );
            }}
            accessibilityRole="button"
            accessibilityLabel="Seed demo data (dev only)"
            className="bg-card border border-border rounded-xl min-h-[44px] justify-center items-center mt-6 active:opacity-80"
            style={styles.card}
          >
            <Text className="text-text-muted text-sm">Seed demo data (dev only)</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, paddingBottom: 32 },
  card: { borderCurve: "continuous" },
  amount: { fontVariant: ["tabular-nums"] },
});
