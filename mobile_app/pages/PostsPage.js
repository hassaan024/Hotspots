// PostsPage.js — clickable usernames + hydrated follow state + Following filter + comment previews
import React, { useEffect, useState, useCallback, useMemo, useContext } from "react";
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
import ProfilePage from "./ProfilePage";
import {
  listPosts,
  API_BASE,
  getPostWithComments,
  updateLikeStatus,
  addComment,
  setFollow,
  listFollowing,        // <-- NEW: hydrate follow map
} from "../components/api";
import { AuthContext } from "../AuthContext";  // <-- NEW: to get current user
import { Ionicons, Feather } from "@expo/vector-icons";

const FEED_MAX_WIDTH = 640;
const { width } = Dimensions.get("window");
const isWeb = typeof window !== "undefined" && typeof document !== "undefined";

// lazy require for native video
let VideoComp = null;
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

/** Normalize server paths to absolute URIs */
function toImageUri(datapath) {
  if (!datapath) return null;
  if (/^https?:\/\//i.test(datapath)) return datapath;
  if (datapath.startsWith("/")) return `${API_BASE}${datapath}`;
  const clean = datapath.replace(/^\.?\//, "");
  return `${API_BASE}/uploads/${clean}`;
}

/** Infer video by posttype or extension */
function inferIsVideo(item) {
  if (item?.posttype !== undefined && Number(item.posttype) === 1) return true;
  const p = String(item?.datapath || "").toLowerCase();
  return /\.(mp4|mov|m4v|webm|avi|mkv|3gp)$/.test(p);
}

/** Unified media renderer */
const Media = ({ uri, poster, isVideo }) => {
  if (!isVideo) {
    return <Image source={{ uri }} style={{ width: "100%", height: "100%", resizeMode: "cover" }} />;
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
        style={{ width: "100%", height: "100%", display: "block", objectFit: "cover", backgroundColor: "#000" }}
      />
    );
  }
  return VideoComp ? (
    <VideoComp
      source={{ uri }}
      style={{ width: "100%", height: "100%" }}
      resizeMode="cover"
      posterSource={poster ? { uri: poster } : undefined}
      useNativeControls={false}
      shouldPlay
      isLooping
      isMuted
    />
  ) : null;
};

/** Make @handles inside any text clickable */
function renderTextWithHandles(text, onOpenProfile, baseStyle = {}, handleStyle = {}) {
  if (!text) return null;
  const str = String(text);
  const parts = [];
  const regex = /@([a-zA-Z0-9_]+)/g;
  let lastIndex = 0;
  let m;
  let key = 0;
  while ((m = regex.exec(str)) !== null) {
    const start = m.index;
    const end = regex.lastIndex;
    const before = str.slice(lastIndex, start);
    if (before) parts.push(<Text key={`t-${key++}`} style={baseStyle}>{before}</Text>);
    const uname = m[1];
    parts.push(
      <Text
        key={`h-${key++}`}
        style={[{ fontWeight: "bold", color: "#E5E7EB" }, handleStyle]}
        onPress={() => onOpenProfile(uname)}
      >
        @{uname}
      </Text>
    );
    lastIndex = end;
  }
  const tail = str.slice(lastIndex);
  if (tail) parts.push(<Text key={`t-${key++}`} style={baseStyle}>{tail}</Text>);
  return parts;
}

/** Lightweight per-card preview of first two comments (lazy, cached). */
function CommentPreview({ postid, onOpenProfile }) {
  const [loaded, setLoaded] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const full = await getPostWithComments(postid);
        if (cancelled) return;
        const arr = Array.isArray(full?.comments) ? full.comments.slice(0, 2) : [];
        setItems(arr);
      } catch {
        setItems([]);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [postid]);

  if (!loaded || items.length === 0) return null;

  return (
    <View style={{ paddingHorizontal: 14, paddingTop: 6, paddingBottom: 8, gap: 4 }}>
      {items.map((c) => (
        <Text key={String(c.commentid)} style={{ color: "#E5E7EB" }}>
          <Text style={{ fontWeight: "bold" }} onPress={() => onOpenProfile(c.username)}>
            @{c.username}{" "}
          </Text>
          {renderTextWithHandles(
            c.text,
            onOpenProfile,
            { color: "#E5E7EB" },
            { color: "#E5E7EB", fontWeight: "bold" }
          )}
        </Text>
      ))}
      <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginTop: 4 }} />
    </View>
  );
}

/** PARENT: swaps between feed and profile, so we don't need a navigator */
export default function PostsPage() {
  const [viewUser, setViewUser] = useState(null); // null = show feed
  return viewUser ? (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <TouchableOpacity onPress={() => setViewUser(null)} style={{ padding: 12, alignSelf: "flex-start" }}>
        <Text style={{ color: "#E5E7EB" }}>← Back</Text>
      </TouchableOpacity>
      <ProfilePage route={{ params: { username: viewUser } }} />
    </View>
  ) : (
    <FeedView onOpenProfile={setViewUser} />
  );
}

