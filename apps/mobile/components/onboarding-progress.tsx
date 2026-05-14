import { View } from "react-native";

interface OnboardingProgressProps {
  step: 1 | 2 | 3 | 4;
}

export function OnboardingProgress({ step }: OnboardingProgressProps) {
  return (
    <View
      className="flex-row items-center justify-center gap-2"
      accessibilityLabel={`Step ${step} of 4`}
    >
      {[1, 2, 3, 4].map((n) => (
        <View
          key={n}
          className={`h-1.5 rounded-full ${
            n === step ? "w-6 bg-primary" : n < step ? "w-1.5 bg-primary/60" : "w-1.5 bg-border"
          }`}
        />
      ))}
    </View>
  );
}
