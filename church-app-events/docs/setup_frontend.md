# Setup all packages needed for Front End

## Package.json
npm packages:

```bash
cd frontend-churchapp
// React native Navigation Core
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
// React Native Reanimated (for animations)
npm install react-native-reanimated
// React Native Paper (UI component)
npm install react-native-paper
// React Native Gesture Handler (for gestures)
npm install react-native-gesture-handler
// Form Handling (Formik + Yup)
npm install formik yup
// React Native Vector Icons (for icons)
npm install react-native-vector-icons
// React Native Image Zoom (for zoomable images)
npm install react-native-image-zoom-viewer
// React Native Button Tabs
npm install @react-navigation/buttom-tabs
// React Native Card-Based UI
 npm install react-native-paper
```

## Expo CLI

```bash
// Install expo CLI
npm install -g expo-cli
// Initalize and Run with expo
npx expo start
// prebuild
npx expo prebuild
// This step is needed to not raise the RNGoogleSignIn
npx expo prebuild --clean
// Start with clean up
npx expo start --clear
// Build/Prebuild emulator for android/iso
npx expo run:android
```

## Set Up and Run with EAS
```bash
// Install EAS CLI
npm install -g eas-cli
// Login (lykimq@gmail.com/Praise_God)
eas login
// Building with EAS
eas build --platform android
```

- Configure `app.json`

```json
{
  "expo": {
    "platforms": ["ios", "android"],
    "android": {
      "package": "com.yourname.yourapp"
    },
    "ios": {
      "bundleIdentifier": "com.yourname.yourapp"
    }
  }
}
```

where `com.yourname.yourapp` is created by FireBase console/Cloud Google console

- Generate SHA1 Key for Firebase console when register the credenditals:

```bash
cd android
./gradlew signingReport
```