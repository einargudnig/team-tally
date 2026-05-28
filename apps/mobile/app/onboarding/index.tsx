import { useState } from "react";
import { KeyboardAvoidingView, StyleSheet } from "react-native";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { getTeam, createTeam, updateTeam } from "@/db/queries";
import { currencies, getCurrencyInfo } from "@/lib/currency";
import { INTERVAL_OPTIONS, type Interval } from "@/lib/period";
import { OnboardingProgress } from "@/components/onboarding-progress";

export default function OnboardingTeamScreen() {
  const router = useRouter();
  const existing = getTeam();
  const [teamName, setTeamName] = useState(existing?.name ?? "");
  const [selectedCurrency, setSelectedCurrency] = useState(existing?.currency ?? "ISK");
  const [selectedInterval, setSelectedInterval] = useState<Interval>(
    existing?.fineInterval ?? "monthly"
  );
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const selectedInfo = getCurrencyInfo(selectedCurrency);

  function handleContinue() {
    const trimmed = teamName.trim();
    if (!trimmed) return;
    if (existing) {
      updateTeam(existing.id, {
        name: trimmed,
        currency: selectedCurrency,
        fineInterval: selectedInterval,
      });
    } else {
      createTeam(trimmed, selectedCurrency, selectedInterval);
    }
    router.replace("/onboarding/players" as never);
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <ScrollView
        className="flex-1 bg-surface"
        contentContainerStyle={styles.scrollContent}
        contentContainerClassName="px-5"
        keyboardShouldPersistTaps="handled"
      >
        <View className="pt-12 pb-8">
          <OnboardingProgress step={1} />
        </View>

        <View className="items-center mb-10">
          <Text className="text-5xl mb-4">⚽</Text>
          <Text className="text-text-primary text-2xl font-bold mb-2">
            What's your team called?
          </Text>
          <Text className="text-text-muted text-sm">You can always change this later</Text>
        </View>

        <TextInput
          className="bg-card border border-border rounded-xl px-4 min-h-[44px] text-text-primary text-base mb-4"
          style={styles.card}
          placeholder="Team name"
          placeholderTextColor="#6b7280"
          value={teamName}
          onChangeText={setTeamName}
          autoFocus
          returnKeyType="next"
        />

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
            className="bg-card border border-border rounded-xl mb-4 max-h-48 overflow-hidden"
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

        <Text className="text-text-muted text-xs font-medium uppercase tracking-widest mt-2 mb-2">
          How often do you collect?
        </Text>
        <View className="flex-row gap-2">
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
                accessibilityLabel={`${opt.label} collection`}
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

        <Pressable
          onPress={handleContinue}
          disabled={!teamName.trim()}
          accessibilityRole="button"
          accessibilityLabel="Continue to add players"
          className={`rounded-xl min-h-[44px] justify-center items-center mt-4 active:opacity-80 ${
            teamName.trim() ? "bg-primary" : "bg-card border border-border"
          }`}
          style={styles.card}
        >
          <Text
            className={`text-base font-semibold ${teamName.trim() ? "text-surface" : "text-text-muted"}`}
          >
            Continue
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, justifyContent: "center" },
  card: { borderCurve: "continuous" },
});
