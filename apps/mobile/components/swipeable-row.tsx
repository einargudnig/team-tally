import { type ReactNode, useRef } from "react";
import { Pressable, Text, View } from "react-native";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import { Pencil, Trash2 } from "lucide-react-native";
import * as Haptics from "expo-haptics";

interface SwipeableRowProps {
  children: ReactNode;
  /** Revealed by swiping right (leading edge). */
  onEdit?: () => void;
  /** Revealed by swiping left (trailing edge). Should perform its own confirmation. */
  onDelete?: () => void;
}

const ACTION_WIDTH = 80;
const EDIT_COLOR = "#f59e0b";
const DELETE_COLOR = "#ef4444";

export function SwipeableRow({ children, onEdit, onDelete }: SwipeableRowProps) {
  const ref = useRef<SwipeableMethods>(null);

  const trigger = (action?: () => void) => {
    ref.current?.close();
    if (process.env.EXPO_OS === "ios") Haptics.selectionAsync();
    action?.();
  };

  const renderEdit = () => (
    <Pressable
      onPress={() => trigger(onEdit)}
      accessibilityRole="button"
      accessibilityLabel="Edit"
      style={{ width: ACTION_WIDTH, backgroundColor: EDIT_COLOR }}
      className="justify-center items-center active:opacity-80"
    >
      <View className="items-center">
        <Pencil size={20} color="#ffffff" />
        <Text className="text-white text-xs font-medium mt-1">Edit</Text>
      </View>
    </Pressable>
  );

  const renderDelete = () => (
    <Pressable
      onPress={() => trigger(onDelete)}
      accessibilityRole="button"
      accessibilityLabel="Delete"
      style={{ width: ACTION_WIDTH, backgroundColor: DELETE_COLOR }}
      className="justify-center items-center active:opacity-80"
    >
      <View className="items-center">
        <Trash2 size={20} color="#ffffff" />
        <Text className="text-white text-xs font-medium mt-1">Delete</Text>
      </View>
    </Pressable>
  );

  return (
    <ReanimatedSwipeable
      ref={ref}
      friction={2}
      leftThreshold={40}
      rightThreshold={40}
      overshootLeft={false}
      overshootRight={false}
      renderLeftActions={onEdit ? renderEdit : undefined}
      renderRightActions={onDelete ? renderDelete : undefined}
    >
      {children}
    </ReanimatedSwipeable>
  );
}
