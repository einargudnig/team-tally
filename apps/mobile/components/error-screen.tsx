import { View, Text, Pressable, ScrollView, StyleSheet, Linking, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";

const ISSUE_URL = "https://github.com/einargudnig/team-tally/issues/new";
const STACK_LIMIT = 1500;

interface ErrorScreenProps {
  error: Error;
  retry: () => void;
}

export function ErrorScreen({ error, retry }: ErrorScreenProps) {
  const insets = useSafeAreaInsets();

  function handleReport() {
    Linking.openURL(buildIssueUrl(error)).catch(() => {
      // Best-effort: if the user has no browser/no GitHub app, there's
      // nothing useful we can do offline. Silent fail beats a second crash.
    });
  }

  return (
    <ScrollView
      className="flex-1 bg-surface"
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 24 }]}
      contentContainerClassName="px-5"
    >
      <View className="items-center mb-10">
        <Text className="text-5xl mb-4">🤕</Text>
        <Text className="text-text-primary text-2xl font-bold mb-2 text-center">
          Something broke
        </Text>
        <Text className="text-text-muted text-sm text-center">
          Your data is safe. Try again, and let us know if it keeps happening.
        </Text>
      </View>

      <Pressable
        onPress={retry}
        accessibilityRole="button"
        accessibilityLabel="Try again"
        className="bg-primary rounded-xl min-h-[44px] px-6 justify-center items-center active:opacity-80 mb-3"
        style={styles.card}
      >
        <Text className="text-surface text-base font-semibold">Try again</Text>
      </Pressable>

      <Pressable
        onPress={handleReport}
        accessibilityRole="button"
        accessibilityLabel="Report this issue on GitHub"
        className="bg-card border border-border rounded-xl min-h-[44px] px-6 justify-center items-center active:opacity-80"
        style={styles.card}
      >
        <Text className="text-text-primary text-base font-semibold">Report on GitHub</Text>
      </Pressable>

      {__DEV__ && (
        <View
          className="mt-8 bg-card border border-border rounded-xl p-4"
          style={styles.card}
        >
          <Text className="text-text-muted text-xs uppercase tracking-widest mb-2">
            Dev details
          </Text>
          <Text className="text-text-secondary text-xs mb-3" selectable>
            {error.message}
          </Text>
          {error.stack && (
            <Text className="text-text-muted text-[10px]" selectable>
              {error.stack.slice(0, STACK_LIMIT)}
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

function buildIssueUrl(error: Error): string {
  const version = Constants.expoConfig?.version ?? "unknown";
  const title = `Crash: ${error.message.slice(0, 80)}`;
  const stack = error.stack ? error.stack.slice(0, STACK_LIMIT) : "(no stack)";

  const body = [
    "**What were you doing when it broke?**",
    "_(a few words from you helps a lot)_",
    "",
    "---",
    "**App info**",
    `- Version: ${version}`,
    `- Platform: ${Platform.OS} ${Platform.Version}`,
    "",
    "**Error**",
    "```",
    error.message,
    "```",
    "",
    "**Stack**",
    "```",
    stack,
    "```",
  ].join("\n");

  const params = new URLSearchParams({
    title,
    body,
    labels: "bug,from-app",
  });
  return `${ISSUE_URL}?${params.toString()}`;
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingBottom: 32 },
  card: { borderCurve: "continuous" },
});
