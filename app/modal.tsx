import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet } from 'react-native';

import { Button, Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';

export default function ModalScreen() {

  const onSignOutPress = () => console.log('Sign out user!')

  return (
    <View style={styles.container} lightColor={Colors.light.bg} darkColor={Colors.dark.bg}>
      <Text style={styles.title}>Sign out and more!</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <Button title="Sign out" onPress={onSignOutPress} />
  
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
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
