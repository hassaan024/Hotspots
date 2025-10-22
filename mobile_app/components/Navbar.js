import React, { useContext } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // Icon set
import { styles } from "../styles";
import { AuthContext } from "../AuthContext";

export default function Navbar({ current, onChange }) {
  // Uncomment if logout button needs to be used on this page
  // const { logout } = useContext(AuthContext);

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

        {/* Posts */}
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

        {/* Profile */}
        <TouchableOpacity
          style={[styles.navBtn, { marginLeft: 8,backgroundColor: "#f54254" }]}
          onPress={logout}
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

        {/* Logout removded from here*/}
        {/* <TouchableOpacity
          style={[
            styles.navBtn,
            { marginLeft: 8, backgroundColor: "#f54254" },
          ]}
          onPress={logout}
        >
          <Ionicons name="log-out-outline" size={size} color="#fff" />
        </TouchableOpacity> */}
      </View>
    </View>
  );
}
