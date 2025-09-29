import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hotspots</Text>
      <Text style={styles.subtitle}>See what’s trending around you</Text>

      <TouchableOpacity style={styles.button} onPress={() => {}}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  title: { fontSize: 28, fontWeight: "bold", color: "#003087", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#555", marginBottom: 20 },
  button: { backgroundColor: "#dba734", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: "#000", fontWeight: "600" }
});
