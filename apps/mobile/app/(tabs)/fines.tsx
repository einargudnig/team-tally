import { useCallback, useState } from "react";
import { FlatList, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useFocusEffect } from "expo-router";
import { View, Text, TextInput, Pressable } from "@/src/tw";
import { getTeam, getFineTypes, createFineType, deleteFineType } from "@/db/queries";
import { formatAmount } from "@/lib/currency";

type FineType = {
  id: string;
  teamId: string;
  name: string;
  description: string | null;
  amount: number;
  createdAt: Date;
};

export default function FinesScreen() {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [currency, setCurrency] = useState("USD");
  const [fineTypesList, setFineTypesList] = useState<FineType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

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
    const result = getFineTypes(team.id);
    setFineTypesList(result);
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

    createFineType(teamId, trimmedName, parsedAmount, description.trim() || undefined);
    setName("");
    setDescription("");
    setAmount("");
    setShowForm(false);
    loadData();
  }

  function handleCancel() {
    setName("");
    setDescription("");
    setAmount("");
    setShowForm(false);
  }

  function handleLongPress(item: FineType) {
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

  function renderItem({ item }: { item: FineType }) {
    return (
      <Pressable
        onLongPress={() => handleLongPress(item)}
        className="bg-zinc-900 rounded-xl px-4 py-3 mb-3 flex-row justify-between items-center active:opacity-70"
      >
        <View className="flex-1 mr-3">
          <Text className="text-white text-base font-semibold">{item.name}</Text>
          {item.description ? (
            <Text className="text-zinc-400 text-sm mt-0.5">{item.description}</Text>
          ) : null}
        </View>
        <Text className="text-emerald-400 text-base font-bold">
          {formatAmount(item.amount, currency)}
        </Text>
      </Pressable>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 bg-black">
        <View className="px-4 pt-4 flex-1">
          {/* Add fine type button */}
          {!showForm && (
            <Pressable
              onPress={() => setShowForm(true)}
              className="border border-dashed border-zinc-600 rounded-xl py-4 items-center mb-4 active:opacity-70"
            >
              <Text className="text-zinc-400 text-base">+ Add fine type</Text>
            </Pressable>
          )}

          {/* Inline form */}
          {showForm && (
            <View className="bg-zinc-900 rounded-xl p-4 mb-4">
              <TextInput
                className="bg-zinc-800 text-white rounded-lg px-3 py-2.5 mb-3 text-base"
                placeholder="Name *"
                placeholderTextColor="#71717a"
                value={name}
                onChangeText={setName}
                autoFocus
              />
              <TextInput
                className="bg-zinc-800 text-white rounded-lg px-3 py-2.5 mb-3 text-base"
                placeholder="Description (optional)"
                placeholderTextColor="#71717a"
                value={description}
                onChangeText={setDescription}
              />
              <TextInput
                className="bg-zinc-800 text-white rounded-lg px-3 py-2.5 mb-4 text-base"
                placeholder="Amount *"
                placeholderTextColor="#71717a"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
              <View className="flex-row gap-3">
                <Pressable
                  onPress={handleCancel}
                  className="flex-1 bg-zinc-700 rounded-lg py-2.5 items-center active:opacity-70"
                >
                  <Text className="text-white text-base font-medium">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleAdd}
                  className="flex-1 bg-emerald-600 rounded-lg py-2.5 items-center active:opacity-70"
                >
                  <Text className="text-white text-base font-semibold">Add</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* List */}
          <FlatList
            data={fineTypesList}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="items-center mt-16">
                <Text className="text-zinc-500 text-base">No fine types yet.</Text>
                <Text className="text-zinc-600 text-sm mt-1">
                  Add one above to get started.
                </Text>
              </View>
            }
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
