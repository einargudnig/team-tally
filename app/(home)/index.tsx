import { Text, View, ButtonView } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { SignedOut, SignedIn, useAuth } from "@clerk/clerk-expo";
import { Stack, Link, Redirect } from "expo-router";
import { StyleSheet } from "react-native";

export default function Page() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    // redirect to the first tab, we want that to be "home tab"
    return <Redirect href={"/one"} />;
  }

  return (
    <View
      style={styles.container}
      lightColor={Colors.light.bg}
      darkColor={Colors.dark.bg}
    >
      <SignedIn>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: "modal" }} />
        </Stack>
      </SignedIn>
      <SignedOut>
        <ButtonView
          style={styles.button}
          lightBorder={Colors.light.ui3}
          darkBorder={Colors.dark.ui3}
        >
          <Link href="/(auth)/sign-in">
            <Text
              style={styles.title}
              lightColor={Colors.light.tx}
              darkColor={Colors.dark.tx}
            >
              Sign In
            </Text>
          </Link>
        </ButtonView>
        <ButtonView
          style={styles.button}
          lightBorder={Colors.light.ui3}
          darkBorder={Colors.dark.ui3}
        >
          <Link href="/(auth)/sign-up">
            <Text
              style={styles.title}
              lightColor={Colors.light.tx}
              darkColor={Colors.dark.tx}
            >
              Sign Up
            </Text>
          </Link>
        </ButtonView>
        <View style={styles.smallContainer}>
          <Text style={styles.text}>
            If you do not have an account you need to create one!
          </Text>
        </View>
      </SignedOut>
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
    flexDirection: "column",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  text: {
    marginTop: 20,
  },
  link: {
    padding: 10,
  },
  button: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderWidth: 2,
    borderRadius: 10,
    fontSize: 30,
    marginBottom: 20,
    width: 120,
  },
});
