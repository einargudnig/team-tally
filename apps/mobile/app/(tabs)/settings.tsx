import { useState, useCallback, useRef } from "react";
import { Alert, KeyboardAvoidingView, StyleSheet } from "react-native";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Constants from "expo-constants";
import { getTeam, updateTeam } from "@/db/queries";
import { currencies, getCurrencyInfo } from "@/lib/currency";
import { INTERVAL_OPTIONS, type Interval } from "@/lib/period";
import { seedDemoData } from "@/lib/seed-demo";

const APP_VERSION = Constants.expoConfig?.version ?? "—";
const BUILD_NUMBER = Constants.nativeBuildVersion ?? null;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("ISK");
  const [selectedInterval, setSelectedInterval] = useState<Interval>("monthly");
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
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
  }

  function handleSave() {
    if (!teamId || !teamName.trim()) return;
    updateTeam(teamId, {
      name: teamName.trim(),
      currency: selectedCurrency,
      fineInterval: selectedInterval,
    });
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
                "Wipes the database and loads Hraunsmenn FC with 6 players and ~35 fines. Dev builds only.",
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
