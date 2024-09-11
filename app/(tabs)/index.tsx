import { StyleSheet } from 'react-native';

import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';

export default function TabOneScreen() {
  return (
    <View style={styles.container} lightColor={Colors.light.bg} darkColor={Colors.dark.bg}>
      <Text style={styles.title} lightColor={Colors.light.tx} darkColor={Colors.dark.tx}>Tab One Edited</Text>
      <View style={styles.separator} lightColor={Colors.light.ui2} darkColor={Colors.dark.ui2} />
      <EditScreenInfo path="app/(tabs)/index.tsx" />
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
