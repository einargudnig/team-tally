import "../global.css";
import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { ActivityIndicator } from "react-native";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { getTeam } from "@/db/queries";
import { ErrorScreen } from "@/components/error-screen";

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  if (__DEV__) console.error("[RootErrorBoundary]", error);
  return <ErrorScreen error={error} retry={retry} />;
}

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
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="add-fine"
          options={{
            presentation: "formSheet",
            sheetGrabberVisible: true,
            sheetAllowedDetents: [1.0],
            headerShown: true,
            title: "Add Fine",
            headerStyle: { backgroundColor: "#0f0f14" },
            headerTintColor: "#f5f5f5",
            headerShadowVisible: false,
            contentStyle: { backgroundColor: "#0f0f14" },
          }}
        />
        <Stack.Screen
          name="player/[id]"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: "#0f0f14" },
            headerTintColor: "#f5f5f5",
            headerShadowVisible: false,
            title: "Player",
          }}
        />
      </Stack>
    </>
  );
}
