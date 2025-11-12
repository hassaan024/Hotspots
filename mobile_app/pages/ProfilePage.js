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
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles, colors } from "../stylesProfilePage";
import { AuthContext } from "../AuthContext";

// API imports
import {
  listUserPosts,
  API_BASE,
  getFollowCounts,
  getPostWithComments,
  updateLikeStatus,
  addComment,
} from "../components/api";
import { Dimensions } from "react-native";

const { width } = Dimensions.get("window");
const isWeb = typeof window !== "undefined" && typeof document !== "undefined";
let VideoComp = null;
try {
  VideoComp = require("expo-av").Video;
} catch {}

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

function toAbsUri(path) {
  if (!path) return null;
  const s = String(path);
  if (/^https?:\/\//i.test(s)) return s;
  const base = (API_BASE || "").replace(/\/$/, "");
  if (s.startsWith("/")) return `${base}${s}`;
  return `${base}/uploads/${s.replace(/^\.?\//, "")}`;
}

function isVideoPost(p) {
  if (p?.posttype !== undefined && Number(p.posttype) === 1) return true;
  const name = String(p?.datapath || "").toLowerCase();
  return /\.(mp4|mov|m4v|webm|avi|mkv|3gp)$/.test(name);
}

function getThumbPath(p) {
  const k = p?.thumbpath ?? p?.thumbPath ?? p?.thumbnail ?? p?.poster;
  return k ? String(k) : null;
}

function getPoster(p) {
  if (p?.thumbpath) return toAbsUri(p.thumbpath);
  if (!isVideoPost(p)) return toAbsUri(p?.datapath);
  return null;
}

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
  }

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
};
export default function ProfilePage({ route }) {
const { logout, user: authUser } = useContext(AuthContext);
const viewedUsername = route?.params?.username ?? authUser?.username;
const isSelf = viewedUsername === authUser?.username;
  const user = useMemo(
    () => ({
      username: viewedUsername,
      // If you're not storing other users' avatars yet, keep a safe default.
      avatar: isSelf ? (authUser?.avatar ?? "https://placehold.co/200x200/png")
                     : "https://placehold.co/200x200/png",
      postsCount: 0,
    }),
    [authUser, viewedUsername, isSelf]
  );

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  // viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activePost, setActivePost] = useState(null);
  const [likedPosts, setLikedPosts] = useState({});
  const [likeCounts, setLikeCounts] = useState({});
  const [commentText, setCommentText] = useState("");
  const [commentSending, setCommentSending] = useState(false);

  // NEW: comments toggle
  const [viewerCommentsOpen, setViewerCommentsOpen] = useState(false);

  // NEW: width for the modal so your media can scale
  const modalMaxWidth = Math.min(width - 32, 520);

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

  const openViewer = async (post) => {
    try {
      const full = await getPostWithComments(post.postid);
      setActivePost(full);

      setLikedPosts((prev) => ({
        ...prev,
        [full.postid]: !!full.isLiked,
      }));
      setLikeCounts((prev) => ({
        ...prev,
        [full.postid]: full.likeCount || 0,
      }));

      // close comments when opening
      setViewerCommentsOpen(false);

      setViewerOpen(true);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Couldn't load post.");
    }
  };

  const toggleLike = async (postid) => {
    const prevLiked = !!likedPosts[postid];
    const nextLiked = !prevLiked;

    setLikedPosts((p) => ({ ...p, [postid]: nextLiked }));
    setLikeCounts((counts) => ({
      ...counts,
      [postid]: Math.max(0, (counts[postid] || 0) + (nextLiked ? 1 : -1)),
    }));

    try {
      const res = await updateLikeStatus(postid, nextLiked);
      setLikedPosts((p) => ({ ...p, [postid]: !!res.liked }));
      setLikeCounts((counts) => ({
        ...counts,
        [postid]: res.likeCount ?? counts[postid],
      }));
    } catch (e) {
      console.error(e);
      setLikedPosts((p) => ({ ...p, [postid]: prevLiked }));
      setLikeCounts((counts) => ({
        ...counts,
        [postid]: Math.max(0, (counts[postid] || 0) + (prevLiked ? 1 : -1)),
      }));
    }
  };

  const sendViewerComment = async () => {
    const body = commentText.trim();
    if (!body || !activePost) return;
    try {
      setCommentSending(true);
      const created = await addComment(activePost.postid, { body });
      setActivePost((p) => ({
        ...p,
        comments: [...(p?.comments || []), created],
      }));
      setCommentText("");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to comment");
    } finally {
      setCommentSending(false);
    }
  };

  const closeViewer = () => {
    setViewerOpen(false);
  };

  // Aspect ratio state for modal video
  const [modalVideoAR, setModalVideoAR] = useState(null);

  return (
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
 {isSelf ? (
   <TouchableOpacity
     style={{ backgroundColor: "#181F32", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 7, marginLeft: 10 }}
     onPress={logout}
   >
     <Text style={{ color: "#E5E7EB", fontWeight: "bold" }}>Logout</Text>
   </TouchableOpacity>
 ) : null}
        </View>
      </View>

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
        {loading ? (
          <View style={{ paddingVertical: 32 }}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(p, idx) => String(p.postid ?? idx)}
            numColumns={3}
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
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <Text
                style={{
                  textAlign: "center",
                  paddingVertical: 32,
                  color: colors.textDim,
                  fontSize: 16,
                }}
              >
                No posts yet
              </Text>
            }
          />
        )}
      </View>

      {/* viewer modal */}
      <Modal
        visible={viewerOpen}
        onRequestClose={closeViewer}
        animationType="fade"
        transparent
      >
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
        </View>
      </Modal>
      </View>
    </View>
);
}
