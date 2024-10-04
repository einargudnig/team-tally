import { StyleSheet } from "react-native";
import { Button, ButtonView, Text, View, Input } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { useSignUp } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import * as React from "react";

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState("");

  const onSignUpPress = async () => {
    if (!isLoaded) {
      return;
    }

    try {
      console.log({ emailAddress, password });
      await signUp.create({
        emailAddress,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      setPendingVerification(true);
    } catch (err: any) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) {
      return;
    }

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        router.replace("/");
      } else {
        console.error(JSON.stringify(completeSignUp, null, 2));
      }
    } catch (err: any) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
    }
  };

  return (
    <View
      style={styles.container}
      lightColor={Colors.light.bg}
      darkColor={Colors.dark.bg}
    >
      {!pendingVerification && (
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
            onChangeText={(email) => setEmailAddress(email)}
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
          <Button
            lightColor={Colors.light.bg}
            darkColor={Colors.dark.bg}
            title="Sign Up"
            onPress={onSignUpPress}
          />

          <View style={styles.smallContainer}>
            <Text>Already have an account?</Text>
            <ButtonView style={styles.button}>
              <Link href="/sign-in">
                <Text
                  style={styles.title}
                  lightColor={Colors.light.tx}
                  darkColor={Colors.dark.tx}
                >
                  Sign in
                </Text>
              </Link>
            </ButtonView>
          </View>
        </View>
      )}
      {pendingVerification && (
        <>
          <Input
            style={styles.input}
            lightColor={Colors.light.tx}
            darkColor={Colors.dark.tx}
            lightBorder={Colors.light.ui3}
            darkBorder={Colors.dark.ui3}
            value={code}
            placeholder="Code..."
            onChangeText={(code) => setCode(code)}
          />
          <Button
            lightColor={Colors.light.ui3}
            darkColor={Colors.dark.ui3}
            title="Verify Email"
            onPress={onPressVerify}
          />
        </>
      )}
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
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
  },
});
