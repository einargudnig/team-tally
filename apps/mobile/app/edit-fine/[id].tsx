import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { View, Text, ScrollView, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import {
  getFineEntry,
  getFineTypes,
  getMembers,
  getTeam,
  updateFineEntry,
} from "@/db/queries";
import { formatAmount } from "@/lib/currency";
import { MemberChip } from "@/components/member-chip";

type Member = { id: string; teamId: string; name: string; createdAt: Date };
type FineType = {
  id: string;
  teamId: string;
  name: string;
  description: string | null;
  amount: number;
  createdAt: Date;
};

export default function EditFineScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [currency, setCurrency] = useState("USD");
  const [members, setMembers] = useState<Member[]>([]);
  const [fineTypesList, setFineTypesList] = useState<FineType[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedFineTypeId, setSelectedFineTypeId] = useState<string | null>(null);
  const [multiplier, setMultiplier] = useState(1);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    const team = getTeam();
    if (!team) return;
    const entry = getFineEntry(id);
    if (!entry) {
      setNotFound(true);
      return;
    }
    setCurrency(team.currency);
    setMembers(getMembers(team.id));
    setFineTypesList(getFineTypes(team.id));
    setSelectedMemberId(entry.memberId);
    setSelectedFineTypeId(entry.fineTypeId);
    setMultiplier(entry.multiplier);
    setDate(new Date(`${entry.date}T00:00:00`));
  }, [id]);

  const selectedMember = members.find((m) => m.id === selectedMemberId);
  const selectedFineType = fineTypesList.find((ft) => ft.id === selectedFineTypeId);
  const canSave = !!selectedMemberId && !!selectedFineTypeId && !!id;

  function handleSave() {
    if (!canSave || !id) return;
    updateFineEntry(id, {
      fineTypeId: selectedFineTypeId!,
      memberId: selectedMemberId!,
      date: date.toISOString().slice(0, 10),
    });
    if (process.env.EXPO_OS === "ios")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }

  if (notFound) {
    return (
      <View className="flex-1 items-center justify-center bg-surface px-5">
        <Text className="text-text-secondary text-base">This fine no longer exists.</Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          className="mt-4 bg-primary rounded-xl min-h-[44px] px-6 justify-center items-center active:opacity-80"
        >
          <Text className="text-surface text-base font-semibold">Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: "#0f0f14" }}
    >
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              hitSlop={8}
            >
              <Text className="text-text-secondary text-base font-medium">Cancel</Text>
            </Pressable>
          ),
        }}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {multiplier > 1 && (
          <View
            className="mt-4 bg-primary-muted rounded-xl px-4 py-3 flex-row items-center gap-2"
            style={styles.card}
          >
            <Text className="text-primary text-lg font-bold" style={styles.amount}>
              {multiplier}×
            </Text>
            <Text className="text-text-primary text-sm font-semibold">
              Logged on a double day — multiplier preserved
            </Text>
          </View>
        )}

        {/* Who? */}
        <View className="mt-6">
          <Text className="text-text-muted text-xs font-medium uppercase tracking-widest mb-3">
            Who?
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {members.map((member) => (
              <MemberChip
                key={member.id}
                name={member.name}
                selected={member.id === selectedMemberId}
                onPress={() => setSelectedMemberId(member.id)}
              />
            ))}
          </View>
        </View>

        {/* What for? */}
        <View className="mt-8">
          <Text className="text-text-muted text-xs font-medium uppercase tracking-widest mb-3">
            What for?
          </Text>
          <View className="gap-2">
            {fineTypesList.map((ft) => {
              const isSelected = ft.id === selectedFineTypeId;
              return (
                <Pressable
                  key={ft.id}
                  onPress={() => setSelectedFineTypeId(ft.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${ft.name}, ${formatAmount(ft.amount, currency)}`}
                  className={`flex-row items-center justify-between rounded-xl px-4 min-h-[44px] py-3 active:opacity-70 ${
                    isSelected ? "bg-primary" : "bg-card border border-border"
                  }`}
                  style={styles.card}
                >
                  <View className="flex-1 mr-3">
                    <Text
                      className={`text-base font-medium ${isSelected ? "text-surface" : "text-text-primary"}`}
                    >
                      {ft.name}
                    </Text>
                    {ft.description ? (
                      <Text
                        className={`text-sm mt-0.5 ${isSelected ? "text-surface/70" : "text-text-muted"}`}
                      >
                        {ft.description}
                      </Text>
                    ) : null}
                  </View>
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
        </View>

        {/* When? */}
        <View className="mt-8">
          <Text className="text-text-muted text-xs font-medium uppercase tracking-widest mb-3">
            When?
          </Text>
          {(() => {
            const today = startOfToday();
            const yesterday = startOfYesterday();
            const onToday = !showDatePicker && isSameLocalDay(date, today);
            const onYesterday = !showDatePicker && isSameLocalDay(date, yesterday);
            const onCustom =
              showDatePicker ||
              (!isSameLocalDay(date, today) && !isSameLocalDay(date, yesterday));
            const customLabel = onCustom && !showDatePicker ? formatDateShort(date) : "Pick…";
            return (
              <View className="flex-row gap-2">
                <DateChip
                  label="Today"
                  selected={onToday}
                  onPress={() => {
                    setDate(today);
                    setShowDatePicker(false);
                  }}
                />
                <DateChip
                  label="Yesterday"
                  selected={onYesterday}
                  onPress={() => {
                    setDate(yesterday);
                    setShowDatePicker(false);
                  }}
                />
                <DateChip
                  label={customLabel}
                  selected={onCustom}
                  onPress={() => setShowDatePicker(true)}
                />
              </View>
            );
          })()}

          {showDatePicker && (
            <View
              className="mt-3 bg-card border border-border rounded-xl overflow-hidden"
              style={styles.card}
            >
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                maximumDate={new Date()}
                onChange={(_event, selectedDate) => {
                  if (Platform.OS === "android") setShowDatePicker(false);
                  if (selectedDate) setDate(selectedDate);
                }}
                themeVariant="dark"
                style={{ alignSelf: "center" }}
              />
              {Platform.OS === "ios" && (
                <Pressable
                  onPress={() => setShowDatePicker(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Done"
                  className="border-t border-border min-h-[44px] justify-center items-center active:opacity-70"
                >
                  <Text className="text-primary text-base font-semibold">Done</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <View className="px-5 pt-3 pb-6 border-t border-border bg-surface">
        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          accessibilityRole="button"
          accessibilityLabel={
            canSave && selectedMember && selectedFineType
              ? `Save fine for ${selectedMember.name}, ${formatAmount(selectedFineType.amount * multiplier, currency)}`
              : "Select player and fine type"
          }
          className={`rounded-2xl min-h-[48px] justify-center items-center active:opacity-80 ${
            canSave ? "bg-primary" : "bg-card border border-border"
          }`}
          style={styles.card}
        >
          <Text className={`text-base font-bold ${canSave ? "text-surface" : "text-text-muted"}`}>
            {canSave && selectedMember && selectedFineType
              ? `Save — ${formatAmount(selectedFineType.amount * multiplier, currency)}${multiplier > 1 ? ` (${multiplier}×)` : ""}`
              : "Select player and fine type"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  card: { borderCurve: "continuous" },
  amount: { fontVariant: ["tabular-nums"] },
});

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfYesterday(): Date {
  const d = startOfToday();
  d.setDate(d.getDate() - 1);
  return d;
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface DateChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function DateChip({ label, selected, onPress }: DateChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      className={`flex-1 rounded-xl min-h-[44px] justify-center items-center active:opacity-70 ${
        selected ? "bg-primary" : "bg-card border border-border"
      }`}
      style={styles.card}
    >
      <Text className={`text-sm font-medium ${selected ? "text-surface" : "text-text-secondary"}`}>
        {label}
      </Text>
    </Pressable>
  );
}
