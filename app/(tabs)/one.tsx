import { StyleSheet, Pressable } from "react-native";
import { useState } from "react";
import { useUser } from "@clerk/clerk-expo";
import { Text, View, Button } from "@/components/Themed";
import { Dropdown } from "@/components/DropDown";
import { QuickAddModal } from "@/components/QuickAddModal";
import Colors from "@/constants/Colors";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useColorScheme } from "@/components/useColorScheme";
import { Link } from "expo-router";

const testUsers = [
  { label: "Joe", value: "joe", key: "joe" },
  { label: "Carl", value: "carl", key: "carl" },
  { label: "Andrew", value: "andrew", key: "andrew" },
  { label: "Michael", value: "michael", key: "michael" },
  { label: "Josh", value: "josh", key: "josh" },
  { label: "Frank", value: "frank", key: "frank" },
];

const testFines = [
  { label: "Late", value: "late", key: "late" },
  { label: "No show", value: "no-show", key: "no-show" },
  {
    label: "Forgot equipment",
    value: "forgot-equipment",
    key: "forgot-equipment",
  },
  { label: "No payment", value: "no-payment", key: "no-payment" },
  { label: "No effort", value: "no-effort", key: "no-effort" },
  {
    label: "No communication",
    value: "no-communication",
    key: "no-communication",
  },
];

function AddIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
}) {
  const colorScheme = useColorScheme();
  return (
    <FontAwesome
      size={42}
      style={{ marginBottom: -3 }}
      color={Colors[colorScheme ?? "light"].ui2}
      {...props}
    />
  );
}

export default function TabOneScreen() {
  const [fineModalVisible, setFineModalVisible] = useState(false);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const { user } = useUser();
  return (
    <View
      style={styles.container}
      lightColor={Colors.light.bg}
      darkColor={Colors.dark.bg}
    >
      <QuickAddModal
        title="fine"
        visible={fineModalVisible}
        setState={() => setFineModalVisible(!fineModalVisible)}
      />

      <QuickAddModal
        title="user"
        visible={userModalVisible}
        setState={() => setUserModalVisible(!userModalVisible)}
      />
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
      <View
        style={styles.smallContainer}
        lightColor={Colors.light.bg}
        darkColor={Colors.dark.bg}
      >
        <Text style={styles.secondaryTitle}>Choose a player:</Text>
        <View
          style={styles.dropdownContainer}
          lightColor={Colors.light.bg}
          darkColor={Colors.dark.bg}
        >
          <Dropdown data={testUsers} />
          <Pressable onPress={() => setFineModalVisible(true)}>
            <AddIcon name="plus-square-o" />
          </Pressable>
        </View>

        <Text style={styles.secondaryTitle}>Choose a fine:</Text>
        <View
          style={styles.dropdownContainer}
          lightColor={Colors.light.bg}
          darkColor={Colors.dark.bg}
        >
          <Dropdown data={testFines} />
          <Pressable onPress={() => setUserModalVisible(true)}>
            <AddIcon name="plus-square-o" />
          </Pressable>
        </View>

        <Link href="/team-login">
          <Text lightColor={Colors.light.tx} darkColor={Colors.dark.tx}>
            to team login
          </Text>
        </Link>
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
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: "Colors.dark.bg",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
  dropdownContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
});
