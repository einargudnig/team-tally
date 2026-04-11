import { useState, useCallback } from "react";
import { Alert, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "expo-router";
import { View, Text, ScrollView, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { getTeam, getMembers, getPlayerDetail, deleteFineEntry } from "@/db/queries";
import { formatAmount } from "@/lib/currency";
import { PlayerAvatar } from "@/components/player-avatar";

type BreakdownItem = { fineTypeId: string; fineTypeName: string; amount: number; count: number; subtotal: number };
type HistoryItem = { id: string; fineTypeName: string; date: string; amount: number };

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
    const member = getMembers(team.id).find((m) => m.id === id);
    if (member) setMemberName(member.name);
    const detail = getPlayerDetail(id);
    setBreakdown(detail.breakdown);
    setHistory(detail.history);
    setTotalAmount(detail.breakdown.reduce((sum, b) => sum + b.subtotal, 0));
  }

  function handleDeleteEntry(entryId: string) {
    if (process.env.EXPO_OS === "ios") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Delete Fine", "Remove this fine entry?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteFineEntry(entryId);
          if (process.env.EXPO_OS === "ios") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          loadData();
        },
      },
    ]);
  }

  return (
    <>
      <Stack.Screen options={{ title: memberName || "Player" }} />
      <ScrollView
        className="flex-1 bg-surface"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="pb-10"
      >
        {/* Header */}
        <View className="items-center px-5 pt-8 pb-6 border-b border-border">
          <PlayerAvatar name={memberName || "?"} size={56} />
          <Text className="text-text-primary text-xl font-bold mt-3" selectable>
            {memberName || "Player"}
          </Text>
          <Text className="text-danger text-2xl font-bold mt-1" selectable style={styles.amount}>
            {formatAmount(totalAmount, currency)}
          </Text>
        </View>

        {/* Breakdown */}
        <View className="px-5 mt-6">
          <Text className="text-text-muted text-xs font-medium uppercase tracking-widest mb-3">
            Breakdown
          </Text>
          {breakdown.length === 0 ? (
            <Text className="text-text-muted text-sm">No fines yet.</Text>
          ) : (
            <View className="gap-2">
              {breakdown.map((item) => (
                <View
                  key={item.fineTypeId}
                  className="bg-card rounded-xl px-4 min-h-[44px] py-3 flex-row items-center justify-between border border-border"
                  style={styles.card}
                >
                  <View className="flex-1 mr-3">
                    <Text className="text-text-primary text-base">{item.fineTypeName}</Text>
                    <Text className="text-text-muted text-sm mt-0.5">
                      {item.count} {item.count === 1 ? "time" : "times"} × {formatAmount(item.amount, currency)}
                    </Text>
                  </View>
                  <Text className="text-danger text-base font-semibold" selectable style={styles.amount}>
                    {formatAmount(item.subtotal, currency)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* History */}
        <View className="px-5 mt-8">
          <Text className="text-text-muted text-xs font-medium uppercase tracking-widest mb-3">
            History
          </Text>
          {history.length === 0 ? (
            <Text className="text-text-muted text-sm">No entries yet.</Text>
          ) : (
            <View>
              {history.map((entry) => (
                <Pressable
                  key={entry.id}
                  onLongPress={() => handleDeleteEntry(entry.id)}
                  accessibilityRole="button"
                  accessibilityHint="Long press to delete"
                  className="flex-row items-center justify-between min-h-[44px] py-3 border-b border-border active:opacity-70"
                >
                  <View className="flex-1 mr-3">
                    <Text className="text-text-primary text-base">{entry.fineTypeName}</Text>
                    <Text className="text-text-muted text-sm mt-0.5">{entry.date}</Text>
                  </View>
                  <Text className="text-danger text-base font-semibold" selectable style={styles.amount}>
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

const styles = StyleSheet.create({
  card: { borderCurve: "continuous" },
  amount: { fontVariant: ["tabular-nums"] },
});
