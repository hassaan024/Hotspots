// components/PostsShared.js
import React, { useCallback, useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, TextInput, ActivityIndicator, ScrollView } from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { API_BASE, getPostWithComments, updateLikeStatus, addComment } from "../components/api";

// ---------- helpers also used by PostsPage ----------
export function toImageUri(datapath) {
  if (!datapath) return null;
  if (/^https?:\/\//i.test(datapath)) return datapath;
  if (datapath.startsWith("/")) return `${API_BASE}${datapath}`;
  return `${API_BASE}/uploads/${datapath.replace(/^\.?\//, "")}`;
}

export function inferIsVideo(itemOrPath) {
  const p = String(itemOrPath?.datapath ?? itemOrPath ?? "").toLowerCase();
  return /\.(mp4|mov|m4v|webm|avi|mkv|3gp)$/.test(p);
}

let VideoComp = null;
try { VideoComp = require("expo-av").Video; } catch {}

export function Media({ uri, poster, isVideo }) {
  if (!isVideo) {
    return <Image source={{ uri }} style={{ width: "100%", height: "100%", resizeMode: "cover" }} />;
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
}

export function renderTextWithHandles(text, onOpenProfile, baseStyle = {}, handleStyle = {}) {
  if (!text) return null;
  const str = String(text);
  const out = [];
  const re = /@([a-zA-Z0-9_]+)/g;
  let i = 0, m, k = 0;
  while ((m = re.exec(str))) {
    const start = m.index;
    const before = str.slice(i, start);
    if (before) out.push(<Text key={`t-${k++}`} style={baseStyle}>{before}</Text>);
    const uname = m[1];
    out.push(
      <Text
        key={`h-${k++}`}
        style={[{ fontWeight: "bold", color: "#E5E7EB" }, handleStyle]}
        onPress={() => onOpenProfile(uname)}
        suppressHighlighting
      >
        @{uname}
      </Text>
    );
    i = re.lastIndex;
  }
  const tail = str.slice(i);
  if (tail) out.push(<Text key={`t-${k++}`} style={baseStyle}>{tail}</Text>);
  return out;
}

// ---------- Reusable PostDetail (matches PostsPage behavior) ----------
export function PostDetail({ postid, onBack, onOpenProfile }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [commentSending, setCommentSending] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const full = await getPostWithComments(postid);
      setPost(full || null);
      setLiked(!!full?.isLiked);
      setLikeCount(full?.likeCount || 0);
    } finally {
      setLoading(false);
    }
  }, [postid]);

  useEffect(() => { load(); }, [load]);

  const toggleLike = async () => {
    if (!post) return;
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => Math.max(0, c + (next ? 1 : -1)));
    try {
      const res = await updateLikeStatus(post.postid, next);
      setLiked(!!res.liked);
      setLikeCount(res.likeCount ?? (next ? likeCount : Math.max(0, likeCount - 1)));
    } catch {
      setLiked(!next);
      setLikeCount((c) => Math.max(0, c + (!next ? 1 : -1)));
    }
  };

  const sendComment = async () => {
    const body = commentText.trim();
    if (!body || !post) return;
    try {
      setCommentSending(true);
      const created = await addComment(post.postid, { body });
      setPost((p) => ({ ...p, comments: [...(p?.comments || []), created] }));
      setCommentText("");
    } finally {
      setCommentSending(false);
    }
  };

  if (loading || !post) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#60A5FA" />
        <TouchableOpacity onPress={onBack} style={{ marginTop: 16 }}>
          <Text style={{ color: "#9CA3AF" }}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isVideo = inferIsVideo(post);
  const mediaUri = toImageUri(post.datapath);
  const poster = post.thumbpath ? toImageUri(post.thumbpath) : undefined;
  const profilePic =
    post.profilepic && post.profilepic !== ""
      ? toImageUri(post.profilepic)
      : "https://cdn-icons-png.flaticon.com/512/847/847969.png";

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#000" }}>
      {/* header */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 12, paddingBottom: 10 }}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={26} color="#E5E7EB" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onOpenProfile(post.postedby)}>
          <Image
            source={{ uri: profilePic }}
            style={{ width: 38, height: 38, borderRadius: 19, marginHorizontal: 10, borderWidth: 1.5, borderColor: "#9CA3AF" }}
          />
        </TouchableOpacity>
        <Text
          style={{ color: "#E5E7EB", fontWeight: "bold" }}
          onPress={() => onOpenProfile(post.postedby)}
          suppressHighlighting
        >
          @{post.postedby}
        </Text>
      </View>

      {/* media */}
      <View style={{ backgroundColor: "#0B1220", width: "100%", aspectRatio: 4 / 5, borderRadius: 8, overflow: "hidden" }}>
        <Media uri={mediaUri} poster={poster} isVideo={isVideo} />
      </View>

      {/* actions */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 14, paddingVertical: 10 }}>
        <TouchableOpacity onPress={toggleLike}>
          <Ionicons name={liked ? "heart" : "heart-outline"} size={26} color={liked ? "#F87171" : "#E5E7EB"} />
        </TouchableOpacity>
        <Feather name="message-circle" size={24} color="#E5E7EB" />
      </View>

      {/* likes + caption (with clickable @mentions) */}
      <View style={{ paddingHorizontal: 14 }}>
        <Text style={{ color: "#E5E7EB", marginBottom: 4, fontWeight: "600" }}>{likeCount} likes</Text>
        <Text style={{ color: "#E5E7EB", marginTop: 2 }}>
          <Text style={{ fontWeight: "bold" }} onPress={() => onOpenProfile(post.postedby)} suppressHighlighting>
            @{post.postedby}{" "}
          </Text>
          {renderTextWithHandles(post.description, onOpenProfile, { color: "#E5E7EB" }, { color: "#E5E7EB", fontWeight: "bold" })}
        </Text>
      </View>

      {/* comments */}
      <View style={{ paddingHorizontal: 14, paddingTop: 10, paddingBottom: 30 }}>
        <Text style={{ color: "#9CA3AF", fontWeight: "bold", marginBottom: 8 }}>Comments</Text>
        {post.comments?.length ? (
          post.comments.map((c) => (
            <Text key={String(c.commentid)} style={{ color: "#E5E7EB", marginBottom: 6 }}>
              <Text style={{ fontWeight: "bold" }} onPress={() => onOpenProfile(c.username)} suppressHighlighting>
                @{c.username}{" "}
              </Text>
              {renderTextWithHandles(c.text, onOpenProfile, { color: "#E5E7EB" }, { color: "#E5E7EB", fontWeight: "bold" })}
            </Text>
          ))
        ) : (
          <Text style={{ color: "#9CA3AF" }}>No comments yet.</Text>
        )}

        {/* add comment */}
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
            <Text style={{ color: "#E5E7EB", fontWeight: "bold" }}>{commentSending ? "…" : "Send"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
