import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { styles, insta } from "../stylesNavbar";

export default function Navbar({ current, onChange }) {
  const size = 22;
  const activeColor = "#ffffff";
  const inactiveColor = insta.dim;

  const NavButton = ({ isActive, onPress, icon, iconActive }) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <LinearGradient
        colors={isActive ? insta.gradientColors : insta.gradientColorsFaint}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.ring, isActive && styles.ringActive]}
      >
        <View style={styles.ringInner}>
          <Ionicons
            name={isActive ? iconActive : icon}
            size={size}
            color={isActive ? activeColor : inactiveColor}
          />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <View style={styles.navbarWrap}>
      {/* Dark glossy/blurred background */}
      <BlurView intensity={35} tint="dark" style={styles.blur} />
      <View style={styles.overlay} />

      {/* Centered buttons */}
      <View style={styles.navbar}>
        <View style={styles.navButtons}>
          <NavButton
            isActive={current === "map"}
            onPress={() => onChange("map")}
            icon="map-outline"
            iconActive="map"
          />
          <NavButton
            isActive={current === "posts"}
            onPress={() => onChange("posts")}
            icon="grid-outline"
            iconActive="grid"
          />
          <NavButton
            isActive={current === "createPost"}
            onPress={() => onChange("createPost")}
            icon="create-outline"
            iconActive="create"
          />
          <NavButton
            isActive={current === "profile"}
            onPress={() => onChange("profile")}
            icon="person-circle-outline"
            iconActive="person-circle"
          />
        </View>
      </View>
    </View>
  );
}
