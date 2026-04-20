import { useCallback, useState } from "react";
import {
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { View, Text, TextInput, Pressable } from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ClipboardList } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import {
  getTeam,
  getFineTypes,
  createFineType,
  deleteFineType,
  getMembers,
  getMonthlyFineMemberIds,
} from "@/db/queries";
import { formatAmount } from "@/lib/currency";
import { MemberChip } from "@/components/member-chip";

type FineType = {
  id: string;
  teamId: string;
  name: string;
  description: string | null;
  amount: number;
  cadence: "one_off" | "monthly";
  createdAt: Date;
};

type Member = { id: string; teamId: string; name: string; createdAt: Date };

type Cadence = "one_off" | "monthly";

export default function FinesScreen() {
  const insets = useSafeAreaInsets();
  const [teamId, setTeamId] = useState<string | null>(null);
  const [currency, setCurrency] = useState("USD");
  const [fineTypesList, setFineTypesList] = useState<FineType[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [monthlyMembersByType, setMonthlyMembersByType] = useState<Record<string, string[]>>({});
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [cadence, setCadence] = useState<Cadence>("one_off");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  function loadData() {
    const team = getTeam();
    if (!team) return;
    setTeamId(team.id);
    setCurrency(team.currency);
    const types = getFineTypes(team.id);
    setFineTypesList(types);
    setAllMembers(getMembers(team.id));
    const monthlyMap: Record<string, string[]> = {};
    for (const ft of types) {
      if (ft.cadence === "monthly") {
        monthlyMap[ft.id] = getMonthlyFineMemberIds(ft.id);
      }
    }
    setMonthlyMembersByType(monthlyMap);
  }

  function onRefresh() {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  }

  function handleAdd() {
    if (!teamId) return;
    const trimmedName = name.trim();
    const parsedAmount = parseInt(amount, 10);
    if (!trimmedName) {
      Alert.alert("Validation", "Name is required.");
      return;
    }
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Validation", "A valid amount is required.");
      return;
    }
    if (cadence === "monthly" && selectedMemberIds.length === 0) {
      Alert.alert("Validation", "Monthly fines need at least one player selected.");
      return;
    }

    createFineType(teamId, trimmedName, parsedAmount, {
      description: description.trim() || undefined,
      cadence,
      memberIds: cadence === "monthly" ? selectedMemberIds : undefined,
    });
    if (process.env.EXPO_OS === "ios")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetForm();
    loadData();
  }

  function handleCancel() {
    resetForm();
  }

  function resetForm() {
    setName("");
    setDescription("");
    setAmount("");
    setCadence("one_off");
    setSelectedMemberIds([]);
    setShowForm(false);
  }

  function toggleMember(id: string) {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  }

  function handleLongPress(item: FineType) {
    if (process.env.EXPO_OS === "ios") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Delete Fine Type",
      `Delete "${item.name}"? This will also remove all fine entries using it.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteFineType(item.id);
            loadData();
          },
        },
      ]
    );
  }

  const renderItem = useCallback(
    ({ item }: { item: FineType }) => {
      const isMonthly = item.cadence === "monthly";
      const monthlyCount = isMonthly ? (monthlyMembersByType[item.id]?.length ?? 0) : 0;
      return (
        <Pressable
          onLongPress={() => handleLongPress(item)}
          accessibilityRole="button"
          accessibilityHint="Long press to delete"
          className="flex-row justify-between items-center min-h-[44px] py-3 border-b border-border active:opacity-70"
        >
          <View className="flex-1 mr-3">
            <View className="flex-row items-center gap-2">
              <Text className="text-text-primary text-base">{item.name}</Text>
              {isMonthly && (
                <View className="bg-primary-muted rounded-full px-2 py-0.5">
                  <Text className="text-primary text-xs font-semibold">
                    Monthly · {monthlyCount}
                  </Text>
                </View>
              )}
            </View>
            {item.description ? (
              <Text className="text-text-muted text-sm mt-0.5">{item.description}</Text>
            ) : null}
          </View>
          <Text className="text-primary text-base font-semibold" selectable style={styles.amount}>
            {formatAmount(item.amount, currency)}
          </Text>
        </Pressable>
      );
    },
    [currency, monthlyMembersByType]
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 bg-surface">
        <View className="px-5 flex-1" style={{ paddingTop: insets.top + 8 }}>
          {!showForm && (
            <Pressable
              onPress={() => setShowForm(true)}
              accessibilityRole="button"
              accessibilityLabel="Add fine type"
              className="border border-dashed border-text-muted rounded-xl min-h-[44px] justify-center items-center mb-4 active:opacity-70"
              style={styles.card}
            >
              <Text className="text-text-muted text-base">+ Add fine type</Text>
            </Pressable>
          )}

          {showForm && (
            <View className="bg-card rounded-xl p-4 mb-4 border border-border" style={styles.card}>
              <TextInput
                className="bg-surface text-text-primary rounded-lg px-3 min-h-[44px] mb-3 text-base border border-border"
                placeholder="Name *"
                placeholderTextColor="#6b7280"
                value={name}
                onChangeText={setName}
                autoFocus
              />
              <TextInput
                className="bg-surface text-text-primary rounded-lg px-3 min-h-[44px] mb-3 text-base border border-border"
                placeholder="Description (optional)"
                placeholderTextColor="#6b7280"
                value={description}
                onChangeText={setDescription}
              />
              <TextInput
                className="bg-surface text-text-primary rounded-lg px-3 min-h-[44px] mb-4 text-base border border-border"
                placeholder="Amount *"
                placeholderTextColor="#6b7280"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />

              <Text className="text-text-muted text-xs font-medium uppercase tracking-widest mb-2">
                Cadence
              </Text>
              <View className="flex-row gap-2 mb-4">
                {(["one_off", "monthly"] as const).map((value) => {
                  const isSelected = cadence === value;
                  return (
                    <Pressable
                      key={value}
                      onPress={() => setCadence(value)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      className={`flex-1 rounded-lg min-h-[44px] justify-center items-center border active:opacity-70 ${
                        isSelected ? "bg-primary border-primary" : "bg-surface border-border"
                      }`}
                    >
                      <Text
                        className={`text-base font-medium ${
                          isSelected ? "text-surface" : "text-text-secondary"
                        }`}
                      >
                        {value === "one_off" ? "One-off" : "Monthly"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {cadence === "monthly" && (
                <View className="mb-4">
                  <Text className="text-text-muted text-xs font-medium uppercase tracking-widest mb-2">
                    Applies to
                  </Text>
                  {allMembers.length === 0 ? (
                    <Text className="text-text-muted text-sm">
                      Add players first to create a monthly fine.
                    </Text>
                  ) : (
                    <View className="flex-row flex-wrap gap-2">
                      {allMembers.map((member) => (
                        <MemberChip
                          key={member.id}
                          name={member.name}
                          selected={selectedMemberIds.includes(member.id)}
                          onPress={() => toggleMember(member.id)}
                        />
                      ))}
                    </View>
                  )}
                  <Text className="text-text-muted text-xs mt-2">
                    Applied on the 1st of each month to selected players.
                  </Text>
                </View>
              )}

              <View className="flex-row gap-3">
                <Pressable
                  onPress={handleCancel}
                  accessibilityRole="button"
                  className="flex-1 bg-card-alt rounded-lg min-h-[44px] justify-center items-center active:opacity-70 border border-border"
                >
                  <Text className="text-text-secondary text-base font-medium">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleAdd}
                  accessibilityRole="button"
                  className="flex-1 bg-primary rounded-lg min-h-[44px] justify-center items-center active:opacity-80"
                >
                  <Text className="text-surface text-base font-semibold">Add</Text>
                </Pressable>
              </View>
            </View>
          )}

          <FlatList
            data={fineTypesList}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            maxToRenderPerBatch={15}
            contentInsetAdjustmentBehavior="automatic"
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />
            }
            ListEmptyComponent={
              <View className="items-center mt-16">
                <ClipboardList size={40} color="#8b8fa3" strokeWidth={1.5} />
                <Text className="text-text-secondary text-base font-medium mt-4">
                  No fine types yet
                </Text>
                <Text className="text-text-muted text-sm mt-1">Add one above to get started</Text>
              </View>
            }
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  card: { borderCurve: "continuous" },
  amount: { fontVariant: ["tabular-nums"] },
});
