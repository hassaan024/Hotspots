import React from "react";
import { View, Platform, StatusBar as RNStatusBar } from "react-native";
import { StatusBar } from "expo-status-bar";
import Constants from "expo-constants";

import Navbar from "./components/Navbar";
import MapPage from "./pages/MapPage";
import PostsPage from "./pages/PostsPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";

import CreatePostPage from "./pages/createPostPage";
import SearchUser from "./pages/SearchUserPage";


import { styles } from "./styles";
import { AuthContext } from "./AuthContext";
import MobileScaler from "./MobileScaler";
export default function App() {
  const [page, setPage] = React.useState("map"); // "map" | "posts" | "profile"
  const [user, setUser] = React.useState(null);

  const REQUIRE_LOGIN = Constants.expoConfig?.extra?.REQUIRE_LOGIN ?? true;

  const auth = React.useMemo(
    () => ({
      user,
      login: async (username, _password) => {
        setUser({ username });
        setPage("posts");         // go to landing page
      },
      logout: () => {
        setUser(null);
        setPage("posts");
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
              {page === "posts" && <PostsPage />}
              {page === "createPost" && <CreatePostPage />}
              {page === "profile" && <ProfilePage />}
              {page === "search" && <SearchUser />}
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