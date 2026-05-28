import { ScrollView, View, Text, Pressable, RefreshControl, StyleSheet } from "react-native";
import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Plus, TrendingUp, ChevronLeft, ChevronRight, Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import {
  getTeam,
  getRecentActivity,
  getMembers,
  isDoubleDayActive,
  setDoubleDay,
  applyMonthlyFines,
  deleteFineEntry,
  getPeriodLeaderboard,
  getPeriodOutstanding,
  markPeriodPaid,
  markPeriodUnpaid,
  type PeriodLeaderboardEntry,
} from "@/db/queries";
import {
  currentPeriod,
  previousPeriod,
  nextPeriod,
  isCurrentPeriod,
  type Period,
} from "@/lib/period";
import { formatAmount } from "@/lib/currency";
import { showEditDeleteSheet, showActionSheet } from "@/lib/action-sheet";
import { PlayerAvatar } from "@/components/player-avatar";
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

type ActivityEntry = {
  id: string;
  memberName: string;
  fineTypeName: string;
  amount: number;
  date: string;
};
type HomeData = {
  teamId: string;
  teamName: string;
  currency: string;
  playerCount: number;
  periodOutstanding: number;
  leaderboard: PeriodLeaderboardEntry[];
  recentActivity: ActivityEntry[];
  doubleDayActive: boolean;
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<HomeData | null>(null);
  const [period, setPeriod] = useState<Period | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  function loadData(targetPeriod?: Period) {
    const team = getTeam();
    if (!team) {
      setData(null);
      return;
    }
    applyMonthlyFines(team.id);
    const fresh = getTeam()!;

    // Reset to the live period whenever the team has no period yet or the
    // configured interval changed under us (e.g. switched in settings).
    let p = targetPeriod ?? period;
    if (!p || p.interval !== fresh.fineInterval) p = currentPeriod(fresh.fineInterval);
    setPeriod(p);

    setData({
      teamId: fresh.id,
      teamName: fresh.name,
      currency: fresh.currency,
      playerCount: getMembers(fresh.id).length,
      periodOutstanding: getPeriodOutstanding(fresh.id, p),
      leaderboard: getPeriodLeaderboard(fresh.id, p),
      recentActivity: getRecentActivity(fresh.id),
      doubleDayActive: isDoubleDayActive(fresh),
    });
  }

  function goToPeriod(target: Period) {
    if (process.env.EXPO_OS === "ios") Haptics.selectionAsync();
    loadData(target);
  }

  function toggleDoubleDay() {
    if (!data) return;
    if (process.env.EXPO_OS === "ios") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDoubleDay(data.teamId, !data.doubleDayActive);
    loadData();
  }

  function onRefresh() {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  }

  function handlePlayerPress(entry: PeriodLeaderboardEntry) {
    if (!period) return;
    if (process.env.EXPO_OS === "ios") Haptics.selectionAsync();
    const paidAction =
      entry.status === "paid"
        ? {
            label: "Mark as unpaid",
            destructive: true,
            onPress: () => {
              markPeriodUnpaid(entry.memberId, period.key);
              if (process.env.EXPO_OS === "ios")
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              loadData();
            },
          }
        : {
            label: `Mark paid · ${formatAmount(entry.remaining, data!.currency)}`,
            onPress: () => {
              markPeriodPaid(entry.memberId, period, entry.total);
              if (process.env.EXPO_OS === "ios")
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              loadData();
            },
          };
    showActionSheet(`${entry.memberName} · ${period.label}`, undefined, [
      paidAction,
      { label: "View player details", onPress: () => router.push(`/player/${entry.memberId}`) },
    ]);
  }

  function handleActivityPress(entry: ActivityEntry) {
    if (process.env.EXPO_OS === "ios") Haptics.selectionAsync();
    showEditDeleteSheet({
      title: `${entry.memberName} — ${entry.fineTypeName}`,
      destructiveMessage: `Remove this fine from ${entry.memberName}?`,
      onEdit: () => router.push(`/edit-fine/${entry.id}` as never),
      onDelete: () => {
        deleteFineEntry(entry.id);
        if (process.env.EXPO_OS === "ios")
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        loadData();
      },
    });
  }

  if (!data || !period) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <Text className="text-text-muted text-base">No team set up yet.</Text>
      </View>
    );
  }

  const { teamName, currency, playerCount, periodOutstanding, leaderboard, recentActivity, doubleDayActive } =
    data;
  const hasAnyHistory = recentActivity.length > 0;
  const periodHasFines = leaderboard.some((e) => e.total > 0);
  const atCurrent = isCurrentPeriod(period);

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

        {/* Period selector */}
        <View className="mx-5 mt-4 flex-row items-center justify-between bg-card border border-border rounded-xl px-2 min-h-[48px]" style={styles.card}>
          <Pressable
            onPress={() => goToPeriod(previousPeriod(period))}
            accessibilityRole="button"
            accessibilityLabel="Previous period"
            hitSlop={8}
            className="w-10 h-10 items-center justify-center active:opacity-60"
          >
            <ChevronLeft size={22} color="#f5f5f5" />
          </Pressable>
          <Text className="text-text-primary text-base font-semibold">{period.label}</Text>
          <Pressable
            onPress={() => !atCurrent && goToPeriod(nextPeriod(period))}
            disabled={atCurrent}
            accessibilityRole="button"
            accessibilityLabel="Next period"
            accessibilityState={{ disabled: atCurrent }}
            hitSlop={8}
            className="w-10 h-10 items-center justify-center active:opacity-60"
          >
            <ChevronRight size={22} color={atCurrent ? "#3a3a46" : "#f5f5f5"} />
          </Pressable>
        </View>

        {/* Double day toggle */}
        <Pressable
          onPress={toggleDoubleDay}
          accessibilityRole="switch"
          accessibilityState={{ checked: doubleDayActive }}
          accessibilityLabel={`Double day ${doubleDayActive ? "on" : "off"}`}
          className={`mx-5 mt-4 rounded-xl px-4 min-h-[48px] flex-row items-center justify-between active:opacity-80 ${
            doubleDayActive ? "bg-primary" : "bg-card border border-border"
          }`}
          style={styles.card}
        >
          <View className="flex-row items-center gap-3">
            <Text
              className={`text-lg font-bold ${doubleDayActive ? "text-surface" : "text-primary"}`}
              style={styles.amount}
            >
              2×
            </Text>
            <Text
              className={`text-sm font-semibold ${doubleDayActive ? "text-surface" : "text-text-primary"}`}
            >
              Double day {doubleDayActive ? "on" : "off"}
            </Text>
          </View>
          <Text className={`text-xs ${doubleDayActive ? "text-surface/80" : "text-text-muted"}`}>
            {doubleDayActive ? "All fines ×2 today" : "Tap to enable"}
          </Text>
        </Pressable>

        {/* Outstanding for the period */}
        <View
          className="mx-5 mt-4 mb-6 bg-card rounded-2xl px-5 py-5 border border-border"
          style={styles.card}
        >
          <Text className="text-text-muted text-xs font-medium uppercase tracking-widest">
            Outstanding · {period.label}
          </Text>
          <Text className="text-primary text-3xl font-bold mt-1" selectable style={styles.amount}>
            {formatAmount(periodOutstanding, currency)}
          </Text>
        </View>

        {!hasAnyHistory && (
          <View className="items-center px-5 py-20">
            <TrendingUp size={40} color="#8b8fa3" strokeWidth={1.5} />
            <Text className="text-text-secondary text-base font-medium mt-4">No fines yet</Text>
            <Text className="text-text-muted text-sm mt-1 text-center">
              Log a fine to see your team's leaderboard come alive
            </Text>
          </View>
        )}

        {hasAnyHistory && (
          <>
            {/* Players for the period */}
            <View className="px-5 mb-6">
              <Text className="text-text-muted text-xs font-medium uppercase tracking-widest mb-1">
                Players
              </Text>
              {periodHasFines ? (
                leaderboard.map((entry) => (
                  <PeriodPlayerRow
                    key={entry.memberId}
                    entry={entry}
                    currency={currency}
                    onPress={() => handlePlayerPress(entry)}
                  />
                ))
              ) : (
                <PeriodEmptyState period={period} atCurrent={atCurrent} />
              )}
            </View>

            {/* Recent Activity — team-wide, so old fines still show context. */}
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
                  onPress={() => handleActivityPress(entry)}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => {
          if (process.env.EXPO_OS === "ios")
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

// Empty state for a period with no fines, when the team has history elsewhere.
// Tone is calm — $0 owed is good news — and we lean on the stepper above (already
// in view) rather than adding another button. Current vs past split because
// "clean sheet" only reads right for the live period.
function PeriodEmptyState({ period, atCurrent }: { period: Period; atCurrent: boolean }) {
  return (
    <View className="items-center py-12 px-2">
      <Text className="text-text-secondary text-base font-medium text-center">
        {atCurrent ? `Clean sheet for ${period.label}.` : `Nothing logged in ${period.label}.`}
      </Text>
      <Text className="text-text-muted text-sm mt-1 text-center">
        {atCurrent
          ? "Tap ‹ above to look back, or log a fine when one happens."
          : "Use the arrows above to browse other periods."}
      </Text>
    </View>
  );
}

function PeriodPlayerRow({
  entry,
  currency,
  onPress,
}: {
  entry: PeriodLeaderboardEntry;
  currency: string;
  onPress: () => void;
}) {
  const subline =
    entry.status === "paid"
      ? "Paid in full"
      : entry.status === "partial"
        ? `Paid ${formatAmount(entry.amountPaid, currency)} of ${formatAmount(entry.total, currency)}`
        : entry.total === 0
          ? "Nothing owed"
          : "Unpaid";

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint="Tap to mark paid or view details"
      accessibilityLabel={`${entry.memberName}, ${subline}`}
      className="flex-row items-center min-h-[44px] py-3 border-b border-border active:opacity-70"
    >
      <PlayerAvatar name={entry.memberName} size={32} />
      <View className="flex-1 ml-3">
        <Text className="text-text-primary text-base">{entry.memberName}</Text>
        <Text className="text-text-muted text-xs mt-0.5">{subline}</Text>
      </View>
      {entry.status === "paid" ? (
        <View className="flex-row items-center gap-1">
          <Check size={16} color="#10b981" strokeWidth={2.5} />
          <Text className="text-success text-sm font-semibold">Paid</Text>
        </View>
      ) : (
        <Text
          className={`text-sm font-semibold ${entry.status === "partial" ? "text-primary" : "text-danger"}`}
          selectable
          style={styles.amount}
        >
          {formatAmount(entry.remaining, currency)}
        </Text>
      )}
    </Pressable>
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
