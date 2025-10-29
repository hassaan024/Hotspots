// Fixed PostsPage: Better UI + Correct Upload Handling (images & videos)
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
} from "../components/api";
import { Ionicons, Feather } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const imageSize = width;

const isWeb = typeof window !== "undefined" && typeof document !== "undefined";

// lazy require for native video to avoid bundling issues on web
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

/** Normalize server paths to absolute URIs */
function toImageUri(datapath) {
  if (!datapath) return null;
  if (/^https?:\/\//i.test(datapath)) return datapath;
  if (datapath.startsWith("/")) return `${API_BASE}${datapath}`;
  const clean = datapath.replace(/^\.?\//, "");
  return `${API_BASE}/uploads/${clean}`;
}

/** Infer video either by posttype === 1 or common video extensions */
function inferIsVideo(item) {
  if (item?.posttype !== undefined && Number(item.posttype) === 1) return true;
  const p = String(item?.datapath || "").toLowerCase();
  return /\.(mp4|mov|m4v|webm|avi|mkv|3gp)$/.test(p);
}

/** Unified media renderer */
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
      >
        Your browser does not support the video tag.
      </video>
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

export default function PostsPage() {
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState({});
  const [likeCounts, setLikeCounts] = useState({});
  const [followStatus, setFollowStatus] = useState({});
  const [viewingPost, setViewingPost] = useState(null);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareTargetPost, setShareTargetPost] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [commentSending, setCommentSending] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await listPosts();
      setPosts(data);

      const counts = {};
      data.forEach((p) => (counts[p.postid] = p.likeCount || 0));
      setLikeCounts(counts);
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
    setLikedPosts((prev) => {
      const already = !!prev[postid];
      setLikeCounts((counts) => ({
        ...counts,
        [postid]: Math.max(0, (counts[postid] || 0) + (already ? -1 : 1)),
      }));
      return { ...prev, [postid]: !already };
    });
    const likedNow = !likedPosts[postid];
    await updateLikeStatus(postid, likedNow).catch(() => {});
  };

  const handleFollowToggle = (username) => {
    setFollowStatus((prev) => ({ ...prev, [username]: !prev[username] }));
  };

 const handleComment = async (postid) => {
   try {
     setCommentsLoading(true);
     const data = await getPostWithComments(postid); // GET /api/posts/:id/with-comments
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
      // server returns the created comment with fields { commentid, username, text, ... }
      const created = await addComment(viewingPost.postid, { body }); // POST /api/posts/:id/comments
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

  // Comment/Post detail view
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
          <Image
            source={{ uri: profilePic }}
            style={{ width: 38, height: 38, borderRadius: 19, marginHorizontal: 10, borderWidth: 1.5, borderColor: "#9CA3AF" }}
          />
          <Text style={{ color: "#E5E7EB", fontWeight: "bold" }}>@{viewingPost.postedby}</Text>
        </View>

        <View style={{ backgroundColor: "#0B1220" }}>
          <Media uri={mediaUri} poster={poster} isVideo={isVideo} size={width} />
        </View>

        <View style={{ paddingHorizontal: 14, marginTop: 8 }}>
          <Text style={{ color: "#E5E7EB" }}>
            <Text style={{ fontWeight: "bold" }}>@{viewingPost.postedby} </Text>
            {viewingPost.description}
          </Text>
        </View>

        <View style={{ paddingHorizontal: 14, marginTop: 18, marginBottom: 40 }}>
          <Text style={{ color: "#9CA3AF", fontWeight: "bold", marginBottom: 8 }}>Comments</Text>
          {viewingPost.comments?.length ? (
            viewingPost.comments.map((c) => (
              <Text key={c.commentid} style={{ color: "#E5E7EB", marginBottom: 6 }}>
                <Text style={{ fontWeight: "bold" }}>@{c.username} </Text>
                {c.text}
              </Text>
            ))
          ) : (
            <Text style={{ color: "#9CA3AF" }}>No comments yet.</Text>
          )}
                    {/* Commen maker */}
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

  // Main feed
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
                    <TouchableOpacity onPress={() => console.log(`Clicked on @${item.postedby}`)}>
                      <Text style={styles.username}>@{item.postedby}</Text>
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

                {/* Media (image or video) */}
                <View style={{ backgroundColor: "#0B1220" }}>
                  <Media uri={mediaUri} poster={poster} isVideo={isVideo} size={imageSize} />
                </View>

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

                {/* Likes + Caption */}
                <View style={{ paddingHorizontal: 14, paddingBottom: 10 }}>
                  <Text style={{ color: "#E5E7EB", marginBottom: 3, fontWeight: "600" }}>
                    {likeCounts[item.postid] || 0} likes
                  </Text>

                  {!!item.description && (
                    <Text style={{ color: "#E5E7EB", marginTop: 4 }}>
                      <Text style={{ fontWeight: "bold" }}>@{item.postedby} </Text>
                      {item.description}
                    </Text>
                  )}
                </View>
              </View>
            );
          }}
          keyExtractor={(item) => String(item.postid)}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor="#fff"
            />
          }
          ListEmptyComponent={
            <Text style={{ color: "#9CA3AF", textAlign: "center", marginTop: 24 }}>
              No posts yet.
            </Text>
          }
        />
      )}

      {/* Share Modal */}
      <Modal
        animationType="slide"
        transparent={true}
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
