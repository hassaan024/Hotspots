// PostsPage: Instagram-like feed with comment preview
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
} from "react-native";
import { styles } from "../styles";
import {
  listPosts,
  API_BASE,
  getPostWithComments,
  updateLikeStatus,
  addComment,
  setFollow,
} from "../components/api";
import { Ionicons, Feather } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const imageSize = width;
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

function toImageUri(datapath) {
  if (!datapath) return null;
  if (/^https?:\/\//i.test(datapath)) return datapath;
  if (datapath.startsWith("/")) return `${API_BASE}${datapath}`;
  const clean = datapath.replace(/^\.?\//, "");
  return `${API_BASE}/uploads/${clean}`;
}

function inferIsVideo(item) {
  if (item?.posttype !== undefined && Number(item.posttype) === 1) return true;
  const p = String(item?.datapath || "").toLowerCase();
  return /\.(mp4|mov|m4v|webm|avi|mkv|3gp)$/.test(p);
}

const Media = ({ uri, poster, isVideo, size }) => {
  if (!isVideo) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, resizeMode: "cover" }}
      />
    );
  }
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
        style={{ width: size, height: size, display: "block", objectFit: "contain" }}
      />
    );
  }
  return VideoComp ? (
    <VideoComp
      source={{ uri }}
      style={{ width: size, height: size }}
      resizeMode="contain"
      posterSource={poster ? { uri: poster } : undefined}
      useNativeControls={false}
      shouldPlay
      isLooping
      isMuted
    />
  ) : null;
};

