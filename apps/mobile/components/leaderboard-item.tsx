import { View, Text } from "react-native";
import { Link } from "expo-router";
import { PlayerAvatar } from "./player-avatar";

interface LeaderboardItemProps {
  rank: number;
  name: string;
  total: string;
  href: string;
}

export function LeaderboardItem({ rank, name, total, href }: LeaderboardItemProps) {
  const rankColor =
    rank === 1
      ? "text-primary"
      : rank === 2
        ? "text-text-secondary"
        : rank === 3
          ? "text-primary-dim"
          : "text-text-muted";

  return (
    <Link href={href as any} asChild>
      <View
        className="flex-row items-center min-h-[44px] py-3 border-b border-border"
        accessibilityRole="button"
        accessibilityLabel={`${name}, rank ${rank}, ${total} in fines`}
      >
        <Text className={`w-7 text-sm font-medium ${rankColor}`}>{rank}</Text>
        <PlayerAvatar name={name} size={32} />
        <Text className="flex-1 text-text-primary text-base ml-3">{name}</Text>
        <Text
          className="text-danger text-sm font-semibold"
          selectable
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {total}
        </Text>
      </View>
    </Link>
  );
}
