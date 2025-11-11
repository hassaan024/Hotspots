import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../AuthContext";
import { styles, colors } from "../stylesProfilePage";
import {
  listUserPosts,
  API_BASE,
  getFollowCounts,
  updateLikeStatus,
  getPostWithComments,
} from "../components/api";

export default function UserProfilePage({ route, navigation }) {
  const { username } = route.params; // username passed from navigation
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!username) return;
    fetchUserData();
  }, [username]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const postsData = await listUserPosts(username);
      const counts = await getFollowCounts(username);
      setPosts(postsData);
      setFollowCounts(counts);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load user data.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  };

  const toggleLike = async (postId) => {
    try {
      const updated = await updateLikeStatus(postId, user?.username);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likes: updated.likes } : p))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const renderPost = ({ item }) => (
    <View style={styles.postCard}>
      {item.media && (
        <Image
          source={{ uri: `${API_BASE}/${item.media}` }}
          style={styles.postImage}
        />
      )}
      <Text style={styles.caption}>{item.caption}</Text>
      <View style={styles.postFooter}>
        <TouchableOpacity onPress={() => toggleLike(item.id)}>
          <Ionicons
            name="heart"
            size={22}
            color={item.likes?.includes(user?.username) ? "red" : "gray"}
          />
        </TouchableOpacity>
        <Text style={{ marginLeft: 5 }}>{item.likes?.length || 0}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <Text style={styles.username}>@{username}</Text>
          <View style={styles.followRow}>
            <Text style={styles.followText}>
              {followCounts.followers} Followers
            </Text>
            <Text style={styles.followText}>
              {followCounts.following} Following
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.postList}
        ListEmptyComponent={
          <Text style={styles.noPosts}>No posts yet.</Text>
        }
      />
    </ScrollView>
  );
}
