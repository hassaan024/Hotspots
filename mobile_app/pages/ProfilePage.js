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

<<<<<<< Updated upstream
/** unified media renderer */
const Media = ({ uri, isVideo, poster, size }) => {
const [ar, setAr] = React.useState(1); // aspect ratio = width/height

// when it's an IMAGE, measure it once and set ar
React.useEffect(() => {
  if (!isVideo && uri) {
    Image.getSize(uri, (w, h) => { if (w && h) setAr(w / h); }, () => {});
=======
// Modified Media to accept and report aspect ratio upward
const Media = ({ uri, isVideo, poster, size, onAspectRatio }) => {
  const [ar, setAr] = React.useState(1);
  const [muted, setMuted] = React.useState(true);
  const webVideoRef = React.useRef(null);
  const nativeVideoRef = React.useRef(null);

  // derive aspect ratio for images
  React.useEffect(() => {
    if (!isVideo && uri) {
      Image.getSize(
        uri,
        (w, h) => {
          if (w && h) {
            setAr(w / h);
            if (onAspectRatio) onAspectRatio(w / h);
          }
        },
        () => {}
      );
    }
  }, [uri, isVideo]);

  // For video: report aspect ratio upward when it changes
  React.useEffect(() => {
    if (onAspectRatio && ar) {
      onAspectRatio(ar);
    }
    // Only call when ar changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ar]);

  // WEB: unmute and ensure playback on first user interaction
  const handleWebClick = () => {
    try {
      setMuted(false);
      const v = webVideoRef.current;
      if (v && v.play) v.play().catch(() => {});
    } catch {}
  };

  // NATIVE: unmute and ensure playback on tap
  const handleNativePress = async () => {
    try {
      setMuted(false);
      const v = nativeVideoRef.current;
      if (v?.setStatusAsync) {
        await v.setStatusAsync({
          shouldPlay: true,
          isMuted: false,
          volume: 1.0,
        });
      }
    } catch {}
  };

  if (!isVideo) {
    return (
      <Image
        source={{ uri }}
        style={{ width: "100%", height: "100%", resizeMode: "cover" }}
      />
    );
>>>>>>> Stashed changes
  }
}, [uri, isVideo]);

<<<<<<< Updated upstream
// when it's a VIDEO (native), grab natural size from onLoad
const onVideoLoad = (status) => {
  const ns = status?.naturalSize;
  const w = ns?.width, h = ns?.height;
  if (w && h) setAr(w / h);
=======
  if (isWeb) {
    return (
      <video
        ref={webVideoRef}
        src={uri}
        poster={poster || undefined}
        playsInline
        autoPlay
        muted={muted}
        loop
        controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
        onLoadedData={() => {
          try {
            // Try to get video dimensions for aspect ratio
            const v = webVideoRef.current;
            if (v && v.videoWidth && v.videoHeight) {
              const ratio = v.videoWidth / v.videoHeight;
              setAr(ratio);
              if (onAspectRatio) onAspectRatio(ratio);
            }
            if (v && v.play) v.play().catch(() => {});
          } catch {}
        }}
        onClick={handleWebClick}
        style={{ width: "100%", height: "100%", display: "block", objectFit: "cover", cursor: "pointer" }}
      >
        Your browser does not support the video tag.
      </video>
    );
  }

  return VideoComp ? (
    <TouchableOpacity activeOpacity={1} onPress={handleNativePress}>
      <VideoComp
        ref={nativeVideoRef}
        source={{ uri }}
        style={{ width: "100%", height: "100%" }}
        resizeMode="cover"
        posterSource={poster ? { uri: poster } : undefined}
        onLoad={({ naturalSize }) => {
          const w = naturalSize?.width, h = naturalSize?.height;
          if (w && h) {
            setAr(w / h);
            if (onAspectRatio) onAspectRatio(w / h);
          }
        }}
        useNativeControls={false}
        shouldPlay
        isLooping
        isMuted={muted}
        volume={muted ? 0.0 : 1.0}
      />
    </TouchableOpacity>
  ) : null;
>>>>>>> Stashed changes
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

  // Aspect ratio state for modal video
  const [modalVideoAR, setModalVideoAR] = useState(null);

  return (
<<<<<<< Updated upstream
    <View style={styles.screen}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
          <View style={styles.headerStats}>
            <View style={styles.statBlock}>
              <Text style={styles.statNumber}>{posts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
=======
    <View style={{ flex: 1, alignItems: "center", backgroundColor: "#000" }}>
    <View style={{ width: "100%", maxWidth: 640, flex: 1, backgroundColor: "#0B1220" }}>
      {/* header */}
      <View
        style={{
          backgroundColor: "#0B1220",
          borderRadius: 14,
          marginTop: 24,
          marginBottom: 18,
          paddingHorizontal: 18,
          paddingVertical: 18,
          width: "100%",
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 8,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image
            source={{ uri: user.avatar }}
            style={{
              width: 74,
              height: 74,
              borderRadius: 37,
              marginRight: 16,
              borderWidth: 2,
              borderColor: "#181F32",
              backgroundColor: "#181F32",
            }}
          />
          <View style={{ flex: 1, flexDirection: "row", justifyContent: "space-between" }}>
            <View style={{ alignItems: "center" }}>
              <Text style={{ color: "#E5E7EB", fontWeight: "bold", fontSize: 18 }}>{posts.length}</Text>
              <Text style={{ color: "#E5E7EB", fontSize: 13, opacity: 0.75, marginTop: 2 }}>Posts</Text>
>>>>>>> Stashed changes
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ color: "#E5E7EB", fontWeight: "bold", fontSize: 18 }}>{followerCount}</Text>
              <Text style={{ color: "#E5E7EB", fontSize: 13, opacity: 0.75, marginTop: 2 }}>Followers</Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Text style={{ color: "#E5E7EB", fontWeight: "bold", fontSize: 18 }}>{followingCount}</Text>
              <Text style={{ color: "#E5E7EB", fontSize: 13, opacity: 0.75, marginTop: 2 }}>Following</Text>
            </View>
          </View>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 16 }}>
          <Text
            style={{
              color: "#E5E7EB",
              fontWeight: "bold",
              fontSize: 17,
              flex: 1,
            }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {user.username}
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: "#181F32",
              borderRadius: 8,
              paddingHorizontal: 16,
              paddingVertical: 7,
              marginLeft: 10,
            }}
            onPress={logout}
          >
            <Text style={{ color: "#E5E7EB", fontWeight: "bold" }}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

<<<<<<< Updated upstream
      {/* Grid Card */}
      <View style={styles.gridCard}>
=======
      {/* grid */}
      <View
        style={{
          backgroundColor: "#0B1220",
          borderRadius: 14,
          paddingVertical: 8,
          paddingHorizontal: 0,
          width: "100%",
          flex: 1,
        }}
      >
>>>>>>> Stashed changes
        {loading ? (
          <View style={{ paddingVertical: 32 }}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(p, idx) => String(p.postid ?? idx)}
            numColumns={3}
<<<<<<< Updated upstream
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
=======
            contentContainerStyle={{
              paddingHorizontal: 4,
              paddingBottom: 40,
              minHeight: 160,
              gap: 0,
            }}
            columnWrapperStyle={{
              gap: 8,
              marginBottom: 8,
            }}
            renderItem={({ item }) => {
              const isVideo = isVideoPost(item);
              const thumb = getThumbPath(item);
              const gridUri = isVideo
                ? thumb
                  ? toAbsUri(thumb)
                  : toAbsUri(item.datapath)
                : toAbsUri(item.datapath);
              return (
                <TouchableOpacity
                  style={{
                    flex: 1,
                    aspectRatio: 4 / 5,
                    margin: 0,
                    borderRadius: 6,
                    overflow: "hidden",
                    backgroundColor: "#181F32",
                  }}
                  activeOpacity={0.92}
                  onPress={() => openViewer(item)}
                >
                  <Image
                    source={{ uri: gridUri }}
                    style={{
                      width: "100%",
                      height: "100%",
                      aspectRatio: 4 / 5,
                      resizeMode: "cover",
                      borderRadius: 6,
                      backgroundColor: "#181F32",
                    }}
                  />
                </TouchableOpacity>
              );
            }}
>>>>>>> Stashed changes
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
<<<<<<< Updated upstream
              <Text style={{ textAlign: "center", paddingVertical: 24, color: colors.textDim }}>
=======
              <Text
                style={{
                  textAlign: "center",
                  paddingVertical: 32,
                  color: colors.textDim,
                  fontSize: 16,
                }}
              >
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
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
=======
        <View
          style={{
            flex: 1,
            backgroundColor: "#000",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 10,
          }}
        >
          <TouchableOpacity
            onPress={closeViewer}
            style={{
              position: "absolute",
              top: 32,
              right: 22,
              zIndex: 20,
              backgroundColor: "rgba(0,0,0,0.5)",
              width: 34,
              height: 34,
              borderRadius: 17,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>

          {activePost ? (
            <View
              style={{
                width: "100%",
                maxWidth: modalMaxWidth,
                backgroundColor: "#0B1220",
                borderRadius: 14,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.03)",
                maxHeight: "92%",
              }}
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* header */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 14,
                    paddingTop: 12,
                    paddingBottom: 8,
                  }}
                >
                  <Image
                    source={{
                      uri: toAbsUri(
                        activePost.profilepic ||
                          "https://cdn-icons-png.flaticon.com/512/847/847969.png"
                      ),
                    }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      marginRight: 10,
                    }}
                  />
                  <Text
                    style={{
                      color: "#E5E7EB",
                      fontWeight: "bold",
                      fontSize: 15,
                    }}
                  >
                    @{activePost.postedby}
                  </Text>
                </View>

                {/* media */}
                <View
                  style={{
                    backgroundColor: "#0B1220",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    paddingVertical: 0,
                  }}
                >
                  {/* Choose aspect ratio based on media type */}
                  {isVideoPost(activePost) ? (
                    <View
                    style={{
                      width: "100%",
                      aspectRatio:
                        modalVideoAR && modalVideoAR > 1 ? 1 : (modalVideoAR || 9 / 16),
                      borderRadius: 8,
                      overflow: "hidden",
                      backgroundColor: "#181F32",
                      alignSelf: "center",
                      marginBottom: 0,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                      <Media
                        uri={toAbsUri(activePost.datapath)}
                        isVideo={true}
                        poster={getPoster(activePost)}
                        size={modalMaxWidth}
                        onAspectRatio={setModalVideoAR}
                      />
                    </View>
                  ) : (
                    <View
                      style={{
                        width: "100%",
                        aspectRatio: 4 / 5,
                        borderRadius: 8,
                        overflow: "hidden",
                        backgroundColor: "#181F32",
                        alignSelf: "center",
                        marginBottom: 0,
                        overflow: "hidden",
                        alignItems: "center",
                        justifyContent: "center", 
                      }}
                    >
                      <Image
                        source={{ uri: toAbsUri(activePost.datapath) }}
                        style={{
                          width: "100%",
                          height: "100%",
                          aspectRatio: 4 / 5,
                          resizeMode: "cover",
                          borderRadius: 8,
                          backgroundColor: "#181F32",
                        }}
                      />
                    </View>
                  )}
                </View>

                {/* actions */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 16,
                    paddingHorizontal: 14,
                    paddingTop: 10,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => toggleLike(activePost.postid)}
                    style={{ paddingVertical: 3 }}
                  >
                    <Ionicons
                      name={
                        likedPosts[activePost.postid]
                          ? "heart"
                          : "heart-outline"
                      }
                      size={26}
                      color={
                        likedPosts[activePost.postid]
                          ? "#F87171"
                          : "#E5E7EB"
                      }
                    />
                  </TouchableOpacity>

                  {/* comments toggle */}
                  <TouchableOpacity
                    onPress={() =>
                      setViewerCommentsOpen((v) => !v)
                    }
                    style={{ paddingVertical: 3 }}
                  >
                    <Ionicons
                      name={
                        viewerCommentsOpen
                          ? "chatbubble"
                          : "chatbubble-outline"
                      }
                      size={24}
                      color="#E5E7EB"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity style={{ paddingVertical: 3 }}>
                    <Ionicons
                      name="paper-plane-outline"
                      size={23}
                      color="#E5E7EB"
                    />
                  </TouchableOpacity>
                </View>

                {/* likes + desc */}
                <View style={{ paddingHorizontal: 14, paddingTop: 6 }}>
                  <Text
                    style={{
                      color: "#E5E7EB",
                      fontWeight: "600",
                      marginBottom: 4,
                    }}
                  >
                    {likeCounts[activePost.postid] || 0} likes
                  </Text>
                  <Text style={{ color: "#E5E7EB", marginTop: 2 }}>
                    <Text style={{ fontWeight: "bold" }}>
                      @{activePost.postedby}{" "}
                    </Text>
                    {String(
                      activePost.description ||
                        activePost.caption ||
                        activePost.text ||
                        ""
                    ).trim() || "(no description)"}
                  </Text>
                </View>

                {/* comments (conditional) */}
                {viewerCommentsOpen ? (
                  <View
                    style={{
                      paddingHorizontal: 14,
                      paddingTop: 10,
                      paddingBottom: 10,
                    }}
                  >
                    {activePost.comments?.length ? (
                      activePost.comments.map((c) => (
                        <Text
                          key={String(c.commentid)}
                          style={{ color: "#E5E7EB", marginBottom: 5 }}
                        >
                          <Text style={{ fontWeight: "bold" }}>
                            @{c.username}{" "}
                          </Text>
                          {c.text}
                        </Text>
                      ))
                    ) : (
                      <Text style={{ color: "rgba(229,231,235,0.45)" }}>
                        No comments yet.
                      </Text>
                    )}

                    {/* add comment */}
                    <View
                      style={{
                        flexDirection: "row",
                        marginTop: 10,
                        gap: 8,
                      }}
                    >
                      <TextInput
                        value={commentText}
                        onChangeText={setCommentText}
                        placeholder="Add a comment…"
                        placeholderTextColor="rgba(229,231,235,0.4)"
                        style={{
                          flex: 1,
                          backgroundColor: "rgba(0,0,0,0.25)",
                          borderWidth: 1,
                          borderColor: "rgba(229,231,235,0.05)",
                          borderRadius: 10,
                          paddingHorizontal: 10,
                          color: "#fff",
                        }}
                        onSubmitEditing={sendViewerComment}
                        editable={!commentSending}
                      />
                      <TouchableOpacity
                        onPress={sendViewerComment}
                        disabled={commentSending || !commentText.trim()}
                        style={{
                          backgroundColor:
                            commentSending || !commentText.trim()
                              ? "#374151"
                              : "#2563EB",
                          paddingHorizontal: 14,
                          justifyContent: "center",
                          borderRadius: 10,
                        }}
                      >
                        <Text style={{ color: "#fff", fontWeight: "bold" }}>
                          {commentSending ? "…" : "Send"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}
              </ScrollView>
            </View>
          ) : (
            <Text style={{ color: "#fff" }}>Loading…</Text>
          )}
>>>>>>> Stashed changes
        </View>
      </Modal>
      </View>
    </View>
);
}
