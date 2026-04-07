import { Pressable, Text, View } from "@/src/tw";

interface MemberChipProps {
  name: string;
  selected: boolean;
  onPress: () => void;
}

export function MemberChip({ name, selected, onPress }: MemberChipProps) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-2 rounded-xl px-4 py-2.5 ${
        selected ? "bg-indigo-600" : "bg-gray-900 border border-gray-700"
      }`}
    >
      <View className={`w-6 h-6 rounded-full items-center justify-center ${selected ? "bg-white/20" : "bg-indigo-900/50"}`}>
        <Text className={`text-xs font-semibold ${selected ? "text-white" : "text-indigo-300"}`}>{initial}</Text>
      </View>
      <Text className={`text-sm ${selected ? "text-white" : "text-gray-400"}`}>
        {name}{selected ? " ✓" : ""}
      </Text>
    </Pressable>
  );
}
