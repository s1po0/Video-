# Android APK

The Android application ID is `com.slicevid.app`; keep it unchanged for updates. The app supports Android 10 and newer. The app is a Capacitor client and requires a separately hosted, HTTPS-accessible SliceVid backend with yt-dlp and ffmpeg. Enter its HTTPS origin under “Backend server URL” in the app. Serverless Vercel functions are not supported by the in-memory job/SSE architecture; use a persistent service such as a VPS or Render instead. Real YouTube access depends on the host and yt-dlp.

## Release signing

**Never put a keystore, its password, or a private key into Git or public artifacts.** Keep offline backups of the keystore, password and alias. Loss of this key means directly installed APKs signed with it can no longer be updated in place. Anyone with the key and password can sign updates. Keep the backups secret. Android updates must retain the same application ID and signing key and use a higher `versionCode` in `android/app/build.gradle`.

With Node 22, JDK 21, Android SDK 36 and Android build tools installed:

```sh
npm ci --ignore-scripts
npx cap sync android
export ANDROID_KEYSTORE_PATH=/absolute/path/to/slicevid-release.p12
export ANDROID_KEYSTORE_PASSWORD='your password'
export ANDROID_KEY_ALIAS=slicevid
export ANDROID_KEY_PASSWORD="$ANDROID_KEYSTORE_PASSWORD"
cd android
./gradlew assembleRelease
```

The signed APK is at `android/app/build/outputs/apk/release/app-release.apk`. Verify it with `apksigner verify --verbose --print-certs app-release.apk` before distribution. Without signing environment variables, the release output is **unsigned** and cannot be installed. The included GitHub Actions workflow deliberately produces an unsigned APK; sign it privately using your own Android SDK `apksigner` (after zipalign) or build locally as shown above. Its artifacts are temporary and do not contain your signing key.
