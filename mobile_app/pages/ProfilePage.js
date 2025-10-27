import React, { useEffect, useMemo, useContext, useState, useCallback } from "react";
import { View, Text, Image, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { styles } from "../stylesProfilePage";
import { AuthContext } from "../AuthContext";

//API imports
import { listUserPosts, API_BASE , getFollowCounts } from "../components/api";
export default function ProfilePage() {
  const { logout, user: authUser } = useContext(AuthContext);
  const user = useMemo(
    () => ({
      username: authUser?.username,
      avatar: authUser?.avatar ?? "https://placehold.co/200x200/png",
      postsCount: 0,
    }),
    [authUser]
  );

    const [posts, setPosts] = useState([]);
      const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

const toImageUri = (p) => {
  const path =
    Number(p?.posttype) === 1 ? (p?.thumbpath || p?.datapath) : p?.datapath;
  if (!path) return null;
  const base = (API_BASE || "").replace(/\/$/, "");
  const rel = String(path).replace(/^\//, "");
  return `${base}/uploads/${rel}`;
};
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
           const arr = await listUserPosts(user.username);
           setPosts(arr || []);
    } catch (e) {
      console.error(e);
      Alert.alert("Couldn’t load posts", e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [user.username]);
    const fetchFollowCounts = useCallback(async () => {
      try {
        const { followers, following } = await getFollowCounts(user.username);
        setFollowerCount(followers);
        setFollowingCount(following);
      } catch (e) {
        console.error(e);
        // Silently ignore or show a small toast if you have one
      }
    }, [user.username]);

  useEffect(() => {
    fetchPosts();
    fetchFollowCounts();
  }, [fetchPosts, fetchFollowCounts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchPosts(), fetchFollowCounts()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchPosts]);

  return (
    <View style={styles.screen}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
          <View style={styles.headerStats}>
            <View style={styles.statBlock}>
              <Text style={styles.statNumber}>{posts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statNumber}>{followerCount}</Text>
              <Text style={styles.statLabel}>Followers</Text>

            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statNumber}>{followingCount}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>
        </View>

        <View style={styles.nameRow}>
          <Text style={styles.username}>{user.username}</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Grid Card */}
      <View style={styles.gridCard}>
        {loading ? (
          <View style={{ paddingVertical: 24 }}>
            <ActivityIndicator />
          </View>
        ) : (

     <FlatList
       data={posts}
       keyExtractor={(p, idx) => String(p.postid ?? idx)}
            numColumns={3}
            contentContainerStyle={styles.gridContainer}
            renderItem={({ item }) => (
              <View style={styles.gridItem}>
                {/* Make sure gridImage has width: "100%" and aspectRatio: 1 in styles */}
               <Image source={{ uri: toImageUri(item) }} style={styles.gridImage} />
              </View>
            )}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <Text style={{ textAlign: "center", paddingVertical: 24 }}>
                No posts yet
              </Text>
            }
          />
        )}
      </View>
    </View>
  );
}
