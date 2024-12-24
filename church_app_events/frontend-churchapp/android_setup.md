1. Install neccesary packages:

```
# Install necessary dependencies
npm install @react-navigation/native @react-navigation/stack
npm install react-native-screens react-native-safe-area-context
npm install react-native-gesture-handler
npx expo install expo-dev-client
```

2. Create a development build:

```
npx expo prebuild -p android --npm

# Navigate to android folder
cd android
./gradlew assembleDebug
cd ..
```

3. Run the app on your device:

```
# Check if the app is running
adb devices
# Set up port forwarding
adb forward tcp:8081 tcp:8081
adb forward tcp:19000 tcp:19000
adb forward tcp:19001 tcp:19001

# Install the app
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Clear any existing processes
npx kill-port 8081 19000 19001

# Start the development server
npx expo start --dev-client --localhost
```

4. If build fails:

```
# Clean the project
rm -rf node_modules
rm -rf android
npm install
npx expo prebuild -p android --npm

# Clean the project
npx expo clean
cd android
./gradlew clean
npx expo prebuild -p android --npm
```

If device connection fails:

```
# Reset the device
adb kill-server
adb start-server
```

If metro build fails:

```
# Clear the metro cache
npx expo start --reset-cache
npx expo start --clear
```


Make sure the device is properly set up
a. Enable Developer Options
- Go to Settings -> About phone
- Tap on Build number 7 times
- Go back to Settings -> System -> Developer options
- Enable USB debugging

b. Enable Wireless Debugging
- Go to Settings -> System -> Developer options
- Enable Wireless debugging

c. Enable Developer Options
- Go to Settings -> System -> Developer options
- Enable Developer options

d. Enable USB Debugging
- Go to Settings -> System -> Developer options
- Enable USB debugging
