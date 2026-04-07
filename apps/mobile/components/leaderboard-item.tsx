import { Pressable, View, Text } from "@/src/tw";
import { PlayerAvatar } from "./player-avatar";

interface LeaderboardItemProps {
  rank: number;
  name: string;
  total: string;
  onPress: () => void;
}

function getRankColor(rank: number): string {
  if (rank === 1) return "text-yellow-400";
  if (rank === 2) return "text-gray-400";
  if (rank === 3) return "text-amber-600";
  return "text-gray-600";
}

export function LeaderboardItem({ rank, name, total, onPress }: LeaderboardItemProps) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center bg-gray-900/50 rounded-xl px-3 py-3 mb-1.5">
      <Text className={`font-bold w-6 text-center ${getRankColor(rank)}`}>{rank}</Text>
      <View className="ml-2">
        <PlayerAvatar name={name} size={32} />
      </View>
      <Text className="text-white text-sm ml-3 flex-1">{name}</Text>
      <Text className="text-red-400 font-semibold text-sm">{total}</Text>
    </Pressable>
  );
}
