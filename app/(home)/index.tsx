import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { SignedOut, useAuth } from '@clerk/clerk-expo';
import { Link, Redirect } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function Page() {
  const { isSignedIn } = useAuth()
  console.log('Here I end after I reload tha emulator and logged in? ,')
  if (isSignedIn) {
    // return <Redirect href={} />
    console.log('redirect!')
  }

  return (
    <View style={styles.container} lightColor={Colors.light.bg} darkColor={Colors.dark.bg}>
      <SignedOut>
          <Link href="/(auth)/sign-in">
            <Text style={styles.title} lightColor={Colors.light.tx} darkColor={Colors.dark.tx}>Sign In</Text>
          </Link>
        <View style={styles.smallContainer}>
          <Link href="/(auth)/sign-up" style={styles.link}>
            <Text style={styles.title} lightColor={Colors.light.tx} darkColor={Colors.dark.tx}>Sign Up</Text>
          </Link>
          <Text style={styles.text}>If you do not have an account you need to create one!</Text>
        </View> 
      </SignedOut>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallContainer: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  text: {
    marginTop: 20,
  },
  link: {
    padding: 10,
    
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});