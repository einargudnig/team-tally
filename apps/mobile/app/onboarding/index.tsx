import { useState } from "react";
import { KeyboardAvoidingView } from "react-native";
import { View, Text, TextInput, Pressable, ScrollView } from "@/src/tw";
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
        className="flex-1 bg-black px-6"
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-8">
          <Text className="text-5xl mb-4">⚽</Text>
          <Text className="text-white text-2xl font-bold mb-2">
            What's your team called?
          </Text>
          <Text className="text-gray-500 text-sm">
            You can always change this later
          </Text>
        </View>

        <TextInput
          className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 text-white text-base mb-4"
          placeholder="Team name"
          placeholderTextColor="#666"
          value={teamName}
          onChangeText={setTeamName}
          autoFocus
          returnKeyType="next"
        />

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
          <View className="bg-gray-900 border border-gray-700 rounded-xl mb-4 max-h-48 overflow-hidden">
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
          onPress={handleContinue}
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
            Continue
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
