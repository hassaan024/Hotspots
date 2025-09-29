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

Now run the following command which will make an executable app on the emulator, this command may take some time for the first time. Once successfully run it you can excess the app even with the app not running on your terminal.

```bash
npx expo run:android
```


