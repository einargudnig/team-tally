import { useEffect, useState, useRef } from "react";
import { Platform, StyleSheet } from "react-native";
import { useRouter, Stack } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { View, Text, ScrollView, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { getTeam, getMembers, getFineTypes, createFineEntry } from "@/db/queries";
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

  const [currency, setCurrency] = useState("USD");
  const [members, setMembers] = useState<Member[]>([]);
  const [fineTypesList, setFineTypesList] = useState<FineType[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedFineTypeId, setSelectedFineTypeId] = useState<string | null>(null);
  const [date, setDate] = useState(new Date());
  const [justAdded, setJustAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const team = getTeam();
    if (!team) return;
    setCurrency(team.currency);
    setMembers(getMembers(team.id));
    setFineTypesList(getFineTypes(team.id));
    return () => {
      if (addedTimer.current) clearTimeout(addedTimer.current);
    };
  }, []);

  const selectedMember = members.find((m) => m.id === selectedMemberId);
  const selectedFineType = fineTypesList.find((ft) => ft.id === selectedFineTypeId);
  const canConfirm = !!selectedMemberId && !!selectedFineTypeId;

  function handleConfirm() {
    if (!selectedMemberId || !selectedFineTypeId) return;
    const dateStr = date.toISOString().slice(0, 10);
    createFineEntry(selectedFineTypeId, selectedMemberId, dateStr);
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
        contentContainerClassName="px-5 pb-8"
      >
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
          {fineTypesList.length === 0 ? (
            <Text className="text-text-muted text-sm">No fine types yet.</Text>
          ) : (
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
            </View>
          )}
        </View>

        {/* When? */}
        <View className="mt-8">
          <Text className="text-text-muted text-xs font-medium uppercase tracking-widest mb-3">
            When?
          </Text>
          <View
            className="bg-card rounded-xl overflow-hidden border border-border"
            style={styles.card}
          >
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              maximumDate={new Date()}
              onChange={(_event, selectedDate) => {
                if (selectedDate) setDate(selectedDate);
              }}
              themeVariant="dark"
              style={{ alignSelf: "center" }}
            />
          </View>
        </View>

        {/* Confirm */}
        <View className="mt-8">
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
                  ? `Fine ${selectedMember.name} ${formatAmount(selectedFineType.amount, currency)}`
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
                  ? `Fine ${selectedMember.name} — ${formatAmount(selectedFineType.amount, currency)}`
                  : "Select player and fine type"}
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderCurve: "continuous" },
  amount: { fontVariant: ["tabular-nums"] },
});
