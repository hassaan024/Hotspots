import React from "react";
import { View, Text } from "react-native";
import { styles } from "../styles";

export default function MapPage() {
  return (
    <View style={styles.screen}>
      <Text style={styles.screenTitle}>Map</Text>
      <Text style={styles.screenSub}>Add map here</Text>
    </View>
  );
}
