import { useMemo } from "react";
import { View, Text } from "react-native";

interface PlayerAvatarProps {
  name: string;
  size?: number;
}

export function PlayerAvatar({ name, size = 40 }: PlayerAvatarProps) {
  const letter = name.charAt(0).toUpperCase();
  const styles = useMemo(
    () => ({
      container: { width: size, height: size, borderCurve: "continuous" as const },
      text: { fontSize: size * 0.4 },
    }),
    [size]
  );

  return (
    <View
      className="items-center justify-center rounded-full bg-primary-muted"
      style={styles.container}
    >
      <Text className="font-semibold text-primary" style={styles.text}>
        {letter}
      </Text>
    </View>
  );
}
