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

function confirmDelete(message: string | undefined, onConfirm: () => void) {
  Alert.alert("Delete", message ?? "This can't be undone.", [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: onConfirm },
  ]);
}
