import { useState, useEffect } from "react";
import { StyleSheet, ScrollView, View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  getTeam,
  getMembers,
  getFineTypes,
  createFineEntry,
  markOnboardingComplete,
  todayIso,
} from "@/db/queries";
import { formatAmount } from "@/lib/currency";
import { MemberChip } from "@/components/member-chip";
import { OnboardingProgress } from "@/components/onboarding-progress";

type Member = { id: string; teamId: string; name: string; createdAt: Date };
type FineType = {
  id: string;
  teamId: string;
  name: string;
  description: string | null;
  amount: number;
  cadence: "one_off" | "monthly";
  createdAt: Date;
};

export default function OnboardingFirstFineScreen() {
  const router = useRouter();
  const [teamId, setTeamId] = useState<string | null>(null);
  const [currency, setCurrency] = useState("ISK");
  const [members, setMembers] = useState<Member[]>([]);
  const [fineTypesList, setFineTypesList] = useState<FineType[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedFineTypeId, setSelectedFineTypeId] = useState<string | null>(null);

  useEffect(() => {
    const team = getTeam();
    if (!team) {
      router.replace("/onboarding");
      return;
    }
    setTeamId(team.id);
    setCurrency(team.currency);
    const mems = getMembers(team.id);
    const types = getFineTypes(team.id).filter((ft) => ft.cadence !== "monthly");
    setMembers(mems);
    setFineTypesList(types);

    // If user skipped earlier steps and there's nothing to log,
    // skip step 4 entirely and graduate them.
    if (mems.length === 0 || types.length === 0) {
      markOnboardingComplete(team.id);
      router.replace("/(tabs)");
    }
  }, []);

  const selectedFineType = fineTypesList.find((ft) => ft.id === selectedFineTypeId);
  const selectedMember = members.find((m) => m.id === selectedMemberId);
  const canConfirm = !!selectedMemberId && !!selectedFineTypeId;

  function handleConfirm() {
    if (!teamId || !selectedMemberId || !selectedFineTypeId) return;
    createFineEntry(selectedFineTypeId, selectedMemberId, todayIso(), 1);
    markOnboardingComplete(teamId);
    if (process.env.EXPO_OS === "ios")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/(tabs)");
  }

  function handleSkip() {
    if (teamId) markOnboardingComplete(teamId);
    router.replace("/(tabs)");
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0f0f14" }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={styles.scrollContent}
        contentContainerClassName="px-5"
        keyboardShouldPersistTaps="handled"
      >
        <View className="pt-12 pb-8">
          <OnboardingProgress step={4} />
        </View>

        <View className="mb-8">
          <Text className="text-text-primary text-2xl font-bold mb-2">Log your first fine</Text>
          <Text className="text-text-muted text-sm">
            Pick a player and a reason. This is what running the team feels like.
          </Text>
        </View>

        <Text className="text-text-muted text-xs font-medium uppercase tracking-widest mb-3">
          Who?
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-8">
          {members.map((member) => (
            <MemberChip
              key={member.id}
              name={member.name}
              selected={member.id === selectedMemberId}
              onPress={() => setSelectedMemberId(member.id === selectedMemberId ? null : member.id)}
            />
          ))}
        </View>

        <Text className="text-text-muted text-xs font-medium uppercase tracking-widest mb-3">
          What for?
        </Text>
        <View className="gap-2">
          {fineTypesList.map((ft) => {
            const isSelected = ft.id === selectedFineTypeId;
            return (
              <Pressable
                key={ft.id}
                onPress={() => setSelectedFineTypeId(ft.id === selectedFineTypeId ? null : ft.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${ft.name}, ${formatAmount(ft.amount, currency)}`}
                className={`flex-row items-center justify-between rounded-xl px-4 min-h-[44px] py-3 active:opacity-70 ${
                  isSelected ? "bg-primary" : "bg-card border border-border"
                }`}
                style={styles.card}
              >
                <Text
                  className={`flex-1 mr-3 text-base font-medium ${isSelected ? "text-surface" : "text-text-primary"}`}
                >
                  {ft.name}
                </Text>
                <Text
                  className={`text-base font-semibold ${isSelected ? "text-surface" : "text-primary"}`}
                  style={styles.amount}
                >
                  {formatAmount(ft.amount, currency)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View className="px-5 pt-3 pb-6 border-t border-border bg-surface">
        <Pressable
          onPress={handleConfirm}
          disabled={!canConfirm}
          accessibilityRole="button"
          accessibilityLabel={
            canConfirm && selectedMember && selectedFineType
              ? `Log fine: ${selectedMember.name} ${formatAmount(selectedFineType.amount, currency)}`
              : "Pick a player and a fine"
          }
          className={`rounded-xl min-h-[48px] justify-center items-center active:opacity-80 ${
            canConfirm ? "bg-primary" : "bg-card border border-border"
          }`}
          style={styles.card}
        >
          <Text
            className={`text-base font-bold ${canConfirm ? "text-surface" : "text-text-muted"}`}
          >
            {canConfirm && selectedMember && selectedFineType
              ? `Fine ${selectedMember.name} — ${formatAmount(selectedFineType.amount, currency)}`
              : "Pick a player and a fine"}
          </Text>
        </Pressable>
        <Pressable
          onPress={handleSkip}
          accessibilityRole="button"
          accessibilityLabel="Skip and finish setup"
          className="min-h-[44px] justify-center items-center mt-2 active:opacity-60"
        >
          <Text className="text-text-muted text-sm">I'll log one later</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, paddingBottom: 24 },
  card: { borderCurve: "continuous" },
  amount: { fontVariant: ["tabular-nums"] },
});
