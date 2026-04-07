import { FlatList, Alert } from "react-native";
import { View, Text, TextInput, Pressable } from "@/src/tw";
import { useState, useCallback } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { getTeam, getMembers, createMember, deleteMember } from "@/db/queries";
import { PlayerAvatar } from "@/components/player-avatar";

type Member = {
  id: string;
  teamId: string;
  name: string;
  createdAt: Date;
};

export default function PlayersScreen() {
  const router = useRouter();
  const [teamId, setTeamId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [newName, setNewName] = useState("");

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  function loadData() {
    const team = getTeam();
    if (!team) return;
    setTeamId(team.id);
    const result = getMembers(team.id);
    setMembers(result);
  }

  function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed || !teamId) return;
    createMember(teamId, trimmed);
    setNewName("");
    loadData();
  }

  function handleLongPress(member: Member) {
    Alert.alert(
      "Delete Player",
      `Remove ${member.name} and all their fines?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteMember(member.id);
            loadData();
          },
        },
      ]
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* Add player row */}
      <View className="flex-row items-center gap-2 px-4 pt-4 pb-3">
        <TextInput
          className="flex-1 bg-zinc-900 text-white rounded-xl px-4 py-3 text-base"
          placeholder="Player name"
          placeholderTextColor="#6b7280"
          value={newName}
          onChangeText={setNewName}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
        />
        <Pressable
          className="bg-indigo-600 rounded-xl px-4 py-3"
          onPress={handleAdd}
        >
          <Text className="text-white font-semibold text-base">Add</Text>
        </Pressable>
      </View>

      {/* Player list */}
      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        contentContainerStyle={members.length === 0 ? { flex: 1 } : { paddingBottom: 24 }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center">
            <Text className="text-zinc-500 text-base">No players yet. Add one above.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            className="flex-row items-center gap-3 px-4 py-3 border-b border-zinc-800"
            onPress={() => router.push(`/player/${item.id}`)}
            onLongPress={() => handleLongPress(item)}
          >
            <PlayerAvatar name={item.name} size={40} />
            <Text className="text-white text-base flex-1">{item.name}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}
