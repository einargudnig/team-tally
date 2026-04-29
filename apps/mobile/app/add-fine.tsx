import { useEffect, useState, useRef } from "react";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, TextInput } from "react-native";
import { useRouter, Stack } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { View, Text, ScrollView, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import {
  getTeam,
  getMembers,
  getFineTypes,
  createFineEntry,
  createFineType,
  isDoubleDayActive,
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

export default function AddFineScreen() {
  const router = useRouter();

  const [teamId, setTeamId] = useState<string | null>(null);
  const [currency, setCurrency] = useState("USD");
  const [doubleDayActive, setDoubleDayActive] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [fineTypesList, setFineTypesList] = useState<FineType[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedFineTypeId, setSelectedFineTypeId] = useState<string | null>(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [showNewTypeForm, setShowNewTypeForm] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeAmount, setNewTypeAmount] = useState("");
  const addedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const team = getTeam();
    if (!team) return;
    setTeamId(team.id);
    setCurrency(team.currency);
    setDoubleDayActive(isDoubleDayActive(team));
    setMembers(getMembers(team.id));
    setFineTypesList(getFineTypes(team.id).filter((ft) => ft.cadence !== "monthly"));
    return () => {
      if (addedTimer.current) clearTimeout(addedTimer.current);
    };
  }, []);

  const multiplier = doubleDayActive ? 2 : 1;

  const selectedMember = members.find((m) => m.id === selectedMemberId);
  const selectedFineType = fineTypesList.find((ft) => ft.id === selectedFineTypeId);
  const canConfirm = !!selectedMemberId && !!selectedFineTypeId;

  function handleCreateNewType() {
    if (!teamId) return;
    const trimmedName = newTypeName.trim();
    const parsedAmount = parseInt(newTypeAmount, 10);
    if (!trimmedName) {
      Alert.alert("Validation", "Name is required.");
      return;
    }
    if (!newTypeAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Validation", "A valid amount is required.");
      return;
    }
    const newId = createFineType(teamId, trimmedName, parsedAmount);
    if (process.env.EXPO_OS === "ios")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setFineTypesList(getFineTypes(teamId).filter((ft) => ft.cadence !== "monthly"));
    setSelectedFineTypeId(newId);
    setNewTypeName("");
    setNewTypeAmount("");
    setShowNewTypeForm(false);
  }

  function handleConfirm() {
    if (!selectedMemberId || !selectedFineTypeId) return;
    const dateStr = date.toISOString().slice(0, 10);
    createFineEntry(selectedFineTypeId, selectedMemberId, dateStr, multiplier);
    if (process.env.EXPO_OS === "ios")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setJustAdded(true);
    addedTimer.current = setTimeout(() => {
      setJustAdded(false);
      setSelectedMemberId(null);
      setSelectedFineTypeId(null);
      setDate(new Date());
    }, 1200);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <View className="flex-1 bg-surface">
        <Stack.Screen
          options={{
            headerRight: () => (
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Done"
                hitSlop={8}
              >
                <Text className="text-primary text-base font-medium">Done</Text>
              </Pressable>
            ),
          }}
        />

        <ScrollView
          className="flex-1"
          contentInsetAdjustmentBehavior="automatic"
          contentContainerClassName="px-5 pb-6"
          keyboardShouldPersistTaps="handled"
        >
        {doubleDayActive && (
          <View
            className="mt-4 bg-primary rounded-xl px-4 py-3 flex-row items-center gap-2"
            style={styles.card}
          >
            <Text className="text-surface text-lg font-bold" style={styles.amount}>
              2×
            </Text>
            <Text className="text-surface text-sm font-semibold">
              Double day — fines are doubled today
            </Text>
          </View>
        )}

        {/* Who? */}
        <View className="mt-6">
          <Text className="text-text-muted text-xs font-medium uppercase tracking-widest mb-3">
            Who?
          </Text>
          {members.length === 0 ? (
            <Text className="text-text-muted text-sm">No players yet.</Text>
          ) : (
            <View className="flex-row flex-wrap gap-2">
              {members.map((member) => (
                <MemberChip
                  key={member.id}
                  name={member.name}
                  selected={member.id === selectedMemberId}
                  onPress={() =>
                    setSelectedMemberId(member.id === selectedMemberId ? null : member.id)
                  }
                />
              ))}
            </View>
          )}
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
                  onPress={() =>
                    setSelectedFineTypeId(ft.id === selectedFineTypeId ? null : ft.id)
                  }
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

            {showNewTypeForm ? (
              <View
                className="bg-card rounded-xl px-4 py-3 border border-border gap-3"
                style={styles.card}
              >
                <TextInput
                  className="bg-surface text-text-primary rounded-lg px-3 min-h-[44px] text-base border border-border"
                  placeholder="Fine name"
                  placeholderTextColor="#6b7280"
                  value={newTypeName}
                  onChangeText={setNewTypeName}
                  autoFocus
                />
                <TextInput
                  className="bg-surface text-text-primary rounded-lg px-3 min-h-[44px] text-base border border-border"
                  placeholder="Amount"
                  placeholderTextColor="#6b7280"
                  keyboardType="numeric"
                  value={newTypeAmount}
                  onChangeText={setNewTypeAmount}
                />
                <View className="flex-row gap-3">
                  <Pressable
                    onPress={() => {
                      setShowNewTypeForm(false);
                      setNewTypeName("");
                      setNewTypeAmount("");
                    }}
                    accessibilityRole="button"
                    className="flex-1 bg-card-alt rounded-lg min-h-[44px] justify-center items-center active:opacity-70 border border-border"
                  >
                    <Text className="text-text-secondary text-base font-medium">Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleCreateNewType}
                    accessibilityRole="button"
                    className="flex-1 bg-primary rounded-lg min-h-[44px] justify-center items-center active:opacity-80"
                  >
                    <Text className="text-surface text-base font-semibold">Create & use</Text>
                  </Pressable>
                </View>
              </View>
            ) : fineTypesList.length === 0 ? (
              <View
                className="bg-card border border-border rounded-xl px-5 py-6 items-center"
                style={styles.card}
              >
                <Text className="text-3xl mb-2">📝</Text>
                <Text className="text-text-primary text-base font-semibold mb-1">
                  No fine types yet
                </Text>
                <Text className="text-text-muted text-sm text-center mb-4">
                  Define what you fine players for — late to practice, missing kit, etc.
                </Text>
                <Pressable
                  onPress={() => setShowNewTypeForm(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Create your first fine type"
                  className="bg-primary rounded-xl min-h-[44px] px-6 justify-center items-center active:opacity-80"
                  style={styles.card}
                >
                  <Text className="text-surface text-base font-semibold">
                    Create your first fine
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => setShowNewTypeForm(true)}
                accessibilityRole="button"
                accessibilityLabel="Create new fine type"
                className="border border-dashed border-text-muted rounded-xl min-h-[44px] justify-center items-center active:opacity-70"
                style={styles.card}
              >
                <Text className="text-text-muted text-base">+ New fine type</Text>
              </Pressable>
            )}
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
          {justAdded ? (
            <View
              className="bg-success rounded-2xl min-h-[48px] justify-center items-center"
              style={styles.card}
            >
              <Text className="text-white text-base font-bold">Added!</Text>
            </View>
          ) : (
            <Pressable
              onPress={handleConfirm}
              disabled={!canConfirm}
              accessibilityRole="button"
              accessibilityLabel={
                canConfirm && selectedMember && selectedFineType
                  ? `Fine ${selectedMember.name} ${formatAmount(selectedFineType.amount * multiplier, currency)}`
                  : "Select player and fine type"
              }
              className={`rounded-2xl min-h-[48px] justify-center items-center active:opacity-80 ${
                canConfirm ? "bg-primary" : "bg-card border border-border"
              }`}
              style={styles.card}
            >
              <Text
                className={`text-base font-bold ${canConfirm ? "text-surface" : "text-text-muted"}`}
              >
                {canConfirm && selectedMember && selectedFineType
                  ? `Fine ${selectedMember.name} — ${formatAmount(selectedFineType.amount * multiplier, currency)}${doubleDayActive ? " (2×)" : ""}`
                  : "Select player and fine type"}
              </Text>
            </Pressable>
          )}
        </View>
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
      <Text
        className={`text-sm font-medium ${selected ? "text-surface" : "text-text-secondary"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
