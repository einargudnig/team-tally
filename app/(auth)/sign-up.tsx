import { StyleSheet } from 'react-native';

import { Button, Text, TextInput, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useSignUp } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import * as React from 'react';

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [pendingVerification, setPendingVerification] = React.useState(false)
  const [code, setCode] = React.useState('')

  const onSignUpPress = async () => {
    if (!isLoaded) {
      return
    }

    try {
      console.log({ emailAddress, password })
      await signUp.create({
        emailAddress,
        password,
      })

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })

      setPendingVerification(true)
    } catch (err: any) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
    }
  }

  const onPressVerify = async () => {
    if (!isLoaded) {
      return
    }

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      })

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId })
        router.replace('/')
      } else {
        console.error(JSON.stringify(completeSignUp, null, 2))
      }
    } catch (err: any) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
    }
  }

  return (
    <View style={styles.container} lightColor={Colors.light.bg} darkColor={Colors.dark.bg}>
      {!pendingVerification && (
        <View>
          <TextInput
            style={styles.input}
            lightColor={Colors.light.tx}
            darkColor={Colors.dark.tx}
            autoCapitalize="none"
            value={emailAddress}
            placeholder="Email..."
            onChangeText={(email) => setEmailAddress(email)}
          />
          <TextInput
            style={styles.input}
            lightColor={Colors.light.bg}
            darkColor={Colors.dark.bg}
            value={password}
            placeholder="Password..."
            secureTextEntry={true}
            onChangeText={(password) => setPassword(password)}
          />
          <Button lightColor={Colors.light.bg} darkColor={Colors.dark.bg} title="Sign Up" onPress={onSignUpPress} />

          <View>
        <Text>Don't have an account?</Text>
        <Link href="/sign-in">
          <Text>Sign in</Text>
        </Link>
      </View>
        </View>
      )}
      {pendingVerification && (
        <>
          <TextInput style={styles.input} lightColor={Colors.light.bg} darkColor={Colors.dark.bg} value={code} placeholder="Code..." onChangeText={(code) => setCode(code)} />
          <Button lightColor={Colors.light.ui3} darkColor={Colors.dark.ui3} title="Verify Email" onPress={onPressVerify} />
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    margin: 10,
    borderColor: Colors.light.ui3,
    borderWidth: 1,
    borderRadius: 5,
    width: '100%',
    padding: 10,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  }
});
