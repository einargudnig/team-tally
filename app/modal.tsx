import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet } from "react-native";
import { Text, View } from "@/components/Themed";
import Colors from "@/constants/Colors";

// This it the modal to be used as a quick way to add players and later fines.
export default function ModalScreen() {
  return (
    <View
      style={styles.container}
      lightColor={Colors.light.bg}
      darkColor={Colors.dark.bg}
    >
      <Text style={styles.title}>Sign out and more!</Text>
      <View
        style={styles.separator}
        lightColor="#eee"
        darkColor="rgba(255,255,255,0.1)"
      />

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  button: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderWidth: 2,
    borderRadius: 10,
    fontSize: 30,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 10,
    width: 250,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
});
