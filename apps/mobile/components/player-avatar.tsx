import { View, Text } from "@/src/tw";

interface PlayerAvatarProps {
  name: string;
  size?: number;
}

export function PlayerAvatar({ name, size = 40 }: PlayerAvatarProps) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <View
      className="bg-indigo-900/50 items-center justify-center rounded-full"
      style={{ width: size, height: size }}
    >
      <Text className="text-indigo-300 font-semibold" style={{ fontSize: size * 0.4 }}>
        {initial}
      </Text>
    </View>
  );
}
