import { StyleSheet } from "react-native";
import { Text, View } from "@/components/Themed";
import { useAuth, SignedIn, SignedOut } from "@clerk/clerk-expo";
import { Stack, Link } from "expo-router";
import Colors from "@/constants/Colors";

export default function Layout() {
  const { isSignedIn } = useAuth();
  console.log({ isSignedIn });

  console.log("this is showed since our user is logged in!");
  return (
    <>
      <SignedIn>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          {/*<Stack.Screen name="modal" options={{ presentation: "modal" }} /> */}
        </Stack>
      </SignedIn>
      <SignedOut>
      <View style={styles.container}>
        <Text lightColor={Colors.light.tx} darkColor={Colors.dark.tx}>
          If you see this you are logged out and need to log in!
        </Text>
        <View style={styles.button}>
          <Link href="/sign-in">
            <Text>Sign in</Text>
          </Link>
        </View>
      </View>
      </SignedOut>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    marginTop: 10,
    padding: 10,
    borderWidth: 10,
    borderColor: Colors.dark.ui3,
    borderRadius: 10
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
});
