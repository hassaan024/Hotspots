import React, { useMemo, useContext } from "react";
import { View, Text, Image, FlatList, TouchableOpacity } from "react-native";
import { styles } from "../stylesProfilePage";
import { AuthContext } from "../AuthContext";

export default function ProfilePage() {
  const { logout } = useContext(AuthContext);

//   Replace this with API that pulls users data
  const user = {
    name: "Prather",
    avatar:
     "https://picsum.photos/id/1005/600/600",
    followers: 1287,
    following: 342,
    postsCount: 18,
  };

  // Replace this with API that gets all user posts (or one API that gets user info and posts)
  const posts = useMemo(
    () => [
      "https://picsum.photos/id/1011/600/600",
      "https://picsum.photos/id/1015/600/600",
      "https://picsum.photos/id/1025/600/600",
      "https://picsum.photos/id/1035/600/600",
      "https://picsum.photos/id/1043/600/600",
      "https://picsum.photos/id/1050/600/600",
      "https://picsum.photos/id/1062/600/600",
      "https://picsum.photos/id/1074/600/600",
      "https://picsum.photos/id/1084/600/600",
      "https://picsum.photos/id/1080/600/600",
      "https://picsum.photos/id/1003/600/600",
      "https://picsum.photos/id/1004/600/600",
      "https://picsum.photos/id/1005/600/600",
      "https://picsum.photos/id/1006/600/600",
      "https://picsum.photos/id/1008/600/600",
      "https://picsum.photos/id/1010/600/600",
      "https://picsum.photos/id/1012/600/600",
      "https://picsum.photos/id/1013/600/600",
    ],
    []
  );

  return (
    <View style={styles.screen}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
          <View style={styles.headerStats}>
            <View style={styles.statBlock}>
              <Text style={styles.statNumber}>{user.postsCount}</Text>
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
          <Text style={styles.username}>{user.name}</Text>

          {/* Maybe allow user to edit user name later */}
          {/* Making sure database can handle prevention on a user taking another users name when editing */}
          {/* <TouchableOpacity style={styles.editBtn}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity> */}

          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Grid Card */}
      <View style={styles.gridCard}>
        <FlatList
          data={posts}
          keyExtractor={(uri, idx) => `${uri}-${idx}`}
          numColumns={3}
          contentContainerStyle={styles.gridContainer}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <Image source={{ uri: item }} style={styles.gridImage} />
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}
