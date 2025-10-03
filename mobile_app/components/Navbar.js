import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { styles } from "../styles";

export default function Navbar({ current, onChange }) {
  return (
    <View style={styles.navbar}>
      <Text style={styles.brand}>Hotspots</Text>

      <View style={styles.navButtons}>
        <TouchableOpacity
          style={[styles.navBtn, current === "map" && styles.navBtnActive]}
          onPress={() => onChange("map")}
        >
          <Text
            style={[
              styles.navBtnText,
              current === "map" && styles.navBtnTextActive,
            ]}
          >
            Map
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtn, current === "posts" && styles.navBtnActive]}
          onPress={() => onChange("posts")}
        >
          <Text
            style={[
              styles.navBtnText,
              current === "posts" && styles.navBtnTextActive,
            ]}
          >
            Posts
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
