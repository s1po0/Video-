# Android APK

The Android application ID is `com.slicevid.app`; keep it unchanged for updates. The app supports Android 10 and newer. The Android app runs yt-dlp and FFmpeg on the device; it does not use a SliceVid server. It needs internet access and supports ARM64 phones. The extractor is updated after extraction fails (at most once a day) or when a download returns HTTP 403. Full media downloads can use up to eight parallel connections for supported HTTP streams; if aria2c fails, the app retries with the native downloader. Clipped downloads use FFmpeg and do not use aria2c. MP4 clips copy compatible H.264 and AAC streams without re-encoding; other formats may require conversion. Speed depends on the source, device and selected stream. Videos, clips and subtitle files are saved under Downloads/SliceVid. Availability can vary with YouTube restrictions, content and yt-dlp changes. Downloads run in an Android foreground service and can continue after leaving the app. Android can still interrupt a long download due to battery restrictions, force-stop, a reboot, or platform time limits. Choose a destination with the Android folder picker; otherwise files go to Downloads/SliceVid. The native dependencies are provided by [youtubedl-android](https://github.com/yausername/youtubedl-android), distributed under GPL-3.0; the Android app must be distributed in compliance with those terms.

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

### Bounded HTTP requests for MP4 clips

MP4 clips use a separate FFmpeg 9 executable, built from pinned FFmpeg, OpenSSL and x264 sources by `android/scripts/build-clip-ffmpeg.sh` (Linux and the Android NDK are required). Run this script before building the APK. The executable is ignored by Git and included as an Android native executable at build time. The regular youtubedl-android FFmpeg is retained for whole videos, WebM, MP3, and subtitle conversions. The MP4 clip downloader asks FFmpeg for bounded 2 MiB HTTP ranges (256 KiB during initial probing) with connection reuse to reduce throttling and excess data during seeking; the result depends on the source and network, and clips use stream copy rather than re-encoding. This avoids bitrate inflation, but MP4 keyframe pre-roll and container overhead can add bytes beyond the requested interval, and some players ignore the edit list, shifting the displayed start and subtitle timing. The progress label shows whether the bounded or fallback clip path is in use. This does not download the whole video. Before use, the app probes the fast executable in the same library environment as yt-dlp; if it cannot start, or the known older yt-dlp executable-detection error occurs, it retries with the original FFmpeg. The fallback can be much slower. FFmpeg and x264 are GPL components; the script pins their source revisions and build options for reproducibility. OpenSSL is distributed under Apache-2.0. See their respective upstream repositories and licenses.

Subtitle discovery requests manual and automatic tracks, including available translations. If none are found, it tries an alternate YouTube client and, at most once per day, updates yt-dlp and retries. This extra lookup can make metadata loading slower when subtitles are missing. A caption reported in the YouTube player may still be unavailable to yt-dlp due to YouTube restrictions. Subtitle downloads use the same client that found the tracks, and selected clips still trim and rebase cue times.

The app stages downloads in its cache and copies the finished file to the chosen folder; during saving, both copies can briefly occupy storage. Failed requests or retries can use extra network data.

If an MP4 clip contains a track substantially shorter than requested, the app retries once with the version 16 range settings after removing the first attempt. If still short, the message identifies the track and its reported and requested durations. A retry can consume extra data. The duration check relies on Android MediaExtractor metadata and may not identify the underlying cause.

When both manual and automatic tracks exist for the selected language, yt-dlp chooses the manual track first. If that track contains no cues in the selected clip, the app retries once with the automatic track and trims it to the same interval. If neither has cues there, the error reports the time extent of the retrieved cues; an extent does not imply uninterrupted caption coverage. No captions can be generated when the source does not provide them.

If the selected clip has no cues in the requested track, the app also tries up to two available original-language automatic tracks and reports the language actually saved. These still depend on YouTube supplying cues for the requested interval; the app does not synthesize subtitles or shift earlier text into it.
