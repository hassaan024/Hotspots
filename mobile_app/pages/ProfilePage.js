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
import { Dimensions, Platform } from "react-native";
const { width } = Dimensions.get("window");

const isWeb = typeof window !== "undefined" && typeof document !== "undefined";
let VideoComp = null;            // lazy for native
try { VideoComp = require("expo-av").Video; } catch {}

function injectNoControlsCSS() {
  if (typeof document === "undefined") return;
  if (document.getElementById("no-media-controls")) return;
  const style = document.createElement("style");
  style.id = "no-media-controls";
  style.textContent = `
    video::-webkit-media-controls-enclosure { display: none !important; }
    video::-webkit-media-controls { display: none !important; }
  `;
  document.head.appendChild(style);
}

/** absolute-URI builder that mirrors your /uploads layout */
/** Normalize any path/URL to an absolute URI without double-prefixing */
function toAbsUri(path) {
  if (!path) return null;
  const s = String(path);
  if (/^https?:\/\//i.test(s)) return s;             // already absolute
  const base = (API_BASE || "").replace(/\/$/, "");
  if (s.startsWith("/")) return `${base}${s}`;        // server-style absolute
  // default: treat as relative under /uploads
  return `${base}/uploads/${s.replace(/^\.?\//, "")}`;
}

/** Is this post a video? (posttype or extension) */
function isVideoPost(p) {
  if (p?.posttype !== undefined && Number(p.posttype) === 1) return true;
  const name = String(p?.datapath || "").toLowerCase();
  return /\.(mp4|mov|m4v|webm|avi|mkv|3gp)$/.test(name);
}

/** Get the best thumbnail field, handling name variants from the API */
function getThumbPath(p) {
  // check common keys in priority order
  const k = p?.thumbpath ?? p?.thumbPath ?? p?.thumbnail ?? p?.poster;
  return k ? String(k) : null;
}


/** poster to use in grid & viewer */
function getPoster(p) {
  if (p?.thumbpath) return toAbsUri(p.thumbpath);
  if (!isVideoPost(p)) return toAbsUri(p?.datapath); // image post: use itself
  return null; // video with no thumb available
}

/** unified media renderer */
const Media = ({ uri, isVideo, poster, size }) => {
const [ar, setAr] = React.useState(1); // aspect ratio = width/height

// when it's an IMAGE, measure it once and set ar
React.useEffect(() => {
  if (!isVideo && uri) {
    Image.getSize(uri, (w, h) => { if (w && h) setAr(w / h); }, () => {});
  }
}, [uri, isVideo]);

// when it's a VIDEO (native), grab natural size from onLoad
const onVideoLoad = (status) => {
  const ns = status?.naturalSize;
  const w = ns?.width, h = ns?.height;
  if (w && h) setAr(w / h);
};

// IMAGE render (width fixed, height derived by aspectRatio)
if (!isVideo) {
  return (
    <Image
      source={{ uri }}
      style={{ width: size, aspectRatio: ar, resizeMode: "contain" }} // ⬅️ no fixed height
    />
  );
}

// WEB VIDEO (let the browser compute height)
if (isWeb) {
  return (
    <video
      src={uri}
      poster={poster || undefined}
      playsInline
      autoPlay
      muted
      loop
      controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
      disablePictureInPicture
      onContextMenu={(e) => e.preventDefault()}
      style={{ width: size, height: "auto", display: "block", objectFit: "cover" }}
    >
      Your browser does not support the video tag.
    </video>
  );
}

// NATIVE VIDEO (expo-av) – compute height from ar after onLoad
return VideoComp ? (
  <VideoComp
    source={{ uri }}
    style={{ width: size, height: size / ar }}
    resizeMode="cover"
    posterSource={poster ? { uri: poster } : undefined}
    onLoad={({ naturalSize }) => {
      const w = naturalSize?.width, h = naturalSize?.height;
      if (w && h) setAr(w / h);
    }}
    useNativeControls={false}
    shouldPlay
    isLooping
    isMuted
  />
) : null;
};



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
const [viewerPoster,  setViewerPoster]  = useState(null);
const [viewerIsVideo, setViewerIsVideo] = useState(false);
const [viewerLoading, setViewerLoading] = useState(true);


  // Build the image URL exactly like the grid uses
// Build the media URL from post object (image or video)
const postToUri = (p) => {
  const path = Number(p?.posttype) === 1 ? (p?.datapath) : p?.datapath;
  return toAbsUri(path);
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
    injectNoControlsCSS();
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
  const isVid = isVideoPost(post);
  const mediaUri = toAbsUri(post?.datapath);          // play the real media
  if (!mediaUri) return;

  const posterPath = getThumbPath(post);
  setViewerUri(mediaUri);
  setViewerIsVideo(isVid);
  setViewerPoster(posterPath ? toAbsUri(posterPath) : null);
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
renderItem={({ item }) => {
  const isVideo = isVideoPost(item);
  const thumb = getThumbPath(item);
  const gridUri = isVideo
    ? (thumb ? toAbsUri(thumb) : toAbsUri(item.datapath)) // prefer thumb for video
    : toAbsUri(item.datapath);                            // images use their own path
  return (
    <TouchableOpacity
      style={styles.gridItem}
      activeOpacity={0.9}
      onPress={() => openViewer(item)}
    >
      <Image source={{ uri: gridUri }} style={styles.gridImage} />
    </TouchableOpacity>
  );
}}
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
    <Media uri={viewerUri} isVideo={viewerIsVideo} poster={viewerPoster} size={Dimensions.get("window").width} />
  ) : (
    <Text style={{ color: colors.textDim, padding: 12 }}>No media</Text>
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
