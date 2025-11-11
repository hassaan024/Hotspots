import React from "react";
import { View, Platform, StatusBar as RNStatusBar } from "react-native";
import { StatusBar } from "expo-status-bar";
import Constants from "expo-constants";

import Navbar from "./components/Navbar";
import MapPage from "./pages/MapPage";
import PostsPage from "./pages/PostsPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import UserProfilePage from "./pages/UserProfilePage"; // ✅ NEW IMPORT
import CreatePostPage from "./pages/createPostPage";

import { styles } from "./styles";
import { AuthContext } from "./AuthContext";
import MobileScaler from "./MobileScaler";

export default function App() {
  const [page, setPage] = React.useState("map"); // "map" | "posts" | "profile" | "userProfile"
  const [user, setUser] = React.useState(null);
  const [selectedUser, setSelectedUser] = React.useState(null); // ✅ stores username for UserProfilePage

  const REQUIRE_LOGIN = Constants.expoConfig?.extra?.REQUIRE_LOGIN ?? true;

  const auth = React.useMemo(
    () => ({
      user,
      login: async (username, _password) => {
        setUser({ username });
        setPage("posts");
      },
      logout: () => {
        setUser(null);
        setPage("posts");
      },
      goToUserProfile: (username) => {
        setSelectedUser(username);
        setPage("userProfile");
      },
    }),
    [user]
  );

  const showApp = !REQUIRE_LOGIN || !!user;
  const topPad = Platform.OS === "android" ? (RNStatusBar.currentHeight || 0) : 0;

  return (
    <AuthContext.Provider value={auth}>
      <View style={[styles.app, { paddingTop: topPad }]}>
        <StatusBar style="light" />
        {showApp ? (
          <>
            <View style={styles.content}>
              {page === "map" && <MapPage />}
              {page === "posts" && (
                <PostsPage
                  navigation={{
                    navigate: (_name, params) => {
                      if (_name === "UserProfilePage" && params?.username) {
                        setSelectedUser(params.username);
                        setPage("userProfile");
                      }
                    },
                  }}
                />
              )}
              {page === "createPost" && <CreatePostPage />}
              {page === "profile" && <ProfilePage />}
              {page === "userProfile" && selectedUser && (
                <UserProfilePage
                  route={{ params: { username: selectedUser } }}
                  navigation={{
                    goBack: () => setPage("posts"),
                  }}
                />
              )}
            </View>
            <Navbar current={page} onChange={setPage} />
          </>
        ) : (
          <LoginPage />
        )}
      </View>
    </AuthContext.Provider>
  );
}
