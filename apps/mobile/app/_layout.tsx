import "../global.css";
import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { ActivityIndicator } from "react-native";
import { View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { getTeam } from "@/db/queries";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasTeam, setHasTeam] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const team = getTeam();
    setHasTeam(!!team);
    setIsLoading(false);
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const inOnboarding = segments[0] === "onboarding";
    if (!hasTeam && !inOnboarding) {
      router.replace("/onboarding");
    } else if (hasTeam && inOnboarding) {
      router.replace("/(tabs)");
    }
  }, [isLoading, hasTeam, segments]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator size="large" color="#5b5bf7" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="add-fine"
        options={{
          presentation: "formSheet",
          sheetGrabberVisible: true,
        }}
      />
      <Stack.Screen
        name="player/[id]"
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: "#0d0d1a" },
          headerTintColor: "#fff",
          title: "Player",
        }}
      />
    </Stack>
  );
}