export default function PostsPage({ navigation }) {
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState({});
  const [likeCounts, setLikeCounts] = useState({});
  const [followStatus, setFollowStatus] = useState({});
  const [viewingPost, setViewingPost] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [commentSending, setCommentSending] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareTargetPost, setShareTargetPost] = useState(null);

  // Load feed + comment previews
  const load = useCallback(async () => {
    try {
      const data = await listPosts();

      // Get 1–2 comment previews for each post
      const postsWithPreview = await Promise.all(
        data.map(async (p) => {
          try {
            const full = await getPostWithComments(p.postid);
            return {
              ...p,
              previewComments: full.comments?.slice(0, 2) || [],
              commentCount: full.comments?.length || 0,
            };
          } catch {
            return { ...p, previewComments: [], commentCount: 0 };
          }
        })
      );

      setPosts(postsWithPreview);

      const counts = {};
      data.forEach((p) => (counts[p.postid] = p.likeCount || 0));
      setLikeCounts(counts);

      const liked = {};
      data.forEach((p) => (liked[p.postid] = !!p.isLiked));
      setLikedPosts(liked);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    injectNoControlsCSS();
    load();
  }, [load]);

  const toggleLike = async (postid) => {
    const prevLiked = !!likedPosts[postid];
    const nextLiked = !prevLiked;

    setLikedPosts((prev) => ({ ...prev, [postid]: nextLiked }));
    setLikeCounts((counts) => ({
      ...counts,
      [postid]: Math.max(0, (counts[postid] || 0) + (nextLiked ? 1 : -1)),
    }));

    try {
      const res = await updateLikeStatus(postid, nextLiked);
      setLikedPosts((prev) => ({ ...prev, [postid]: !!res.liked }));
      setLikeCounts((counts) => ({
        ...counts,
        [postid]: res.likeCount ?? counts[postid],
      }));
    } catch (err) {
      console.error("like toggle failed:", err);
      setLikedPosts((prev) => ({ ...prev, [postid]: prevLiked }));
    }
  };

  const handleFollowToggle = async (username) => {
    const prev = !!followStatus[username];
    const next = !prev;
    setFollowStatus((p) => ({ ...p, [username]: next }));
    try {
      await setFollow(username, next);
    } catch (e) {
      console.error(e);
      setFollowStatus((p) => ({ ...p, [username]: prev }));
    }
  };

  const handleComment = async (postid) => {
    try {
      setCommentsLoading(true);
      const data = await getPostWithComments(postid);
      setViewingPost(data);
    } catch (error) {
      console.error("Error loading comments:", error);
      alert(`Couldn't load comments: ${String(error?.message || error)}`);
    } finally {
      setCommentsLoading(false);
    }
  };

  const sendComment = async () => {
    const body = commentText.trim();
    if (!body) return;
    try {
      setCommentSending(true);
      const created = await addComment(viewingPost.postid, { body });
      setViewingPost((v) => ({ ...v, comments: [...(v?.comments || []), created] }));
      setCommentText("");
    } catch (e) {
      console.error(e);
      alert(`Failed to comment: ${String(e?.message || e)}`);
    } finally {
      setCommentSending(false);
    }
  };

  const goBackToFeed = () => setViewingPost(null);

  // === Comment/Post detail ===
  if (viewingPost) {
    const isVideo = inferIsVideo(viewingPost);
    const mediaUri = toImageUri(viewingPost.datapath);
    const poster = viewingPost.thumbpath ? toImageUri(viewingPost.thumbpath) : undefined;
    const profilePic =
      viewingPost.profilepic && viewingPost.profilepic !== ""
        ? toImageUri(viewingPost.profilepic)
        : "https://cdn-icons-png.flaticon.com/512/847/847969.png";

    return (
      <ScrollView style={[styles.app, { paddingTop: 10 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10 }}>
          <TouchableOpacity onPress={goBackToFeed}>
            <Ionicons name="arrow-back" size={26} color="#E5E7EB" />
          </TouchableOpacity>
          <Image source={{ uri: profilePic }} style={{ width: 38, height: 38, borderRadius: 19, marginHorizontal: 10 }} />
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("UserProfilePage", { username: viewingPost.postedby })
            }
          >
            <Text style={{ color: "#3B82F6", fontWeight: "bold" }}>@{viewingPost.postedby}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ backgroundColor: "#0B1220" }}>
          <Media uri={mediaUri} poster={poster} isVideo={isVideo} size={width} />
        </View>

        <View style={{ paddingHorizontal: 14, marginTop: 8 }}>
          <Text style={{ color: "#E5E7EB" }}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("UserProfilePage", { username: viewingPost.postedby })
              }
            >
              <Text style={{ color: "#3B82F6", fontWeight: "bold" }}>@{viewingPost.postedby} </Text>
            </TouchableOpacity>
            {viewingPost.description}
          </Text>
        </View>

        <View style={{ paddingHorizontal: 14, marginTop: 18, marginBottom: 40 }}>
          <Text style={{ color: "#9CA3AF", fontWeight: "bold", marginBottom: 8 }}>Comments</Text>
          {viewingPost.comments?.length ? (
            viewingPost.comments.map((c) => (
              <Text key={c.commentid} style={{ color: "#E5E7EB", marginBottom: 6 }}>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("UserProfilePage", { username: c.username })
                  }
                >
                  <Text style={{ color: "#3B82F6", fontWeight: "bold" }}>@{c.username} </Text>
                </TouchableOpacity>
                {c.text}
              </Text>
            ))
          ) : (
            <Text style={{ color: "#9CA3AF" }}>No comments yet.</Text>
          )}

          {/* Comment input */}
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12, gap: 8 }}>
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Add a comment…"
              placeholderTextColor="#9CA3AF"
              onSubmitEditing={sendComment}
              editable={!commentSending}
              style={{
                flex: 1,
                color: "#E5E7EB",
                backgroundColor: "#0B1220",
                borderColor: "#1F2937",
                borderWidth: 1,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            />
            <TouchableOpacity
              onPress={sendComment}
              disabled={commentSending || !commentText.trim()}
              style={{
                backgroundColor: commentSending || !commentText.trim() ? "#374151" : "#2563EB",
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 10,
              }}
            >
              <Text style={{ color: "#E5E7EB", fontWeight: "bold" }}>
                {commentSending ? "Sending…" : "Send"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  // === Feed ===
  return (
    <View style={[styles.app, { paddingTop: 10 }]}>
      {loading ? (
        <ActivityIndicator size="large" color="#60A5FA" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={posts}
          renderItem={({ item }) => {
            const profilePic =
              item.profilepic && item.profilepic !== ""
                ? toImageUri(item.profilepic)
                : "https://cdn-icons-png.flaticon.com/512/847/847969.png";

            const isVideo = inferIsVideo(item);
            const mediaUri = toImageUri(item.datapath);
            const poster = item.thumbpath ? toImageUri(item.thumbpath) : undefined;
            const isLiked = !!likedPosts[item.postid];
            const isFollowing = !!followStatus[item.postedby];

            return (
              <View
                style={{
                  backgroundColor: "#121821",
                  marginBottom: 20,
                  borderBottomWidth: 0.5,
                  borderBottomColor: "#1F2937",
                }}
              >
                {/* Header */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Image
                      source={{ uri: profilePic }}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        marginRight: 10,
                        borderWidth: 1.5,
                        borderColor: "#9CA3AF",
                      }}
                    />
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() =>
                        navigation.navigate("UserProfilePage", { username: item.postedby })
                      }
                    >
                      <Text style={{ color: "#3B82F6", fontWeight: "bold" }}>
                        @{item.postedby}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleFollowToggle(item.postedby)}
                    style={{
                      backgroundColor: "#1F2937",
                      paddingVertical: 5,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: "#E5E7EB", fontWeight: "bold" }}>
                      {isFollowing ? "Unfollow" : "Follow"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Media */}
                <Media uri={mediaUri} poster={poster} isVideo={isVideo} size={imageSize} />

                {/* Actions */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                  }}
                >
                  <TouchableOpacity onPress={() => toggleLike(item.postid)}>
                    <Ionicons
                      name={isLiked ? "heart" : "heart-outline"}
                      size={26}
                      color={isLiked ? "#F87171" : "#E5E7EB"}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => handleComment(item.postid)}>
                    <Feather name="message-circle" size={24} color="#E5E7EB" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setShareTargetPost(item);
                      setShareModalVisible(true);
                    }}
                  >
                    <Feather name="send" size={22} color="#E5E7EB" />
                  </TouchableOpacity>
                </View>

                {/* Likes + Caption + Comments Preview */}
                <View style={{ paddingHorizontal: 14, paddingBottom: 10 }}>
                  <Text style={{ color: "#E5E7EB", fontWeight: "600", marginBottom: 3 }}>
                    {likeCounts[item.postid] || 0} likes
                  </Text>

                  {!!item.description && (
                    <Text style={{ color: "#E5E7EB", marginTop: 6 }}>
                      <TouchableOpacity
                        onPress={() =>
                          navigation.navigate("UserProfilePage", { username: item.postedby })
                        }
                      >
                        <Text style={{ color: "#3B82F6", fontWeight: "bold" }}>
                          @{item.postedby}{" "}
                        </Text>
                      </TouchableOpacity>
                      {item.description}
                    </Text>
                  )}

                  {/* View all comments */}
                  {item.commentCount > 0 && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleComment(item.postid)}
                    >
                      <Text
                        style={{
                          color: "rgba(229,231,235,0.6)",
                          marginTop: 6,
                          marginBottom: 4,
                        }}
                      >
                        View all {item.commentCount} comments
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* 1–2 comments */}
                  {item.previewComments?.slice(0, 2).map((c) => (
                    <Text
                      key={c.commentid}
                      style={{ color: "rgba(229,231,235,0.85)", marginBottom: 2 }}
                    >
                      <TouchableOpacity
                        onPress={() =>
                          navigation.navigate("UserProfilePage", { username: c.username })
                        }
                      >
                        <Text style={{ color: "#3B82F6", fontWeight: "bold" }}>
                          @{c.username}{" "}
                        </Text>
                      </TouchableOpacity>
                      {c.text}
                    </Text>
                  ))}
                </View>
              </View>
            );
          }}
          keyExtractor={(item) => String(item.postid)}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={load} tintColor="#fff" />
          }
        />
      )}

      {/* Share Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={shareModalVisible}
        onRequestClose={() => setShareModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
          }}
        >
          <View
            style={{
              backgroundColor: "#1F2937",
              borderRadius: 12,
              padding: 20,
              width: "80%",
              maxHeight: "60%",
            }}
          >
            <Text
              style={{
                color: "#E5E7EB",
                fontSize: 18,
                fontWeight: "bold",
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              Share Post
            </Text>

            {["dylan", "journey", "hassaan", "fariza"].map((user) => (
              <TouchableOpacity
                key={user}
                style={{
                  paddingVertical: 10,
                  borderBottomWidth: 0.5,
                  borderBottomColor: "#374151",
                }}
                onPress={() => {
                  console.log(`Shared post ${shareTargetPost?.postid} with ${user}`);
                  setShareModalVisible(false);
                }}
              >
                <Text style={{ color: "#E5E7EB", fontSize: 16 }}>@{user}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={() => setShareModalVisible(false)}
              style={{
                marginTop: 20,
                alignSelf: "center",
                backgroundColor: "#374151",
                paddingHorizontal: 24,
                paddingVertical: 10,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#E5E7EB" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
