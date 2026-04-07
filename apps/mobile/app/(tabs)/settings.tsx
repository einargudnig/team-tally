import { useState, useCallback } from "react";
import { KeyboardAvoidingView } from "react-native";
import { View, Text, TextInput, Pressable, ScrollView } from "@/src/tw";
import { useFocusEffect } from "expo-router";
import { getTeam, updateTeam } from "@/db/queries";
import { currencies } from "@/lib/currency";

export default function SettingsScreen() {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("ISK");
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [saved, setSaved] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
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
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  const selectedInfo = currencies.find((c) => c.code === selectedCurrency)!;

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <ScrollView
        className="flex-1 bg-black px-6"
        contentContainerStyle={{ flexGrow: 1, paddingTop: 32, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-white text-2xl font-bold mb-8">Settings</Text>

        <Text className="text-gray-400 text-sm mb-2">Team Name</Text>
        <TextInput
          className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 text-white text-base mb-6"
          placeholder="Team name"
          placeholderTextColor="#666"
          value={teamName}
          onChangeText={setTeamName}
          returnKeyType="done"
        />

        <Text className="text-gray-400 text-sm mb-2">Currency</Text>
        <Pressable
          onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
          className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 mb-4 flex-row justify-between items-center"
        >
          <Text className="text-gray-400 text-sm">Currency</Text>
          <Text className="text-white text-base">
            {selectedInfo.code} {selectedInfo.symbol}
          </Text>
        </Pressable>

        {showCurrencyPicker && (
          <View className="bg-gray-900 border border-gray-700 rounded-xl mb-6 max-h-48 overflow-hidden">
            <ScrollView nestedScrollEnabled>
              {currencies.map((c) => (
                <Pressable
                  key={c.code}
                  onPress={() => {
                    setSelectedCurrency(c.code);
                    setShowCurrencyPicker(false);
                  }}
                  className={`px-4 py-3 border-b border-gray-800 ${
                    c.code === selectedCurrency ? "bg-indigo-900/30" : ""
                  }`}
                >
                  <Text className="text-white text-base">
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
          className={`rounded-xl py-4 items-center mt-4 ${
            teamName.trim() ? "bg-indigo-600" : "bg-gray-800"
          }`}
        >
          <Text
            className={`text-base font-semibold ${
              teamName.trim() ? "text-white" : "text-gray-600"
            }`}
          >
            {saved ? "✓ Saved" : "Save Changes"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
