import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // Icon set
import { styles } from "../styles";

export default function Navbar({ current, onChange }) {
  const size = 22;
  const activeColor = "#ffffff";
  const inactiveColor = "#9aa0a6";

  return (
    <View style={styles.navbar}>
      <Text style={styles.brand}>Hotspots</Text>

      <View style={styles.navButtons}>
        {/* Map */}
        <TouchableOpacity
          style={[styles.navBtn, current === "map" && styles.navBtnActive]}
          onPress={() => onChange("map")}
        >
          <Ionicons
            name={current === "map" ? "map" : "map-outline"}
            size={size}
            color={current === "map" ? activeColor : inactiveColor}
          />
        </TouchableOpacity>

        {/* Posts (feed) */}
        <TouchableOpacity
          style={[styles.navBtn, current === "posts" && styles.navBtnActive]}
          onPress={() => onChange("posts")}
        >
          <Ionicons
            name={current === "posts" ? "grid" : "grid-outline"}
            size={size}
            color={current === "posts" ? activeColor : inactiveColor}
          />
        </TouchableOpacity>

        {/* Create Post */}
        <TouchableOpacity
          style={[styles.navBtn, current === "createPost" && styles.navBtnActive]}
          onPress={() => onChange("createPost")}
        >
          <Ionicons
            name={current === "createPost" ? "create" : "create-outline"}
            size={size}
            color={current === "createPost" ? activeColor : inactiveColor}
          />
        </TouchableOpacity>

        {/* Profile */}
        <TouchableOpacity
          style={[styles.navBtn, current === "profile" && styles.navBtnActive]}
          onPress={() => onChange("profile")}
        >
          <Ionicons
            name={
              current === "profile" ? "person-circle" : "person-circle-outline"
            }
            size={size + 2}
            color={current === "profile" ? activeColor : inactiveColor}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
