import React from "react";
import { View, Text } from "react-native";
import { styles } from "../styles";

export default function PostsPage() {
  return (
    <View style={styles.screen}>
      <Text style={styles.screenTitle}>Posts</Text>
      <Text style={styles.screenSub}>No posts yet</Text>
    </View>
  );
}
