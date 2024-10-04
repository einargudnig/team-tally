import { StatusBar } from 'expo-status-bar';
import { Redirect } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';
import { useClerk } from "@clerk/clerk-expo"
import { Button, Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';

export default function ModalScreen() {
  const { signOut } = useClerk()

  const onSignOutPress = async () => {
    try {
      await signOut()
      return <Redirect href="/" />
    } catch (err: any) {
      console.error("Error from sign out", JSON.stringify(err, null, 2))
    }
  }

  return (
    <View style={styles.container} lightColor={Colors.light.bg} darkColor={Colors.dark.bg}>
      <Text style={styles.title}>Sign out and more!</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <Button title="Sign out" style={styles.button} onPress={onSignOutPress} />
  
      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderWidth: 2,
    borderRadius: 10,
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
    width: 250,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
