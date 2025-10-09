import React, { useState } from "react";
import { View, Text, Image, FlatList, Dimensions, StyleSheet, ActivityIndicator } from "react-native";
import { styles as appStyles } from "../styles";

const { width } = Dimensions.get("window");

// Dummy "shared by users" data
const allPosts = [
  { id: "1", username: "fifaworldcup", text: "World Cup 2026", image: require("../images/fifa.jpeg") },
  { id: "2", username: "charlie_19", text: "7pm in nola", image: require("../images/nola.jpeg") },
  { id: "3", username: "emma_23", text: "harry potter szn:)", image: require("../images/xmas.jpeg") },
  { id: "4", username: "alex2978", text: "NY🗽", image: require("../images/nyc.jpeg") },
  { id: "5", username: "latechcoes", text: "Welcome Bulldogs", image: require("../images/tech.jpeg") },
  { id: "6", username: "ballondorofficial", text: "Bravo Ousmane Dembélé!", image: require("../images/ballondor.jpeg") },
];

export default function PostsPage() {
  const [posts, setPosts] = useState(allPosts.slice(0, 3)); // show first 3
  const [loading, setLoading] = useState(false);

  // Load more when scrolled to bottom
  const loadMorePosts = () => {
    if (loading) return;
    setLoading(true);

    // Simulate API delay
    setTimeout(() => {
      const currentLength = posts.length;
      const nextPosts = allPosts.slice(currentLength, currentLength + 3);
      if (nextPosts.length > 0) {
        setPosts([...posts, ...nextPosts]);
      }
      setLoading(false);
    }, 1000);
  };

  const renderItem = ({ item }) => (
    <View style={localStyles.postCard}>
      <Text style={localStyles.username}>@{item.username}</Text>

      <Image source={item.image} style={localStyles.postImage} resizeMode="cover" />

      <Text style={localStyles.caption}>
        <Text style={localStyles.bold}>{item.username} </Text>
        {item.text}
      </Text>
    </View>
  );

  return (
    <View style={[appStyles.screen, { backgroundColor: appStyles.app.backgroundColor }]}>
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
        onEndReached={loadMorePosts}          // 👈 triggers at scroll bottom
        onEndReachedThreshold={0.5}           // 👈 when 50% near bottom
        ListFooterComponent={
          loading ? <ActivityIndicator size="large" color="#60A5FA" style={{ margin: 20 }} /> : null
        }
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
  postCard: {
    marginBottom: 20,
    backgroundColor: "#121821",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1F2937",
  },
  username: {
    color: "#E5E7EB",
    fontWeight: "bold",
    fontSize: 16,
    padding: 10,
  },
  postImage: {
    width: "100%",
    height: width, // square layout like Instagram
  },
  caption: {
    color: "#E5E7EB",
    padding: 10,
    fontSize: 14,
  },
  bold: {
    fontWeight: "bold",
    color: "#E5E7EB",
  },
});
