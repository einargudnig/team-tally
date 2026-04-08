import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { View, Text, ScrollView, Pressable } from "react-native";
import { getTeam, getMembers, getFineTypes, createFineEntry } from "@/db/queries";
import { formatAmount } from "@/lib/currency";
import { MemberChip } from "@/components/member-chip";

type Member = {
  id: string;
  teamId: string;
  name: string;
  createdAt: Date;
};

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

  useEffect(() => {
    const team = getTeam();
    if (!team) return;
    setCurrency(team.currency);
    setMembers(getMembers(team.id));
    setFineTypesList(getFineTypes(team.id));
  }, []);

  const selectedMember = members.find((m) => m.id === selectedMemberId);
  const selectedFineType = fineTypesList.find((ft) => ft.id === selectedFineTypeId);
  const canConfirm = !!selectedMemberId && !!selectedFineTypeId;

  function handleConfirm() {
    if (!selectedMemberId || !selectedFineTypeId) return;
    const dateStr = date.toISOString().slice(0, 10);
    createFineEntry(selectedFineTypeId, selectedMemberId, dateStr);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
      setSelectedMemberId(null);
      setSelectedFineTypeId(null);
      setDate(new Date());
    }, 1200);
  }

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-6 pb-4 border-b border-gray-800">
        <Text className="text-white text-xl font-bold">Add Fine</Text>
        <Pressable onPress={() => router.back()} className="px-3 py-1.5 active:opacity-70">
          <Text className="text-indigo-400 text-base font-medium">Done</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-8">
        {/* Who? */}
        <View className="mt-6">
          <Text className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-3">
            Who?
          </Text>
          {members.length === 0 ? (
            <Text className="text-gray-600 text-sm">No players yet.</Text>
          ) : (
            <View className="flex-row flex-wrap gap-2">
              {members.map((member) => (
                <MemberChip
                  key={member.id}
                  name={member.name}
                  selected={member.id === selectedMemberId}
                  onPress={() =>
                    setSelectedMemberId(
                      member.id === selectedMemberId ? null : member.id
                    )
                  }
                />
              ))}
            </View>
          )}
        </View>

        {/* What for? */}
        <View className="mt-8">
          <Text className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-3">
            What for?
          </Text>
          {fineTypesList.length === 0 ? (
            <Text className="text-gray-600 text-sm">No fine types yet.</Text>
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
                    className={`flex-row items-center justify-between rounded-xl px-4 py-3 active:opacity-70 ${
                      isSelected
                        ? "bg-indigo-600"
                        : "bg-gray-900 border border-gray-700"
                    }`}
                  >
                    <View className="flex-1 mr-3">
                      <Text
                        className={`text-base font-semibold ${
                          isSelected ? "text-white" : "text-gray-200"
                        }`}
                      >
                        {ft.name}
                      </Text>
                      {ft.description ? (
                        <Text
                          className={`text-sm mt-0.5 ${
                            isSelected ? "text-white/70" : "text-gray-500"
                          }`}
                        >
                          {ft.description}
                        </Text>
                      ) : null}
                    </View>
                    <Text
                      className={`text-base font-bold ${
                        isSelected ? "text-white" : "text-emerald-400"
                      }`}
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
          <Text className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-3">
            When?
          </Text>
          <View className="bg-gray-900 rounded-xl overflow-hidden">
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
            <View className="bg-emerald-600 rounded-2xl py-4 items-center">
              <Text className="text-white text-base font-bold">Added!</Text>
            </View>
          ) : (
            <Pressable
              onPress={handleConfirm}
              disabled={!canConfirm}
              className={`rounded-2xl py-4 items-center active:opacity-80 ${
                canConfirm ? "bg-indigo-600" : "bg-gray-800"
              }`}
            >
              <Text
                className={`text-base font-bold ${
                  canConfirm ? "text-white" : "text-gray-600"
                }`}
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
