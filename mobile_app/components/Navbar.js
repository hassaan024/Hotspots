// Navbar.js
import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { styles, ig } from "../stylesNavbar";

export default function Navbar({ current, onChange }) {
  const size = 24;
  const activeColor = "#fff";
  const inactiveColor = "#9ca3af";

  return (
    <View style={styles.navbarWrap}>
      {/* Gradient top border */}
      <LinearGradient colors={ig.gradient} style={styles.navbarGradient} />

      {/* Navbar background */}
      <View style={styles.navbar}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => onChange("map")}
        >
          <Ionicons
            name={current === "map" ? "map" : "map-outline"}
            size={size}
            color={current === "map" ? activeColor : inactiveColor}
          />
        </TouchableOpacity>

        {/* NEW: Search */}
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => onChange("search")}
        >
          <Ionicons
            name={current === "search" ? "search" : "search-outline"}
            size={size + 2}
            color={current === "search" ? activeColor : inactiveColor}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => onChange("posts")}
        >
          <Ionicons
            name={current === "posts" ? "grid" : "grid-outline"}
            size={size}
            color={current === "posts" ? activeColor : inactiveColor}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => onChange("createPost")}
        >
          <Ionicons
            name={current === "createPost" ? "create" : "create-outline"}
            size={size}
            color={current === "createPost" ? activeColor : inactiveColor}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => onChange("profile")}
        >
          <Ionicons
            name={
              current === "profile"
                ? "person-circle"
                : "person-circle-outline"
            }
            size={size + 2}
            color={current === "profile" ? activeColor : inactiveColor}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}