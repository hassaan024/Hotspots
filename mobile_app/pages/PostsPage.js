import React, { useState } from "react";
import { View, Text, Image, StyleSheet, Dimensions, FlatList, Button } from "react-native";

const { height, width } = Dimensions.get("window");

// Full dummy data (could be replaced with API later)
const allPosts = [
  { username: "john.doe", text: "Hello world!", image: "https://via.placeholder.com/400x600" },
  { username: "charlie_19", text: "Today is Thursday", image: "https://via.placeholder.com/400x600" },
  { username: "latechcoes", text: "Louisiana Tech", image: "https://via.placeholder.com/400x600" },
  { username: "emma_23", text: "Nature vibes", image: "https://via.placeholder.com/400x600" },
  { username: "alex99", text: "City lights", image: "https://via.placeholder.com/400x600" },
  { username: "luna_star", text: "Ocean view", image: "https://via.placeholder.com/400x600" },
  { username: "max_power", text: "Sunset", image: "https://via.placeholder.com/400x600" },
  { username: "nina_k", text: "Coffee time", image: "https://via.placeholder.com/400x600" },
];

export default function PostPage() {
  const [posts, setPosts] = useState(allPosts.slice(0, 3)); // initial 3 posts
  const [loading, setLoading] = useState(false);

  // Function to load more posts
  const loadMorePosts = () => {
    if (loading) return;
    setLoading(true);

    // Simulate network/API delay
    setTimeout(() => {
      const currentLength = posts.length;
      const nextPosts = allPosts.slice(currentLength, currentLength + 3); // load next 3
      setPosts([...posts, ...nextPosts]);
      setLoading(false);
    }, 1000);
  };

  const renderItem = ({ item }) => (
    <View style={[styles.postWrapper, { height }]}>
      <Text style={styles.username}>@{item.username}</Text>
      <View style={styles.postBox}>
        <Image source={{ uri: item.image }} style={styles.image} />
      </View>
      <Text style={styles.text}>
        <Text style={styles.boldUsername}>{item.username} </Text>
        {item.text}
      </Text>
    </View>
  );

  return (
    <FlatList
      data={posts}
      renderItem={renderItem}
      keyExtractor={(item, index) => index.toString()}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      snapToAlignment="start"
      decelerationRate="fast"
      onEndReached={loadMorePosts}          // load more when near bottom
      onEndReachedThreshold={0.5}          // triggers at 50% from bottom
      ListFooterComponent={loading && <Text style={{ color: "white", textAlign: "center" }}>Loading...</Text>}
    />
  );
}

const styles = StyleSheet.create({
  postWrapper: {
    width,
    backgroundColor: "#0B1D51",
    padding: 10,
  },
  postBox: {
    backgroundColor: "#102B57",
    borderRadius: 10,
    overflow: "hidden",
    marginVertical: 10,
  },
  username: {
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 5,
    marginLeft: 5,
  },
  text: {
    color: "#fff",
    marginLeft: 5,
  },
  boldUsername: {
    fontWeight: "bold",
    color: "#fff",
  },
  image: {
    width: "100%",
    height: height * 0.6,
    resizeMode: "cover",
  },
});
 

