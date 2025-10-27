import React, {
  useEffect,
  useMemo,
  useContext,
  useState,
  useCallback,
} from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { styles, colors } from "../stylesProfilePage";
import { AuthContext } from "../AuthContext";

// API imports
import { listUserPosts, API_BASE, getFollowCounts } from "../components/api";

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

  // Viewer state (stores direct URI instead of full post)
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerUri, setViewerUri] = useState(null);
  const [viewerLoading, setViewerLoading] = useState(true);

  // Build the image URL exactly like the grid uses
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
      // ignore silently for now
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
  }, [fetchPosts, fetchFollowCounts]);

  // Viewer
  const openViewer = (post) => {
    const uri = toImageUri(post);
    if (!uri) {
      console.warn("No image URI for post:", post);
      return;
    }
    setViewerUri(uri);
    setViewerLoading(true);
    setViewerOpen(true);
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setViewerUri(null);
    setViewerLoading(true);
  };

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
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(p, idx) => String(p.postid ?? idx)}
            numColumns={3}
            contentContainerStyle={styles.gridContainer}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.gridItem}
                activeOpacity={0.9}
                onPress={() => openViewer(item)}
              >
                <Image source={{ uri: toImageUri(item) }} style={styles.gridImage} />
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <Text style={{ textAlign: "center", paddingVertical: 24, color: colors.textDim }}>
                No posts yet
              </Text>
            }
          />
        )}
      </View>

      {/* Fullscreen Viewer Modal */}
      <Modal
        visible={viewerOpen}
        onRequestClose={closeViewer}
        animationType="fade"
        transparent
      >
        <View style={styles.viewerOverlay}>
          {/* Blur background at back */}
          <BlurView intensity={40} tint="dark" style={styles.viewerBlur} />

          {/* Close button */}
          <TouchableOpacity style={styles.viewerCloseBtn} onPress={closeViewer}>
            <Ionicons name="close" size={22} color={colors.text} />
          </TouchableOpacity>

          {/* Add image functionality here  */}
          {/* Image container */}
        <View style={styles.viewerCard}>
            {viewerUri ? (
              <>
                <Image
                  source={{ uri: viewerUri }}
                  style={styles.viewerImage}
                  onLoadEnd={() => setViewerLoading(false)}
                />
                {viewerLoading && (
                  <View style={styles.viewerLoading}>
                    <ActivityIndicator color={colors.accent} />
                  </View>
                )}
              </>
            ) : (
              <Text style={{ color: colors.textDim, padding: 12 }}>
                No image  
              </Text>
            )}
          </View>

          {/* Actions row (Like / Comment / Share) */}
          <View style={styles.viewerActions}>
            <TouchableOpacity style={styles.viewerIconBtn} activeOpacity={0.8}>
              <Ionicons name="heart-outline" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.viewerIconBtn} activeOpacity={0.8}>
              <Ionicons name="chatbubble-outline" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.viewerIconBtn} activeOpacity={0.8}>
              <Ionicons name="paper-plane-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
