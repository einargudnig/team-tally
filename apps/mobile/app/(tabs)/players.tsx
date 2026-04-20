import { FlatList, Alert, RefreshControl, StyleSheet } from "react-native";
import { View, Text, TextInput, Pressable } from "react-native";
import { useState, useCallback } from "react";
import { useFocusEffect, Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { UserPlus } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { getTeam, getMembers, createMember, deleteMember } from "@/db/queries";
import { PlayerAvatar } from "@/components/player-avatar";

type Member = { id: string; teamId: string; name: string; createdAt: Date };

const ITEM_HEIGHT = 52;

export default function PlayersScreen() {
  const insets = useSafeAreaInsets();
  const [teamId, setTeamId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [newName, setNewName] = useState("");
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
    setMembers(getMembers(team.id));
  }

  function onRefresh() {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  }

  function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed || !teamId) return;
    createMember(teamId, trimmed);
    if (process.env.EXPO_OS === "ios")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNewName("");
    loadData();
  }

  function handleLongPress(member: Member) {
    if (process.env.EXPO_OS === "ios") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Delete Player", `Remove ${member.name} and all their fines?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteMember(member.id);
          if (process.env.EXPO_OS === "ios")
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          loadData();
        },
      },
    ]);
  }

  const renderItem = useCallback(
    ({ item }: { item: Member }) => (
      <Link href={`/player/${item.id}` as any} asChild>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${item.name}, view details`}
          accessibilityHint="Long press to delete"
          className="flex-row items-center gap-3 px-5 min-h-[52px] border-b border-border active:opacity-70"
          onLongPress={() => handleLongPress(item)}
        >
          <PlayerAvatar name={item.name} size={36} />
          <Text className="text-text-primary text-base flex-1">{item.name}</Text>
          <Text className="text-text-muted text-lg">›</Text>
        </Pressable>
      </Link>
    ),
    []
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  return (
    <View className="flex-1 bg-surface">
      {/* Add player row */}
      <View
        className="flex-row items-center gap-2 px-5 pb-4"
        style={{ paddingTop: insets.top + 8 }}
      >
        <TextInput
          className="flex-1 bg-card text-text-primary rounded-xl px-4 min-h-[44px] text-base border border-border"
          style={styles.card}
          placeholder="Player name"
          placeholderTextColor="#6b7280"
          value={newName}
          onChangeText={setNewName}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
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

      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        maxToRenderPerBatch={15}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={members.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center">
            <UserPlus size={40} color="#8b8fa3" strokeWidth={1.5} />
            <Text className="text-text-secondary text-base font-medium mt-4">No players yet</Text>
            <Text className="text-text-muted text-sm mt-1">Add your first player above</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderCurve: "continuous" },
  emptyContainer: { flex: 1 },
  listContent: { paddingBottom: 24 },
});
