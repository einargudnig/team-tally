import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "expo-router";
import { View, Text, ScrollView, Pressable } from "@/src/tw";
import { getTeam, getMembers, getPlayerDetail, deleteFineEntry } from "@/db/queries";
import { formatAmount } from "@/lib/currency";
import { PlayerAvatar } from "@/components/player-avatar";

type BreakdownItem = {
  fineTypeId: string;
  fineTypeName: string;
  amount: number;
  count: number;
  subtotal: number;
};

type HistoryItem = {
  id: string;
  fineTypeName: string;
  date: string;
  amount: number;
};

export default function PlayerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [currency, setCurrency] = useState("USD");
  const [memberName, setMemberName] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<BreakdownItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [id])
  );

  function loadData() {
    if (!id) return;
    const team = getTeam();
    if (!team) return;
    setCurrency(team.currency);
    const membersList = getMembers(team.id);
    const member = membersList.find((m) => m.id === id);
    if (member) setMemberName(member.name);
    const detail = getPlayerDetail(id);
    setBreakdown(detail.breakdown);
    setHistory(detail.history);
    setTotalAmount(detail.breakdown.reduce((sum, b) => sum + b.subtotal, 0));
  }

  function handleDeleteEntry(entryId: string) {
    Alert.alert("Delete Fine", "Remove this fine entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteFineEntry(entryId);
          loadData();
        },
      },
    ]);
  }

  return (
    <>
      <Stack.Screen options={{ title: memberName || "Player" }} />
      <ScrollView className="flex-1 bg-black" contentContainerClassName="pb-10">
        {/* Header area */}
        <View className="items-center px-4 pt-8 pb-6 border-b border-gray-800">
          <PlayerAvatar name={memberName || "?"} size={56} />
          <Text className="text-white text-xl font-bold mt-3">
            {memberName || "Player"}
          </Text>
          <Text className="text-red-400 text-2xl font-bold mt-1">
            {formatAmount(totalAmount, currency)}
          </Text>
        </View>

        {/* Breakdown section */}
        <View className="px-4 mt-6">
          <Text className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-3">
            Breakdown
          </Text>
          {breakdown.length === 0 ? (
            <Text className="text-gray-600 text-sm">No fines yet.</Text>
          ) : (
            <View className="gap-2">
              {breakdown.map((item) => (
                <View
                  key={item.fineTypeId}
                  className="bg-gray-900 rounded-xl px-4 py-3 flex-row items-center justify-between"
                >
                  <View className="flex-1 mr-3">
                    <Text className="text-white text-base font-semibold">
                      {item.fineTypeName}
                    </Text>
                    <Text className="text-gray-500 text-sm mt-0.5">
                      {item.count} {item.count === 1 ? "time" : "times"} ×{" "}
                      {formatAmount(item.amount, currency)}
                    </Text>
                  </View>
                  <Text className="text-red-400 text-base font-bold">
                    {formatAmount(item.subtotal, currency)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* History section */}
        <View className="px-4 mt-8">
          <Text className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-3">
            History
          </Text>
          {history.length === 0 ? (
            <Text className="text-gray-600 text-sm">No entries yet.</Text>
          ) : (
            <View className="gap-2">
              {history.map((entry) => (
                <Pressable
                  key={entry.id}
                  onLongPress={() => handleDeleteEntry(entry.id)}
                  className="bg-gray-900 rounded-xl px-4 py-3 flex-row items-center justify-between active:opacity-70"
                >
                  <View className="flex-1 mr-3">
                    <Text className="text-white text-base font-semibold">
                      {entry.fineTypeName}
                    </Text>
                    <Text className="text-gray-500 text-sm mt-0.5">{entry.date}</Text>
                  </View>
                  <Text className="text-red-400 text-base font-bold">
                    {formatAmount(entry.amount, currency)}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}
