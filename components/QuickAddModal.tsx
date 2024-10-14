import { Modal, Pressable, StyleSheet } from "react-native";
import { Colors } from "react-native/Libraries/NewAppScreen";
import { View, Text } from "./Themed";

type QuickAddModalProps = {
  title: string;
  visible: boolean;
  setState: () => void;
};

export function QuickAddModal({
  title,
  visible,
  setState,
}: QuickAddModalProps) {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => {
        setState();
      }}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text lightColor={Colors.light.tx} darkColor={Colors.dark.tx}>
            {title} modal open!
          </Text>
          <Pressable onPress={() => setState()}>
            <View
              style={styles.button}
              lightColor={Colors.light.ui}
              darkColor={Colors.dark.ui}
            >
              <Text lightColor={Colors.light.tx} darkColor={Colors.dark.tx}>
                Close Modal
              </Text>
            </View>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: "Colors.dark.bg",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  smallContainer: {
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    display: "flex",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  secondaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 10,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
  button: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderWidth: 2,
    borderRadius: 10,
    fontSize: 30,
    fontWeight: "bold",
    marginVertical: 30,
  },
  dropdownContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
});
