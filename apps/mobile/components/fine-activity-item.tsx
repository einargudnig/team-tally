import { View, Text } from "@/src/tw";

interface FineActivityItemProps {
  memberName: string;
  fineTypeName: string;
  amount: string;
  date: string;
}

export function FineActivityItem({ memberName, fineTypeName, amount, date }: FineActivityItemProps) {
  return (
    <View className="flex-row justify-between items-center bg-gray-900/50 rounded-xl px-3 py-2.5 mb-1.5">
      <View className="flex-1">
        <Text className="text-white text-sm">
          <Text className="font-semibold">{memberName}</Text>{" · "}{fineTypeName}
        </Text>
        <Text className="text-gray-600 text-xs mt-0.5">{date}</Text>
      </View>
      <Text className="text-red-400 text-sm">{amount}</Text>
    </View>
  );
}
