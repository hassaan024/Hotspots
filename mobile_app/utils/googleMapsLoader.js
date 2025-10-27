// utils/googleMapsLoader.js
let cached;
const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export function loadGoogleMaps() {
  if (typeof window === "undefined") return Promise.resolve();
  if (cached) return cached;

  cached = new Promise((resolve, reject) => {
    if (!API_KEY) {
      console.warn("Missing EXPO_PUBLIC_GOOGLE_MAPS_API_KEY");
      resolve();
      return;
    }
    if (window.google?.maps) { resolve(); return; }

    let script = document.querySelector('script[data-gmaps="1"]');
    if (!script) {
      script = document.createElement("script");
      // add visualization so HeatmapLayer is available
      script.src =
        `https://maps.googleapis.com/maps/api/js?key=${API_KEY}` +
        `&v=weekly&libraries=marker,visualization&loading=async`;
      script.async = true;
      script.defer = true;
      script.dataset.gmaps = "1";
      document.head.appendChild(script);
    }
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", reject, { once: true });
  });

  return cached;
}