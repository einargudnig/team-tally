/**
 * Learn more about Light and Dark modes:
 * https://docs.expo.io/guides/color-schemes/
 */

import {
  Pressable,
  Text as DefaultText,
  TextInput as DefaultTextInput,
  View as DefaultView,
} from "react-native";

import Colors from "@/constants/Colors";
import { useColorScheme } from "./useColorScheme";

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
  lightBorder?: string;
  darkBorder?: string;
};

export type TextProps = ThemeProps & DefaultText["props"];
export type ViewProps = ThemeProps & DefaultView["props"];
export type TextInputProps = ThemeProps & DefaultTextInput["props"];

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark,
) {
  const theme = useColorScheme() ?? "light";
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

export function Input(props: TextInputProps) {
  const {
    style,
    lightColor,
    darkColor,
    lightBorder,
    darkBorder,
    ...otherProps
  } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "ui3");
  const borderColor = useThemeColor(
    { light: lightBorder, dark: darkBorder },
    "ui3",
  );

  return (
    <DefaultTextInput
      placeholderTextColor={color}
      style={[{ color, borderColor }, style]}
      {...otherProps}
    />
  );
}

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "tx");

  return <DefaultText style={[{ color }, style]} {...otherProps} />;
}

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "background",
  );

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}

export function ButtonView(props: ViewProps) {
  const {
    style,
    lightColor,
    darkColor,
    lightBorder,
    darkBorder,
    ...otherProps
  } = props;
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "bg",
  );
  const borderColor = useThemeColor(
    { light: lightBorder, dark: darkBorder },
    "ui3",
  );

  return (
    <DefaultView
      style={[{ backgroundColor, borderColor }, style]}
      {...otherProps}
    />
  );
}

export function Button(props: any) {
  const {
    style,
    lightBorder,
    darkBorder,
    lightColor,
    darkColor,
    onPress,
    title,
  } = props;
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    "ui",
  );
  const borderColor = useThemeColor(
    { light: lightBorder, dark: darkBorder },
    "ui3",
  );

  return (
    <Pressable
      style={[{ backgroundColor, borderColor }, style]}
      onPress={onPress}
    >
      <Text>{title}</Text>
    </Pressable>
  );
}

export function IconButton(props: any) {
  const { onPress, children } = props;
  return <Pressable onPress={onPress}>{children}</Pressable>;
}
