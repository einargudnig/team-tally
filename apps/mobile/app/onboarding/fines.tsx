import { useState, useEffect, useMemo } from "react";
import {
  KeyboardAvoidingView,
  StyleSheet,
  Platform,
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Check, Plus } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { getTeam, getMembers, createFineType } from "@/db/queries";
import { fineTemplates, type FineTemplate } from "@/lib/fine-templates";
import { getCurrencyInfo } from "@/lib/currency";
import { OnboardingProgress } from "@/components/onboarding-progress";

type Row = FineTemplate & { selected: boolean; amountText: string };

export default function OnboardingFinesScreen() {
  const router = useRouter();
  const [teamId, setTeamId] = useState<string | null>(null);
  const [currency, setCurrency] = useState("ISK");
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>(() =>
    fineTemplates.map((t) => ({
      ...t,
      selected: t.preChecked,
      amountText: String(t.amount),
    }))
  );
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [customRows, setCustomRows] = useState<{ name: string; amount: number }[]>([]);

  useEffect(() => {
    const team = getTeam();
    if (!team) {
      router.replace("/onboarding");
      return;
    }
    setTeamId(team.id);
    setCurrency(team.currency);
    setMemberIds(getMembers(team.id).map((m) => m.id));
  }, []);

  const currencyInfo = useMemo(() => getCurrencyInfo(currency), [currency]);

  function toggleRow(i: number) {
    if (process.env.EXPO_OS === "ios") Haptics.selectionAsync();
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, selected: !r.selected } : r)));
  }

  function updateAmount(i: number, text: string) {
    const cleaned = text.replace(/[^0-9]/g, "");
    setRows((prev) =>
      prev.map((r, idx) => (idx === i ? { ...r, amountText: cleaned, selected: true } : r))
    );
  }

  function addCustom() {
    const trimmedName = customName.trim();
    const parsed = parseInt(customAmount, 10);
    if (!trimmedName) {
      Alert.alert("Validation", "Name is required.");
      return;
    }
    if (!customAmount || isNaN(parsed) || parsed <= 0) {
      Alert.alert("Validation", "A valid amount is required.");
      return;
    }
    setCustomRows((prev) => [...prev, { name: trimmedName, amount: parsed }]);
    setCustomName("");
    setCustomAmount("");
    setShowCustom(false);
    if (process.env.EXPO_OS === "ios")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  const selectedCount = rows.filter((r) => r.selected).length + customRows.length;
  const canContinue = selectedCount > 0;

  function handleContinue() {
    if (!teamId || !canContinue) return;
    for (const r of rows) {
      if (!r.selected) continue;
      const amount = parseInt(r.amountText, 10);
      if (isNaN(amount) || amount < 0) continue;
      createFineType(teamId, r.name, amount, {
        cadence: r.cadence,
        memberIds: r.cadence === "monthly" ? memberIds : undefined,
      });
    }
    for (const c of customRows) {
      createFineType(teamId, c.name, c.amount);
    }
    router.replace("/onboarding/first-fine" as never);
  }

  function handleSkip() {
    router.replace("/onboarding/first-fine" as never);
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
          <OnboardingProgress step={3} />
        </View>

        <View className="mb-6">
          <Text className="text-text-primary text-2xl font-bold mb-2">What's a fine?</Text>
          <Text className="text-text-muted text-sm">
            Pick a few to start. Tap a row to toggle, tap the amount to edit.
          </Text>
        </View>

        <View className="gap-2">
          {rows.map((row, i) => (
            <Pressable
              key={row.name}
              onPress={() => toggleRow(i)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: row.selected }}
              accessibilityLabel={row.name}
              className={`flex-row items-center gap-3 rounded-xl px-4 min-h-[56px] py-2 ${
                row.selected ? "bg-card border border-primary/60" : "bg-card border border-border"
              }`}
              style={styles.card}
            >
              <View
                className={`w-6 h-6 rounded-full items-center justify-center ${
                  row.selected ? "bg-primary" : "bg-surface border border-border"
                }`}
              >
                {row.selected && <Check size={14} color="#0f0f14" strokeWidth={3} />}
              </View>
              <View className="flex-1">
                <Text className="text-text-primary text-base font-medium">{row.name}</Text>
                {row.cadence === "monthly" && (
                  <Text className="text-text-muted text-xs mt-0.5">
                    Monthly · applies on the 1st
                  </Text>
                )}
              </View>
              <View className="flex-row items-center gap-1">
                {currencyInfo.symbolPosition === "before" && (
                  <Text className="text-text-muted text-base">{currencyInfo.symbol}</Text>
                )}
                <TextInput
                  className="bg-surface border border-border rounded-lg px-2 min-w-[70px] min-h-[36px] text-text-primary text-base text-right"
                  style={[styles.card, styles.amount]}
                  value={row.amountText}
                  onChangeText={(t) => updateAmount(i, t)}
                  keyboardType="numeric"
                  selectTextOnFocus
                  accessibilityLabel={`Amount for ${row.name}`}
                />
                {currencyInfo.symbolPosition === "after" && (
                  <Text className="text-text-muted text-base">{currencyInfo.symbol}</Text>
                )}
              </View>
            </Pressable>
          ))}

          {customRows.map((c, i) => (
            <View
              key={`custom-${i}`}
              className="flex-row items-center gap-3 rounded-xl px-4 min-h-[56px] py-2 bg-card border border-primary/60"
              style={styles.card}
            >
              <View className="w-6 h-6 rounded-full items-center justify-center bg-primary">
                <Check size={14} color="#0f0f14" strokeWidth={3} />
              </View>
              <Text className="flex-1 text-text-primary text-base font-medium">{c.name}</Text>
              <Text className="text-text-primary text-base" style={styles.amount}>
                {currencyInfo.symbolPosition === "before"
                  ? `${currencyInfo.symbol}${c.amount}`
                  : `${c.amount} ${currencyInfo.symbol}`}
              </Text>
            </View>
          ))}

          {showCustom ? (
            <View
              className="bg-card border border-border rounded-xl px-4 py-3 gap-3"
              style={styles.card}
            >
              <TextInput
                className="bg-surface text-text-primary rounded-lg px-3 min-h-[44px] text-base border border-border"
                placeholder="Fine name (e.g. Wrong colour socks)"
                placeholderTextColor="#6b7280"
                value={customName}
                onChangeText={setCustomName}
                autoFocus
              />
              <TextInput
                className="bg-surface text-text-primary rounded-lg px-3 min-h-[44px] text-base border border-border"
                placeholder="Amount"
                placeholderTextColor="#6b7280"
                keyboardType="numeric"
                value={customAmount}
                onChangeText={setCustomAmount}
              />
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => {
                    setShowCustom(false);
                    setCustomName("");
                    setCustomAmount("");
                  }}
                  className="flex-1 bg-card-alt border border-border rounded-lg min-h-[44px] justify-center items-center active:opacity-70"
                  accessibilityRole="button"
                >
                  <Text className="text-text-secondary text-base font-medium">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={addCustom}
                  className="flex-1 bg-primary rounded-lg min-h-[44px] justify-center items-center active:opacity-80"
                  accessibilityRole="button"
                >
                  <Text className="text-surface text-base font-semibold">Add</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={() => setShowCustom(true)}
              accessibilityRole="button"
              accessibilityLabel="Add a custom fine"
              className="border border-dashed border-text-muted rounded-xl min-h-[48px] flex-row items-center justify-center gap-2 active:opacity-70"
              style={styles.card}
            >
              <Plus size={16} color="#8b8fa3" strokeWidth={2} />
              <Text className="text-text-muted text-base">Add your own</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      <View className="px-5 pt-3 pb-6 border-t border-border bg-surface">
        <Pressable
          onPress={handleContinue}
          disabled={!canContinue}
          accessibilityRole="button"
          accessibilityLabel="Continue and log first fine"
          className={`rounded-xl min-h-[48px] justify-center items-center active:opacity-80 ${
            canContinue ? "bg-primary" : "bg-card border border-border"
          }`}
          style={styles.card}
        >
          <Text
            className={`text-base font-semibold ${canContinue ? "text-surface" : "text-text-muted"}`}
          >
            {selectedCount > 0
              ? `Continue with ${selectedCount} fine${selectedCount === 1 ? "" : "s"}`
              : "Pick at least one"}
          </Text>
        </Pressable>
        <Pressable
          onPress={handleSkip}
          accessibilityRole="button"
          accessibilityLabel="Skip and set up fines later"
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
  amount: { fontVariant: ["tabular-nums"] },
});
