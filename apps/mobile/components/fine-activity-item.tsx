import { View, Text } from "react-native";

interface FineActivityItemProps {
  memberName: string;
  fineTypeName: string;
  amount: string;
  date: string;
}

export function FineActivityItem({
  memberName,
  fineTypeName,
  amount,
  date,
}: FineActivityItemProps) {
  return (
    <View className="flex-row items-center min-h-[44px] py-3 border-b border-border">
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
        selectable
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {amount}
      </Text>
    </View>
  );
}
