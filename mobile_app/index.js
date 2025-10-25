import { registerRootComponent } from 'expo';
import App from './App';
import { loadGoogleMaps } from "./utils/googleMapsLoader";

// Preload Google Maps script on app startup
if (typeof window !== "undefined") {
  // fire and forget, resolves before you ever open MapPage
  loadGoogleMaps().catch(err => console.warn("Maps preload failed:", err));
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);