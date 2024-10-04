import { StyleSheet } from "react-native";
import { Button, ButtonView, Text, View, Input } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { useSignIn } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import React from "react";

export default function Page() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");

  const onSignInPress = React.useCallback(async () => {
    if (!isLoaded) {
      return;
    }

    try {
      console.log({ emailAddress, password });

      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/");
      } else {
        // See https://clerk.com/docs/custom-flows/error-handling
        // for more info on error handling
        console.error(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err: any) {
      console.error("Error from sign in", JSON.stringify(err, null, 2));
    }
  }, [isLoaded, emailAddress, password]);

  return (
    <View
      style={styles.container}
      lightColor={Colors.light.bg}
      darkColor={Colors.dark.bg}
    >
      <View>
        <Input
          style={styles.input}
          lightColor={Colors.light.tx}
          darkColor={Colors.dark.tx}
          lightBorder={Colors.light.ui3}
          darkBorder={Colors.dark.ui3}
          autoCapitalize="none"
          value={emailAddress}
          placeholder="Email..."
          onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
        />
        <Input
          style={styles.input}
          lightColor={Colors.light.tx}
          darkColor={Colors.dark.tx}
          lightBorder={Colors.light.ui3}
          darkBorder={Colors.dark.ui3}
          value={password}
          placeholder="Password..."
          secureTextEntry={true}
          onChangeText={(password) => setPassword(password)}
        />
        <Button title="Sign In" onPress={onSignInPress} />
        <View style={styles.smallContainer}>
          <Text>Don't have an account?</Text>
          <ButtonView
            style={styles.button}
            lightBorder={Colors.light.ui3}
            darkBorder={Colors.dark.ui3}
          >
            <Link href="/sign-up">
              <Text
                style={styles.title}
                lightColor={Colors.light.tx}
                darkColor={Colors.dark.tx}
              >
                Sign up
              </Text>
            </Link>
          </ButtonView>
        </View>
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
  title: {
    fontSize: 20,
  },
  input: {
    margin: 12,
    borderWidth: 1,
    borderRadius: 5,
    width: 250,
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
    marginTop: 20,
    width: 120,
  },
  smallContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    marginTop: 50,
  },
});
