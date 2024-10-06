import { StyleSheet } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { Text, View, Button } from "@/components/Themed";
import { Dropdown } from "@/components/DropDown";
import Colors from "@/constants/Colors";

const testUsers = [
  { label: "Joe", value: "joe", key: "joe" },
  { label: "Carl", value: "carl", key: "carl" },
  { label: "Andrew", value: "andrew", key: "andrew" },
  { label: "Michael", value: "michael", key: "michael" },
  { label: "Josh", value: "josh", key: "josh" },
  { label: "Frank", value: "frank", key: "frank" },
];

export default function TabOneScreen() {
  const { user } = useUser();
  console.log("user in first tab component", user?.id);
  return (
    <View
      style={styles.container}
      lightColor={Colors.light.bg}
      darkColor={Colors.dark.bg}
    >
      <Text
        style={styles.title}
        lightColor={Colors.light.tx}
        darkColor={Colors.dark.tx}
      >
        Fine a player!
      </Text>

      <Text
        style={styles.title}
        lightColor={Colors.light.tx}
        darkColor={Colors.dark.tx}
      >
        Hello {user?.emailAddresses[0].emailAddress}
      </Text>

      <View
        style={styles.separator}
        lightColor={Colors.light.ui2}
        darkColor={Colors.dark.ui2}
      />
      <View style={styles.smallContainer}>
        <Text style={styles.secondaryTitle}>Choose a player:</Text>
        <Dropdown data={testUsers} />
        <View
          style={styles.separator}
          lightColor={Colors.light.ui2}
          darkColor={Colors.dark.ui2}
        />

        <Text style={styles.secondaryTitle}>Choose a fine:</Text>
        <Dropdown data={testUsers} />

        <Button title="Add fine to player" style={styles.button} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  smallContainer: {
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    display: "flex",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  secondaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 10,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
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
