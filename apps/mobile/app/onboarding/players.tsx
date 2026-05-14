import { useState, useEffect } from "react";
import {
  KeyboardAvoidingView,
  StyleSheet,
  Platform,
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { getTeam, getMembers, createMember, deleteMember } from "@/db/queries";
import { PlayerAvatar } from "@/components/player-avatar";
import { OnboardingProgress } from "@/components/onboarding-progress";

type Member = { id: string; teamId: string; name: string; createdAt: Date };

const MIN_PLAYERS = 2;

export default function OnboardingPlayersScreen() {
  const router = useRouter();
  const [teamId, setTeamId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    const team = getTeam();
    if (!team) {
      router.replace("/onboarding");
      return;
    }
    setTeamId(team.id);
    setMembers(getMembers(team.id));
  }, []);

  function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed || !teamId) return;
    createMember(teamId, trimmed);
    if (process.env.EXPO_OS === "ios")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNewName("");
    setMembers(getMembers(teamId));
  }

  function handleRemove(memberId: string) {
    if (process.env.EXPO_OS === "ios") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    deleteMember(memberId);
    if (teamId) setMembers(getMembers(teamId));
  }

  const canContinue = members.length >= MIN_PLAYERS;

  function handleContinue() {
    if (!canContinue) return;
    router.replace("/onboarding/fines" as never);
  }

  function handleSkip() {
    router.replace("/onboarding/fines" as never);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: "#0f0f14" }}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={styles.scrollContent}
        contentContainerClassName="px-5"
        keyboardShouldPersistTaps="handled"
      >
        <View className="pt-12 pb-8">
          <OnboardingProgress step={2} />
        </View>

        <View className="mb-6">
          <Text className="text-text-primary text-2xl font-bold mb-2">Who's on the squad?</Text>
          <Text className="text-text-muted text-sm">
            Add at least {MIN_PLAYERS} players. You can add more anytime.
          </Text>
        </View>

        <View className="flex-row gap-2 mb-4">
          <TextInput
            className="flex-1 bg-card text-text-primary rounded-xl px-4 min-h-[44px] text-base border border-border"
            style={styles.card}
            placeholder="Player name"
            placeholderTextColor="#6b7280"
            value={newName}
            onChangeText={setNewName}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
            autoFocus
          />
          <Pressable
            className="bg-primary rounded-xl px-5 min-h-[44px] justify-center active:opacity-80"
            style={styles.card}
            onPress={handleAdd}
            accessibilityRole="button"
            accessibilityLabel="Add player"
          >
            <Text className="text-surface font-semibold text-base">Add</Text>
          </Pressable>
        </View>

        <View className="gap-2 mb-6">
          {members.map((m) => (
            <View
              key={m.id}
              className="flex-row items-center gap-3 bg-card border border-border rounded-xl px-3 min-h-[52px]"
              style={styles.card}
            >
              <PlayerAvatar name={m.name} size={32} />
              <Text className="flex-1 text-text-primary text-base">{m.name}</Text>
              <Pressable
                onPress={() => handleRemove(m.id)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${m.name}`}
                className="w-9 h-9 items-center justify-center active:opacity-60"
              >
                <X size={18} color="#8b8fa3" strokeWidth={2} />
              </Pressable>
            </View>
          ))}
        </View>

        {members.length > 0 && members.length < MIN_PLAYERS && (
          <Text className="text-text-muted text-sm text-center mb-4">
            One more to go — fines aren't fun with just one player.
          </Text>
        )}
      </ScrollView>

      <View className="px-5 pt-3 pb-6 border-t border-border bg-surface">
        <Pressable
          onPress={handleContinue}
          disabled={!canContinue}
          accessibilityRole="button"
          accessibilityLabel="Continue to fine types"
          className={`rounded-xl min-h-[48px] justify-center items-center active:opacity-80 ${
            canContinue ? "bg-primary" : "bg-card border border-border"
          }`}
          style={styles.card}
        >
          <Text
            className={`text-base font-semibold ${canContinue ? "text-surface" : "text-text-muted"}`}
          >
            Continue
          </Text>
        </Pressable>
        <Pressable
          onPress={handleSkip}
          accessibilityRole="button"
          accessibilityLabel="Skip and add players later"
          className="min-h-[44px] justify-center items-center mt-2 active:opacity-60"
        >
          <Text className="text-text-muted text-sm">Skip for now</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, paddingBottom: 24 },
  card: { borderCurve: "continuous" },
});
