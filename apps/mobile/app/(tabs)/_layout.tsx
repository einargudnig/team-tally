import { Tabs } from "expo-router";
import { Text as RNText } from "react-native";

function TabIcon({ name }: { name: string }) {
  return <RNText style={{ fontSize: 20 }}>{name}</RNText>;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#5b5bf7",
        tabBarInactiveTintColor: "#888",
        tabBarStyle: {
          backgroundColor: "#0d0d1a",
          borderTopColor: "#1a1a2e",
        },
        headerStyle: {
          backgroundColor: "#0d0d1a",
        },
        headerTintColor: "#fff",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: () => <TabIcon name="🏠" />,
        }}
      />
      <Tabs.Screen
        name="players"
        options={{
          title: "Players",
          tabBarIcon: () => <TabIcon name="👥" />,
        }}
      />
      <Tabs.Screen
        name="fines"
        options={{
          title: "Fines",
          tabBarIcon: () => <TabIcon name="📋" />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: () => <TabIcon name="⚙️" />,
        }}
      />
    </Tabs>
  );
}
