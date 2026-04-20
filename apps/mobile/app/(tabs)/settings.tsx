import { useState, useCallback, useRef } from "react";
import { KeyboardAvoidingView, StyleSheet } from "react-native";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { getTeam, updateTeam } from "@/db/queries";
import { currencies } from "@/lib/currency";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("ISK");
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
  }

  function handleSave() {
    if (!teamId || !teamName.trim()) return;
    updateTeam(teamId, { name: teamName.trim(), currency: selectedCurrency });
    if (process.env.EXPO_OS === "ios")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaved(true);
    savedTimer.current = setTimeout(() => setSaved(false), 1500);
  }

  const selectedInfo = currencies.find((c) => c.code === selectedCurrency)!;

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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, paddingBottom: 32 },
  card: { borderCurve: "continuous" },
});
