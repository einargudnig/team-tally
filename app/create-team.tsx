import { Link } from "expo-router";
import { Text, View, Button } from "@/components/Themed";
import { StyleSheet } from "react-native";
import Colors from "@/constants/Colors";

export default function Page() {
  return (
    <View
      lightColor={Colors.light.ui}
      darkColor={Colors.dark.ui}
      style={styles.container}
    >
      <Text lightColor={Colors.light.tx} darkColor={Colors.dark.tx}>
        Create team
      </Text>
      <Button style={styles.button} title="Log in team" />
      <Link href="/one">tabs</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
    marginVertical: 30,
  },
});
