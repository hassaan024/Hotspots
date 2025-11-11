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
    <View style={[styles.navbarWrap, {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 80,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 100,
    }]}>
      <LinearGradient
        colors={ig.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          right: 0,
          borderTopRightRadius: 14,
          borderBottomRightRadius: 14,
          padding: 2,
        }}
      >
        <View style={{
          flex: 1,
          backgroundColor: "rgba(11, 18, 32, 0.9)",
          borderTopRightRadius: 14,
          borderBottomRightRadius: 14,
          justifyContent: "space-around",
          alignItems: "center",
          height: "60%",
          paddingVertical: 40,
        }}>
          <TouchableOpacity
            style={[styles.navBtn, { marginVertical: 10 }]}
            onPress={() => onChange("map")}
          >
            <Ionicons
              name={current === "map" ? "map" : "map-outline"}
              size={size}
              color={current === "map" ? activeColor : inactiveColor}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navBtn, { marginVertical: 10 }]}
            onPress={() => onChange("posts")}
          >
            <Ionicons
              name={current === "posts" ? "grid" : "grid-outline"}
              size={size}
              color={current === "posts" ? activeColor : inactiveColor}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navBtn, { marginVertical: 10 }]}
            onPress={() => onChange("createPost")}
          >
            <Ionicons
              name={current === "createPost" ? "create" : "create-outline"}
              size={size}
              color={current === "createPost" ? activeColor : inactiveColor}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navBtn, { marginVertical: 10 }]}
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
      </LinearGradient>
    </View>
  );
}
