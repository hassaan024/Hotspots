# Hotspots (CSC403)
## Team: Journey, Fariza, Dylan, Hassaan

## About the app
Hotspots is a social app built with **React Native + Expo** with an aim to show the user what is trending around them using an interactive heatmap.  

## Build Instructions

### Clone the repo and install dependencies:

```bash
git clone <your-ssh-url> Hotspots
cd Hotspots
npm install
```

### Run the app

```bash
npx expo start
```
- Once the above command is run it should give a localhost link that you can use to see the app in your browser
- To open it on emulator go to Android Studio "Actions" then "Virtual Device Manager" and run the device, then press 'a'on vs code terminal and select "proceed anonymously". This will open the app in the emulator. 

### How to package into an app on the emulator

Run this command which will make some new folders in the app

```bash
npx expo prebuild
```

Add a new file to android folder 'local.properties' and add path to your sdk files. This path can be found in Android Studio -> SDK Manager. Add the following line to your file, inserting your path instead

```bash
sdk.dir={Your SDK path}
```

Now run this command

```bash
npx expo run:android
```

Make sure /mobile_app/app.json is the following
``` json
{
  "expo": {
    "name": "Hotspots",
    "slug": "hotspots",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourname.hotspots"
    },
    "android": {
      "package": "com.yourname.hotspots",
      "permissions": [
        "CAMERA",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ],
      "compileSdkVersion": 35,
      "targetSdkVersion": 35,
      "buildToolsVersion": "35.0.0"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "extra": {
      "REQUIRE_LOGIN": true,
      "API_BASE_URL": "http://10.0.2.2:8080",
      "eas": {
        "projectId": "replace-with-your-project-id-if-you-use-EAS"
      }
    }
  }
}
```


```bash
cd android
./gradlew assembleRelease
./gradlew installRelease
```

This will make an executable app on the emulator, these commands may take some time for the first time. Once successfully run it you can excess the app even with the app not running on your terminal.
