import { ActionSheetIOS, Alert, Platform } from "react-native";

interface EditDeleteOptions {
  title?: string;
  message?: string;
  destructiveMessage?: string;
  onEdit: () => void;
  onDelete: () => void;
}

export function showEditDeleteSheet({
  title,
  message,
  destructiveMessage,
  onEdit,
  onDelete,
}: EditDeleteOptions) {
  if (Platform.OS === "ios") {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        message,
        options: ["Edit", "Delete", "Cancel"],
        destructiveButtonIndex: 1,
        cancelButtonIndex: 2,
        userInterfaceStyle: "dark",
      },
      (index) => {
        if (index === 0) onEdit();
        else if (index === 1) confirmDelete(destructiveMessage, onDelete);
      }
    );
    return;
  }

  Alert.alert(title ?? "Actions", message, [
    { text: "Edit", onPress: onEdit },
    {
      text: "Delete",
      style: "destructive",
      onPress: () => confirmDelete(destructiveMessage, onDelete),
    },
    { text: "Cancel", style: "cancel" },
  ]);
}

interface SheetAction {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

/** Generic action sheet: a titled list of choices plus an implicit Cancel. */
export function showActionSheet(title: string, message: string | undefined, actions: SheetAction[]) {
  if (Platform.OS === "ios") {
    const destructiveIndex = actions.findIndex((a) => a.destructive);
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        message,
        options: [...actions.map((a) => a.label), "Cancel"],
        destructiveButtonIndex: destructiveIndex >= 0 ? destructiveIndex : undefined,
        cancelButtonIndex: actions.length,
        userInterfaceStyle: "dark",
      },
      (index) => {
        if (index < actions.length) actions[index]?.onPress();
      }
    );
    return;
  }

  Alert.alert(title, message, [
    ...actions.map((a) => ({
      text: a.label,
      style: a.destructive ? ("destructive" as const) : ("default" as const),
      onPress: a.onPress,
    })),
    { text: "Cancel", style: "cancel" },
  ]);
}

function confirmDelete(message: string | undefined, onConfirm: () => void) {
  Alert.alert("Delete", message ?? "This can't be undone.", [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: onConfirm },
  ]);
}
