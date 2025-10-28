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
import { AuthContext } from "../AuthContext";
import { loginUser } from "../components/api";
import { styles, colors } from "../stylesLoginPage";

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
      const user = await loginUser({ username: username.trim(), password });
      await login(user.username, password);
    } catch (e) {
      setError(String(e.message || "Login failed. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.app}
      behavior={Platform.OS === "android" ? "padding" : undefined}
    >
      {/* ==== Web-only animated 3D background (pure CSS) ==== */}
      {Platform.OS === "web" && (
        <>
          <style>{`
            /* Fullscreen animated gradient container */
            .igwave-wrap {
              position: fixed;
              inset: 0;
              z-index: 0;
              pointer-events: none;
              overflow: hidden;
              background: linear-gradient(
                315deg,
                rgba(101,0,94,1) 3%,
                rgba(60,132,206,1) 38%,
                rgba(48,238,226,1) 68%,
                rgba(255,25,25,1) 98%
              );
              animation: igGradient 15s ease infinite;
              background-size: 400% 400%;
              background-attachment: fixed;
            }
            @keyframes igGradient {
              0%   { background-position: 0% 0%; }
              50%  { background-position: 100% 100%; }
              100% { background-position: 0% 0%; }
            }

            /* Soft waves at the bottom for 3D parallax feel */
            .igwave {
              background: rgb(255 255 255 / 22%);
              border-radius: 1000% 1000% 0 0;
              position: fixed;
              width: 200%;
              height: 12em;
              animation: igWave 10s -3s linear infinite;
              transform: translate3d(0, 0, 0);
              opacity: 0.85;
              bottom: 0;
              left: 0;
              z-index: 0;
              filter: blur(1px);
            }
            .igwave:nth-of-type(2) {
              bottom: -1.25em;
              animation: igWave 18s linear reverse infinite;
              opacity: 0.7;
            }
            .igwave:nth-of-type(3) {
              bottom: -2.5em;
              animation: igWave 20s -1s reverse infinite;
              opacity: 0.9;
            }
            @keyframes igWave {
              2%   { transform: translateX(1); }
              25%  { transform: translateX(-25%); }
              50%  { transform: translateX(-50%); }
              75%  { transform: translateX(-25%); }
              100% { transform: translateX(1); }
            }

            /* Foreground layer ensures the form sits above animation */
            .ig-foreground {
              position: relative;
              z-index: 1;
            }
          `}</style>

          <div className="igwave-wrap">
            <div className="igwave"></div>
            <div className="igwave"></div>
            <div className="igwave"></div>
          </div>
        </>
      )}

      {/* ==== Foreground (card) ==== */}
      <View className="ig-foreground" style={styles.pageWrap}>
        <View style={styles.card}>
          {/* Brand / heading */}
          <View style={styles.brandRow}>
            <Text style={styles.brandBadge}>Hotspots</Text>
          </View>

          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          {/* Inputs */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              placeholder=""
              placeholderTextColor={colors.textDim}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              returnKeyType="next"
            />
          </View>

          <View style={{ height: 12 }} />

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              placeholder=""
              placeholderTextColor={colors.textDim}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              returnKeyType="go"
              onSubmitEditing={handleLogin}
            />
          </View>

          {!!error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            onPress={handleLogin}
            disabled={busy}
            activeOpacity={0.9}
            style={[styles.ctaBtn, busy && styles.ctaBtnDisabled]}
          >
            {busy ? (
              <ActivityIndicator color="#1b1406" />
            ) : (
              <Text style={styles.ctaText}>Login</Text>
            )}
          </TouchableOpacity>

          {/* Fine print */}
          <Text style={styles.note}>
            By continuing you agree to our{" "}
            <Text style={styles.link}>Terms</Text> &{" "}
            <Text style={styles.link}>Privacy</Text>.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
