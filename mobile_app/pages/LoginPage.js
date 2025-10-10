import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { styles } from "../styles";
import { AuthContext } from "../AuthContext";

const HARDCODED_USERNAME = "admin";
const HARDCODED_PASSWORD = "password123";

export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setError("");
    if (!username || !password) {
      setError("Please enter username and password.");
      return;
    }
    setBusy(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      const ok =
        username.trim().toLowerCase() === HARDCODED_USERNAME &&
        password === HARDCODED_PASSWORD;
      if (!ok) {
        setError("Invalid credentials. Try admin / password123");
        return;
      }
      await login(username, password);
    } catch (e) {
      setError("Login failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.app, { padding: 16 }]}
      behavior={Platform.OS === "android" ? "padding" : undefined}
    >
      <View style={[styles.screen, { justifyContent: "center" }]}>
        <Text style={[styles.screenTitle, { textAlign: "center", marginBottom: 10 }]}>
          Welcome to Hotspots
        </Text>
        <Text style={[styles.screenSub, { textAlign: "center", marginBottom: 20 }]}>
          Sign in to continue
        </Text>

        <TextInput
          placeholder="Username"
          placeholderTextColor="#64748b"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            backgroundColor: "#0f172a",
            color: "#e2e8f0",
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderRadius: 10,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: "#1e293b",
          }}
          returnKeyType="next"
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#64748b"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{
            backgroundColor: "#0f172a",
            color: "#e2e8f0",
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderRadius: 10,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: "#1e293b",
          }}
          returnKeyType="go"
          onSubmitEditing={handleLogin}
        />

        {!!error && (
          <Text style={{ color: "#fca5a5", marginBottom: 8, textAlign: "center" }}>
            {error}
          </Text>
        )}

        <TouchableOpacity
          onPress={handleLogin}
          disabled={busy}
          style={{
            backgroundColor: "#FBBF24",
            paddingVertical: 12,
            borderRadius: 10,
            alignItems: "center",
          }}
        >
          {busy ? (
            <ActivityIndicator color="#111827" />
          ) : (
            <Text style={{ color: "#111827", fontWeight: "700" }}>Login</Text>
          )}
        </TouchableOpacity>

        <Text style={{ color: "#9CA3AF", marginTop: 12, textAlign: "center" }}>
          Try <Text style={{ color: "#E5E7EB" }}>admin</Text> /
          <Text style={{ color: "#E5E7EB" }}> password123</Text>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
