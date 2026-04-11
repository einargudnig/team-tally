import { useState } from "react";
import { KeyboardAvoidingView, StyleSheet } from "react-native";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { createTeam } from "@/db/queries";
import { currencies } from "@/lib/currency";

export default function OnboardingScreen() {
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("ISK");
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const selectedInfo = currencies.find((c) => c.code === selectedCurrency)!;

  function handleContinue() {
    if (!teamName.trim()) return;
    createTeam(teamName.trim(), selectedCurrency);
    router.replace("/(tabs)/players");
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <ScrollView
        className="flex-1 bg-surface"
        contentContainerStyle={styles.scrollContent}
        contentContainerClassName="px-5"
        keyboardShouldPersistTaps="handled"
      >
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
