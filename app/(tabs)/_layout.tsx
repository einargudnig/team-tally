import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Link, Tabs } from "expo-router";
import React from "react";
import { Pressable } from "react-native";

import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
}) {
  const colorScheme = useColorScheme();
  return (
    <FontAwesome
      size={28}
      style={{ marginBottom: -3 }}
      color={Colors[colorScheme ?? "light"].ui3}
      {...props}
    />
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].cyan2,
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? "light"].bg2,
          borderTopColor: Colors[colorScheme ?? "light"].ui,
        },
      }}
    >
      <Tabs.Screen
        name="one"
        options={{
          title: "Add fines",
          tabBarIcon: () => <TabBarIcon name="home" />,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: "Overview",
          tabBarIcon: () => <TabBarIcon name="table" />,
        }}
      />
      <Tabs.Screen
        name="three"
        options={{
          title: "Settings",
          tabBarIcon: () => <TabBarIcon name="gear" />,
        }}
      />
    </Tabs>
  );
}
