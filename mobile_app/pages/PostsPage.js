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
  Share,
  ScrollView,
} from "react-native";
import { styles } from "../styles";
import { listPosts, API_BASE, getPostWithComments } from "../components/api";
import { Ionicons, Feather } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const imageSize = width;

function toImageUri(datapath) {
  if (!datapath) return null;
  if (/^https?:\/\//i.test(datapath)) return datapath;
  if (datapath.startsWith("/")) return `${API_BASE}${datapath}`;
  const clean = datapath.replace(/^\.?\//, "");
  return `${API_BASE}/uploads/${clean}`;
}

export default function PostsPage() {
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState({});
  const [likeCounts, setLikeCounts] = useState({});
  const [followStatus, setFollowStatus] = useState({});
  const [viewingPost, setViewingPost] = useState(null); // shows comment view

  // Load posts
  const load = useCallback(async () => {
    try {
      const data = await listPosts();
      setPosts(data);

      // initialize like counts if backend provides them
      const counts = {};
      data.forEach((p) => {
        counts[p.postid] = p.likeCount || 0;
      });
      setLikeCounts(counts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Toggle like and count
  const toggleLike = (postid) => {
    setLikedPosts((prev) => {
      const alreadyLiked = prev[postid];
      setLikeCounts((counts) => ({
        ...counts,
        [postid]: Math.max(0, (counts[postid] || 0) + (alreadyLiked ? -1 : 1)),
      }));
      return {
        ...prev,
        [postid]: !alreadyLiked,
      };
    });
  };

  const handleFollowToggle = (username) => {
    setFollowStatus((prev) => ({
      ...prev,
      [username]: !prev[username],
    }));
  };

  // Open comment view
  const handleComment = async (postid) => {
    try {
      setLoading(true);
      const data = await getPostWithComments(postid);
      setViewingPost(data);
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (post) => {
    try {
      const imgUri = toImageUri(post.datapath);
      const message = post.description
        ? `${post.description}\n\nCheck out this post by @${post.postedby}!`
        : `Check out this post by @${post.postedby}!`;
      await Share.share({
        message: `${message}\n${imgUri}`,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const goBackToFeed = () => setViewingPost(null);

  // Comment View (when a post is opened)
  if (viewingPost) {
    const imgUri = toImageUri(viewingPost.datapath);
    const profilePic =
      viewingPost.profilepic && viewingPost.profilepic !== ""
        ? toImageUri(viewingPost.profilepic)
        : "https://cdn-icons-png.flaticon.com/512/847/847969.png";

    return (
      <ScrollView style={[styles.app, { paddingTop: 10 }]}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <TouchableOpacity onPress={goBackToFeed}>
            <Ionicons name="arrow-back" size={26} color="#E5E7EB" />
          </TouchableOpacity>
          <Image
            source={{ uri: profilePic }}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              marginHorizontal: 10,
              borderWidth: 1.5,
              borderColor: "#9CA3AF",
            }}
          />
          <Text style={{ color: "#E5E7EB", fontWeight: "bold" }}>
            @{viewingPost.postedby}
          </Text>
        </View>

        {/* Post image */}
        <Image
          source={{ uri: imgUri }}
          style={{
            width: width,
            height: width,
            resizeMode: "cover",
          }}
        />

        {/* Caption */}
        <View style={{ paddingHorizontal: 14, marginTop: 8 }}>
          <Text style={{ color: "#E5E7EB" }}>
            <Text style={{ fontWeight: "bold" }}>
              @{viewingPost.postedby}{" "}
            </Text>
            {viewingPost.description}
          </Text>
        </View>

        {/* Comments */}
        <View style={{ paddingHorizontal: 14, marginTop: 18, marginBottom: 40 }}>
          <Text
            style={{
              color: "#9CA3AF",
              fontWeight: "bold",
              marginBottom: 8,
            }}
          >
            Comments
          </Text>
          {viewingPost.comments && viewingPost.comments.length > 0 ? (
            viewingPost.comments.map((c) => (
              <Text
                key={c.commentid}
                style={{ color: "#E5E7EB", marginBottom: 6 }}
              >
                <Text style={{ fontWeight: "bold" }}>@{c.username} </Text>
                {c.text}
              </Text>
            ))
          ) : (
            <Text style={{ color: "#9CA3AF" }}>No comments yet.</Text>
          )}
        </View>
      </ScrollView>
    );
  }

  // Main Feed View
  return (
    <View style={[styles.app, { paddingTop: 10 }]}>
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#60A5FA"
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={posts}
          renderItem={({ item }) => {
            const imgUri = toImageUri(item.datapath);
            const profilePic =
              item.profilepic && item.profilepic !== ""
                ? toImageUri(item.profilepic)
                : "https://cdn-icons-png.flaticon.com/512/847/847969.png";
            const isLiked = likedPosts[item.postid];
            const isFollowing = followStatus[item.postedby];

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
                    <Text style={styles.username}>@{item.postedby}</Text>
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

                {/* Post image */}
                <Image
                  source={{ uri: imgUri }}
                  style={{
                    width: imageSize,
                    height: imageSize,
                    resizeMode: "cover",
                  }}
                />

                {/* Icons */}
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

                  <TouchableOpacity onPress={() => handleShare(item)}>
                    <Feather name="send" size={22} color="#E5E7EB" />
                  </TouchableOpacity>
                </View>

                {/* Likes and Caption */}
                <View style={{ paddingHorizontal: 14, paddingBottom: 10 }}>
                  <Text
                    style={{
                      color: "#E5E7EB",
                      marginBottom: 3,
                      fontWeight: "600",
                    }}
                  >
                    {likeCounts[item.postid] || 0} likes
                  </Text>

                  {item.description ? (
                    <Text style={{ color: "#E5E7EB", marginTop: 4 }}>
                      <Text style={{ fontWeight: "bold" }}>
                        @{item.postedby}{" "}
                      </Text>
                      {item.description}
                    </Text>
                  ) : null}
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
            <Text
              style={{
                color: "#9CA3AF",
                textAlign: "center",
                marginTop: 24,
              }}
            >
              No posts yet.
            </Text>
          }
        />
      )}
    </View>
  );
}
