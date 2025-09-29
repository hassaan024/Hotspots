# Hotspots (CSC403)
## Team: Journey, Fariza, Dylan, Hassaan

### About the app
Hotspots is a social app built with **React Native + Expo** with an aim to show the user what is trending around them using an interactive heatmap.  

### Build Instructions

#### Clone the repo and install dependencies:

```bash
git clone <your-ssh-url> Hotspots
cd Hotspots
npm install
```

#### Run the app

```bash
npx expo start
```
If emulator is open press 'a' on the terminal to open in the emulator. You can also open it on localhost with the link given in the terminal and should be able to see the app in the browser. 

#### How to package into an app on the emulator

Add a new file to android folder 'local.properties' and add path to your sdk files. This path can be found in Android Studio -> SDK Manager. Insert the path

sdk.dir={Your SDK path}

Now run the following commands

```bash
npx expo prebuild
npx expo run:android
```

After successfully running them, an app should appear on the emulator running

