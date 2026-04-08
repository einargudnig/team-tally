import { ScrollView, View, Text, Pressable } from "react-native";
import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { getTeam, getLeaderboard, getRecentActivity, getTotalOutstanding, getMembers } from "@/db/queries";
import { formatAmount } from "@/lib/currency";
import { LeaderboardItem } from "@/components/leaderboard-item";
import { FineActivityItem } from "@/components/fine-activity-item";

function formatRelativeDate(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type LeaderboardEntry = {
  memberId: string;
  memberName: string;
  total: number;
};

type ActivityEntry = {
  id: string;
  memberName: string;
  fineTypeName: string;
  amount: number;
  date: string;
};

export default function HomeScreen() {
  const router = useRouter();
  const [teamName, setTeamName] = useState<string>("");
  const [currency, setCurrency] = useState<string>("USD");
  const [playerCount, setPlayerCount] = useState<number>(0);
  const [totalOutstanding, setTotalOutstanding] = useState<number>(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([]);
  const [hasTeam, setHasTeam] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  function loadData() {
    const team = getTeam();
    if (!team) {
      setHasTeam(false);
      return;
    }
    setHasTeam(true);
    setTeamName(team.name);
    setCurrency(team.currency);

    const members = getMembers(team.id);
    setPlayerCount(members.length);

    const total = getTotalOutstanding(team.id);
    setTotalOutstanding(total);

    const board = getLeaderboard(team.id);
    setLeaderboard(board);

    const activity = getRecentActivity(team.id);
    setRecentActivity(activity);
  }

  if (!hasTeam) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Text className="text-gray-500 text-base">No team set up yet.</Text>
      </View>
    );
  }

  const hasFines = recentActivity.length > 0;

  return (
    <View className="flex-1 bg-black">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <Text className="text-white text-2xl font-bold">{teamName}</Text>
          <Text className="text-gray-500 text-sm mt-0.5">
            {playerCount} {playerCount === 1 ? "player" : "players"}
          </Text>
        </View>

        {/* Total Outstanding Card */}
        <View className="mx-4 mt-3 mb-5 bg-indigo-900/40 rounded-2xl px-5 py-4">
          <Text className="text-indigo-300 text-xs font-semibold uppercase tracking-widest mb-1">
            Total Outstanding
          </Text>
          <Text className="text-white text-4xl font-bold">
            {formatAmount(totalOutstanding, currency)}
          </Text>
        </View>

        {hasFines ? (
          <>
            {/* Leaderboard Section */}
            <View className="px-4 mb-5">
              <Text className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-2">
                Leaderboard
              </Text>
              {leaderboard.map((entry, index) => (
                <LeaderboardItem
                  key={entry.memberId}
                  rank={index + 1}
                  name={entry.memberName}
                  total={formatAmount(entry.total, currency)}
                  onPress={() => router.push(`/player/${entry.memberId}`)}
                />
              ))}
            </View>

            {/* Recent Activity Section */}
            <View className="px-4">
              <Text className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-2">
                Recent Activity
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
          /* Empty State */
          <View className="flex-1 items-center justify-center px-4 py-16">
            <Text className="text-gray-500 text-base text-center">
              No fines yet.{"\n"}Tap + to add the first one.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => router.push("/add-fine")}
        className="absolute bottom-6 right-6 bg-indigo-600 w-14 h-14 rounded-full items-center justify-center"
        style={{
          shadowColor: "#5b5bf7",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        <Text className="text-white text-3xl font-light leading-none" style={{ marginTop: -2 }}>+</Text>
      </Pressable>
    </View>
  );
}
