import { Pressable, Text, View } from "react-native";

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
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${name}${selected ? ", selected" : ""}`}
      className={`flex-row items-center gap-2 rounded-full min-h-[44px] px-4 py-2.5 active:opacity-70 ${
        selected
          ? "bg-primary"
          : "bg-card border border-border"
      }`}
    >
      <View
        className={`w-6 h-6 rounded-full items-center justify-center ${
          selected ? "bg-surface/20" : "bg-surface"
        }`}
      >
        <Text
          className={`text-xs font-semibold ${
            selected ? "text-surface" : "text-text-muted"
          }`}
        >
          {selected ? "✓" : initial}
        </Text>
      </View>
      <Text
        className={`text-sm font-medium ${
          selected ? "text-surface" : "text-text-secondary"
        }`}
      >
        {name}
      </Text>
    </Pressable>
  );
}
