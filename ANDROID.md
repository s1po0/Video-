# Android APK

The Android application ID is `com.slicevid.app`; keep it unchanged for updates. The app supports Android 10 and newer. The Android app runs yt-dlp and FFmpeg on the device; it does not use a SliceVid server. It needs internet access and supports ARM64 phones. The on-device extractor checks GitHub for an updated yt-dlp release at most once per day, and falls back to its bundled version if the update fails. Videos, clips and subtitle files are saved under Downloads/SliceVid. Availability can vary with YouTube restrictions, content and yt-dlp changes. Downloads run in an Android foreground service and can continue after leaving the app. Android can still interrupt a long download due to battery restrictions, force-stop, a reboot, or platform time limits. Choose a destination with the Android folder picker; otherwise files go to Downloads/SliceVid. The native dependencies are provided by [youtubedl-android](https://github.com/yausername/youtubedl-android), distributed under GPL-3.0; the Android app must be distributed in compliance with those terms.

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

The signed APK is at `android/app/build/outputs/apk/release/app-release.apk`. Verify it with `apksigner verify --verbose --print-certs app-release.apk` before distribution. Without signing environment variables, the release output is **unsigned** and cannot be installed. The GitHub Actions workflow produces an unsigned APK unless repository secrets are configured. To enable signing, add `ANDROID_KEYSTORE_BASE64` (the base64 contents of the PKCS#12 file, e.g. `base64 -w 0 slicevid-release.p12`) and `ANDROID_KEYSTORE_PASSWORD` as GitHub Actions repository secrets. The key alias must be `slicevid`, with the same key and store password. Run the workflow or push a change on this branch. Its artifacts are temporary and never include the signing key. Only trusted users should be able to modify workflows on branches that have access to signing secrets.
