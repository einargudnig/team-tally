import { View, Text, Pressable } from "react-native";

interface FineActivityItemProps {
  memberName: string;
  fineTypeName: string;
  amount: string;
  date: string;
  onPress?: () => void;
}

export function FineActivityItem({
  memberName,
  fineTypeName,
  amount,
  date,
  onPress,
}: FineActivityItemProps) {
  const content = (
    <>
      <View className="flex-1">
        <Text className="text-text-primary text-sm">
          <Text className="font-semibold">{memberName}</Text>
          {" — "}
          {fineTypeName}
        </Text>
        <Text className="text-text-muted text-xs mt-0.5">{date}</Text>
      </View>
      <Text
        className="text-danger text-sm font-medium"
        selectable={!onPress}
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {amount}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityHint="Tap for edit and delete options"
        className="flex-row items-center min-h-[44px] py-3 border-b border-border active:opacity-70"
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View className="flex-row items-center min-h-[44px] py-3 border-b border-border">
      {content}
    </View>
  );
}
