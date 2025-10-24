import React, { useEffect, useMemo, useContext, useState, useCallback } from "react";
import { View, Text, Image, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { styles } from "../stylesProfilePage";
import { AuthContext } from "../AuthContext";

//API imports
import { listUserPosts, API_BASE } from "../components/api";
export default function ProfilePage() {
  const { logout, user: authUser } = useContext(AuthContext);
  const user = useMemo(
    () => ({
      username: authUser?.username,
      avatar: authUser?.avatar ?? "https://placehold.co/200x200/png",
      followers: authUser?.followers ?? 1287,
      following: authUser?.following ?? 342,
      postsCount: 0,
    }),
    [authUser]
  );

  const [imgs, setImgs] = useState([]);       // array of image URIs for the grid
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const toImageUri = (p) => {
    const datapath = p?.datapath || p?.dataPath || p?.path;
    if (!datapath) return null;
    const base = (API_BASE || "").replace(/\/$/, "");

    const rel = String(datapath).replace(/^\//, "");
    //console.log(`${base}/uploads/${rel}`);
    return `${base}/uploads/${rel}`;
  };
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const posts = await listUserPosts(user.username);
      // Filter to posts that actually have an image URL
      const uris = (posts || [])
        .map(toImageUri)
        .filter((u) => typeof u === "string" && u.length > 0);
      setImgs(uris);
    } catch (e) {
      console.error(e);
      Alert.alert("Couldn’t load posts", e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [user.username]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchPosts();
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
              <Text style={styles.statNumber}>{imgs.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statNumber}>{user.followers}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statBlock}>
              <Text style={styles.statNumber}>{user.following}</Text>
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
            data={imgs}
            keyExtractor={(uri, idx) => `${uri}-${idx}`}
            numColumns={3}
            contentContainerStyle={styles.gridContainer}
            renderItem={({ item }) => (
              <View style={styles.gridItem}>
                {/* Make sure gridImage has width: "100%" and aspectRatio: 1 in styles */}
                <Image source={{ uri: item }} style={styles.gridImage} />
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