/** CHILD: original feed/detail logic (safe for hooks) */
function FeedView({ onOpenProfile }) {
  const { user: authUser } = useContext(AuthContext); // <-- to know who “I” am
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [likedPosts, setLikedPosts] = useState({});
  const [likeCounts, setLikeCounts] = useState({});

  // follow state by username (single source of truth for the feed)
  const [followStatus, setFollowStatus] = useState({});
  const [followingHydrated, setFollowingHydrated] = useState(false); // <-- track hydration

  // filter toggle
  const [showFollowingOnly, setShowFollowingOnly] = useState(false);

  const [viewingPost, setViewingPost] = useState(null);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareTargetPost, setShareTargetPost] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [commentSending, setCommentSending] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const loadPosts = useCallback(async () => {
    const data = await listPosts();
    setPosts(data || []);
    const counts = {};
    const liked = {};
    (data || []).forEach((p) => {
      counts[p.postid] = p.likeCount || 0;
      liked[p.postid] = !!p.isLiked;
    });
    setLikeCounts(counts);
    setLikedPosts(liked);
  }, []);

  const hydrateFollowing = useCallback(async () => {
    // If no logged-in user yet, mark as hydrated (avoid blocking UI)
    if (!authUser?.username) {
      setFollowingHydrated(true);
      return;
    }
    try {
      const arr = await listFollowing(authUser.username); // [{ followee, followedAt }, ...]
      const map = {};
      (arr || []).forEach((it) => {
        const uname = it?.followee ?? it?.username ?? it?.user ?? null;
        if (uname) map[String(uname)] = true;
      });
      setFollowStatus(map);
    } catch (e) {
      console.error("listFollowing failed:", e);
      // keep previous map; user can still toggle
    } finally {
      setFollowingHydrated(true);
    }
  }, [authUser?.username]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setFollowingHydrated(false);
    try {
      await Promise.all([loadPosts(), hydrateFollowing()]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadPosts, hydrateFollowing]);

  useEffect(() => {
    injectNoControlsCSS();
    loadAll();
  }, [loadAll]);

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
        [postid]:
          res.likeCount ??
          (nextLiked ? (counts[postid] || 0) : Math.max(0, (counts[postid] || 1) - 1)),
      }));
    } catch (err) {
      console.error("like toggle failed:", err);
      setLikedPosts((prev) => ({ ...prev, [postid]: prevLiked }));
      setLikeCounts((counts) => ({
        ...counts,
        [postid]: Math.max(0, (counts[postid] || 0) + (prevLiked ? 1 : -1)),
      }));
    }
  };

  // follow toggle: optimistic by username; rollback on error; keeps all that user’s cards in sync
  const handleFollowToggle = async (username) => {
    if (!username) return;
    const prev = !!followStatus[username];
    const next = !prev;

    setFollowStatus((p) => ({ ...p, [username]: next }));
    try {
      await setFollow(username, next);
      // Optional: you could re-hydrate here, but it’s not necessary
    } catch (e) {
      console.error(e);
      setFollowStatus((p) => ({ ...p, [username]: prev })); // rollback
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

  // filtered list for Following tab (uses hydrated followStatus)
  const filteredPosts = useMemo(() => {
    if (!showFollowingOnly) return posts;
    return (posts || []).filter((p) => !!followStatus[p.postedby]);
  }, [posts, showFollowingOnly, followStatus]);

  // ===== Post detail view =====
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
          <TouchableOpacity onPress={() => onOpenProfile(viewingPost.postedby)}>
            <Image
              source={{ uri: profilePic }}
              style={{ width: 38, height: 38, borderRadius: 19, marginHorizontal: 10, borderWidth: 1.5, borderColor: "#9CA3AF" }}
            />
          </TouchableOpacity>
          <Text style={{ color: "#E5E7EB", fontWeight: "bold" }} onPress={() => onOpenProfile(viewingPost.postedby)}>
            @{viewingPost.postedby}
          </Text>
        </View>

        <View style={{ backgroundColor: "#0B1220" }}>
          <Media uri={mediaUri} poster={poster} isVideo={isVideo} />
        </View>

        <View style={{ paddingHorizontal: 14, marginTop: 8 }}>
          <Text style={{ color: "#E5E7EB" }}>
            <Text style={{ fontWeight: "bold" }} onPress={() => onOpenProfile(viewingPost.postedby)}>
              @{viewingPost.postedby}{" "}
            </Text>
            {renderTextWithHandles(
              viewingPost.description,
              onOpenProfile,
              { color: "#E5E7EB" },
              { color: "#E5E7EB", fontWeight: "bold" }
            )}
          </Text>
        </View>

        <View style={{ paddingHorizontal: 14, marginTop: 18, marginBottom: 40 }}>
          <Text style={{ color: "#9CA3AF", fontWeight: "bold", marginBottom: 8 }}>Comments</Text>
          {viewingPost.comments?.length ? (
            viewingPost.comments.map((c) => (
              <Text key={c.commentid} style={{ color: "#E5E7EB", marginBottom: 6 }}>
                <Text style={{ fontWeight: "bold" }} onPress={() => onOpenProfile(c.username)}>
                  @{c.username}{" "}
                </Text>
                {renderTextWithHandles(c.text, onOpenProfile, { color: "#E5E7EB" }, { color: "#E5E7EB", fontWeight: "bold" })}
              </Text>
            ))
          ) : (
            <Text style={{ color: "#9CA3AF" }}>No comments yet.</Text>
          )}

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
              <Text style={{ color: "#E5E7EB", fontWeight: "bold" }}>{commentSending ? "Sending…" : "Send"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  // ===== Main feed =====
  const isFilteringAndNotReady = showFollowingOnly && !followingHydrated;

  return (
    <View style={{ flex: 1, alignItems: "center", backgroundColor: "#000" }}>
      <View style={{ width: "100%", maxWidth: FEED_MAX_WIDTH, alignSelf: "center", flex: 1, backgroundColor: "#0B1220", borderRadius: 14 }}>
        {/* Filter toggle */}
        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 10 }}>
          <View style={{ flexDirection: "row", backgroundColor: "#111827", borderRadius: 10, padding: 4, gap: 4 }}>
            <TouchableOpacity
              onPress={() => setShowFollowingOnly(false)}
              style={{
                paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8,
                backgroundColor: showFollowingOnly ? "transparent" : "#2563EB",
              }}
            >
              <Text style={{ color: showFollowingOnly ? "#E5E7EB" : "#fff", fontWeight: "bold" }}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowFollowingOnly(true)}
              style={{
                paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8,
                backgroundColor: showFollowingOnly ? "#2563EB" : "transparent",
              }}
            >
              <Text style={{ color: showFollowingOnly ? "#fff" : "#E5E7EB", fontWeight: "bold" }}>Following</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading || isFilteringAndNotReady ? (
          <ActivityIndicator size="large" color="#60A5FA" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filteredPosts}
            keyExtractor={(item) => String(item.postid)}
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
                  {/* Header: avatar + username clickable */}
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
                      <TouchableOpacity onPress={() => onOpenProfile(item.postedby)}>
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
                      </TouchableOpacity>
                      <Text style={styles.username} onPress={() => onOpenProfile(item.postedby)}>
                        @{item.postedby}
                      </Text>
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
                  <View
                    style={{
                      width: "100%",
                      aspectRatio: 4 / 5,
                      backgroundColor: "#000",
                      borderRadius: 8,
                      overflow: "hidden",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Media uri={mediaUri} poster={poster} isVideo={isVideo} />
                  </View>

                  {/* Actions */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 14, paddingVertical: 10 }}>
                    <TouchableOpacity onPress={() => toggleLike(item.postid)}>
                      <Ionicons name={isLiked ? "heart" : "heart-outline"} size={26} color={isLiked ? "#F87171" : "#E5E7EB"} />
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
                  <View style={{ paddingHorizontal: 14, paddingBottom: 6 }}>
                    <Text style={{ color: "#E5E7EB", marginBottom: 3, fontWeight: "600" }}>
                      {likeCounts[item.postid] || 0} likes
                    </Text>

                    {!!item.description && (
                      <Text style={{ color: "#E5E7EB", marginTop: 6, fontSize: 15, lineHeight: 20 }}>
                        <Text style={{ color: "#E5E7EB", fontWeight: "bold" }} onPress={() => onOpenProfile(item.postedby)}>
                          @{item.postedby}{" "}
                        </Text>
                        {renderTextWithHandles(item.description, onOpenProfile, { color: "#E5E7EB" }, { color: "#E5E7EB", fontWeight: "bold" })}
                      </Text>
                    )}
                  </View>

                  {/* First two comment previews */}
                  <CommentPreview postid={item.postid} onOpenProfile={onOpenProfile} />
                </View>
              );
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  loadAll(); // refresh posts + following map together
                }}
                tintColor="#fff"
              />
            }
            ListEmptyComponent={
              <Text style={{ color: "#9CA3AF", textAlign: "center", marginTop: 24 }}>
                {showFollowingOnly ? "No posts from people you follow yet." : "No posts yet."}
              </Text>
            }
          />
        )}
      </View>

      {/* Share Modal */}
      <Modal animationType="slide" transparent={true} visible={shareModalVisible} onRequestClose={() => setShareModalVisible(false)}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.7)" }}>
          <View style={{ backgroundColor: "#1F2937", borderRadius: 12, padding: 20, width: "80%", maxHeight: "60%" }}>
            <Text style={{ color: "#E5E7EB", fontSize: 18, fontWeight: "bold", marginBottom: 12, textAlign: "center" }}>Share Post</Text>
            {["dylan", "journey", "hassaan", "fariza"].map((user) => (
              <TouchableOpacity
                key={user}
                style={{ paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: "#374151" }}
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
              style={{ marginTop: 20, alignSelf: "center", backgroundColor: "#374151", paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 }}
            >
              <Text style={{ color: "#E5E7EB" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
