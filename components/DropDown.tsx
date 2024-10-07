import { StyleSheet } from "react-native";
import RNPickerSelect from "react-native-picker-select";
import { View } from "./Themed";

export function Dropdown(data: any) {
  console.log({ data });

  const handleChanged = (value: string) => {
    console.log(value);
  };

  return (
    <View>
      <RNPickerSelect
        onValueChange={(value) => handleChanged(value)}
        items={data.data}
        key={data.key}
        style={pickerSelectStyles}
      />
    </View>
  );
}

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "gray",
    color: "black",
    paddingRight: 30, // to ensure the text is never behind the icon
    borderRadius: 8,
    width: 250,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: "purple",
    borderRadius: 8,
    color: "black",
    paddingRight: 30, // to ensure the text is never behind the icon
  },
});
