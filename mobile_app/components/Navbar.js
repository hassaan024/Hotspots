import React, { useContext } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { styles } from "../styles";
import { AuthContext } from "../AuthContext";

export default function Navbar({ current, onChange }) {
  const { logout } = useContext(AuthContext);

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

        <TouchableOpacity
          style={[styles.navBtn, { marginLeft: 8, backgroundColor: "red" }]}
          onPress={logout}
        >
          <Text style={styles.navBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
