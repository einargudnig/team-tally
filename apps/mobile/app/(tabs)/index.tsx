import { ScrollView, View, Text, Pressable, RefreshControl, StyleSheet } from "react-native";
import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Plus, TrendingUp } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { getTeam, getLeaderboard, getRecentActivity, getTotalOutstanding, getMembers } from "@/db/queries";
import { formatAmount } from "@/lib/currency";
import { LeaderboardItem } from "@/components/leaderboard-item";
import { FineActivityItem } from "@/components/fine-activity-item";
import { Logo } from "@/components/logo";

function formatRelativeDate(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type LeaderboardEntry = { memberId: string; memberName: string; total: number };
type ActivityEntry = { id: string; memberName: string; fineTypeName: string; amount: number; date: string };
type HomeData = {
  teamName: string;
  currency: string;
  playerCount: number;
  totalOutstanding: number;
  leaderboard: LeaderboardEntry[];
  recentActivity: ActivityEntry[];
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<HomeData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  function loadData() {
    const team = getTeam();
    if (!team) {
      setData(null);
      return;
    }
    setData({
      teamName: team.name,
      currency: team.currency,
      playerCount: getMembers(team.id).length,
      totalOutstanding: getTotalOutstanding(team.id),
      leaderboard: getLeaderboard(team.id),
      recentActivity: getRecentActivity(team.id),
    });
  }

  function onRefresh() {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  }

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <Text className="text-text-muted text-base">No team set up yet.</Text>
      </View>
    );
  }

  const { teamName, currency, playerCount, totalOutstanding, leaderboard, recentActivity } = data;
  const hasFines = recentActivity.length > 0;

  return (
    <View className="flex-1 bg-surface">
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />
        }
      >
        {/* Header */}
        <View
          className="px-5 pb-2 flex-row items-start justify-between"
          style={{ paddingTop: insets.top + 8 }}
        >
          <View className="flex-1">
            <Text className="text-text-secondary text-xs font-medium uppercase tracking-widest">
              {playerCount} {playerCount === 1 ? "player" : "players"}
            </Text>
            <Text className="text-text-primary text-2xl font-bold mt-1">{teamName}</Text>
          </View>
          <View className="mt-1">
            <Logo size={32} />
          </View>
        </View>

        {/* Total Outstanding */}
        <View className="mx-5 mt-4 mb-6 bg-card rounded-2xl px-5 py-5 border border-border" style={styles.card}>
          <Text className="text-text-muted text-xs font-medium uppercase tracking-widest">
            Outstanding
          </Text>
          <Text
            className="text-primary text-3xl font-bold mt-1"
            selectable
            style={styles.amount}
          >
            {formatAmount(totalOutstanding, currency)}
          </Text>
        </View>

        {hasFines ? (
          <>
            {/* Leaderboard */}
            <View className="px-5 mb-6">
              <Text className="text-text-muted text-xs font-medium uppercase tracking-widest mb-1">
                Leaderboard
              </Text>
              {leaderboard.map((entry, index) => (
                <LeaderboardItem
                  key={entry.memberId}
                  rank={index + 1}
                  name={entry.memberName}
                  total={formatAmount(entry.total, currency)}
                  href={`/player/${entry.memberId}`}
                />
              ))}
            </View>

            {/* Recent Activity */}
            <View className="px-5">
              <Text className="text-text-muted text-xs font-medium uppercase tracking-widest mb-1">
                Recent
              </Text>
              {recentActivity.map((entry) => (
                <FineActivityItem
                  key={entry.id}
                  memberName={entry.memberName}
                  fineTypeName={entry.fineTypeName}
                  amount={formatAmount(entry.amount, currency)}
                  date={formatRelativeDate(entry.date)}
                />
              ))}
            </View>
          </>
        ) : (
          <View className="items-center px-5 py-20">
            <TrendingUp size={40} color="#8b8fa3" strokeWidth={1.5} />
            <Text className="text-text-secondary text-base font-medium mt-4">
              No fines yet
            </Text>
            <Text className="text-text-muted text-sm mt-1 text-center">
              Tap the + button to record the first one
            </Text>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => {
          if (process.env.EXPO_OS === "ios") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/add-fine");
        }}
        accessibilityRole="button"
        accessibilityLabel="Add fine"
        className="absolute right-5 bg-primary w-14 h-14 rounded-full items-center justify-center active:opacity-80"
        style={[styles.fab, { bottom: insets.bottom + 70 }]}
      >
        <Plus size={24} color="#0f0f14" strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 100 },
  card: { borderCurve: "continuous" },
  amount: { fontVariant: ["tabular-nums"] },
  fab: {
    borderCurve: "continuous",
    shadowColor: "#f59e0b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});
