#!/usr/bin/env bash
# ---------------------------------------------------------------------------
#  build-apk.sh — builds a signed, installable APK without Gradle.
#
#  Requirements (all auto-downloaded if missing):
#    * JDK 17            (javac + keytool)
#    * Android build-tools (aapt2, d8, zipalign, apksigner)
#    * Android platform android.jar
#
#  Usage:
#    ./build-apk.sh                 # debug-signed APK
#    ./build-apk.sh --release       # release-signed with keystore.properties
# ---------------------------------------------------------------------------
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
APP="$ROOT/app"
BUILD="$ROOT/build"
TOOLS="$ROOT/.tools"

AAPT2="${AAPT2:-$(find "$TOOLS" -name aapt2 -type f 2>/dev/null | head -1)}"
D8="${D8:-$(find "$TOOLS" -name d8 -type f 2>/dev/null | head -1)}"
ZIPALIGN="${ZIPALIGN:-$(find "$TOOLS" -name zipalign -type f 2>/dev/null | head -1)}"
APKSIGNER="${APKSIGNER:-$(find "$TOOLS" -name apksigner -type f 2>/dev/null | head -1)}"
ANDROID_JAR="${ANDROID_JAR:-$(find "$TOOLS" -name android.jar -type f 2>/dev/null | head -1)}"
JAVA_BIN="${JAVA_HOME:-}"
if [ -n "$JAVA_BIN" ] && [ -x "$JAVA_BIN/bin/javac" ]; then
  JAVAC="$JAVA_BIN/bin/javac"; KEYTOOL="$JAVA_BIN/bin/keytool"
else
  JAVAC="$(command -v javac || true)"; KEYTOOL="$(command -v keytool || true)"
fi

need() { [ -n "$1" ] && [ -x "$1" ] || { echo "missing tool: $2"; exit 1; }; }
need "$JAVAC" javac
need "$AAPT2" aapt2
need "$D8" d8
need "$ZIPALIGN" zipalign
need "$APKSIGNER" apksigner

MODE="debug"
[ "${1:-}" = "--release" ] && MODE="release"

MIN_SDK=24
TARGET_SDK=34
VERSION_CODE=1
VERSION_NAME="1.0.0"
[ "$MODE" = "debug" ] && VERSION_NAME="1.0.0-debug"

echo "==> build mode: $MODE"
rm -rf "$BUILD"
mkdir -p "$BUILD/res" "$BUILD/gen" "$BUILD/classes" "$BUILD/dex" "$BUILD/apk"

echo "==> compiling resources (aapt2)"
"$AAPT2" compile --dir "$APP/src/main/res" -o "$BUILD/res/compiled.zip"

echo "==> linking resources"
"$AAPT2" link \
  -o "$BUILD/apk/base.apk" \
  -I "$ANDROID_JAR" \
  --manifest "$APP/src/main/AndroidManifest.xml" \
  --java "$BUILD/gen" \
  --min-sdk-version $MIN_SDK \
  --target-sdk-version $TARGET_SDK \
  --version-code $VERSION_CODE \
  --version-name "$VERSION_NAME" \
  --auto-add-overlay \
  "$BUILD/res/compiled.zip"

echo "==> compiling java"
find "$APP/src/main/java" "$BUILD/gen" -name '*.java' > "$BUILD/sources.txt"
"$JAVAC" -source 11 -target 11 -encoding UTF-8 -nowarn -Xlint:-options \
  -classpath "$ANDROID_JAR" \
  -d "$BUILD/classes" \
  @"$BUILD/sources.txt" 2>&1 | grep -v "^Note:" || true

echo "==> dexing (d8)"
find "$BUILD/classes" -name '*.class' > "$BUILD/classes.txt"
"$D8" --release --min-api $MIN_SDK --lib "$ANDROID_JAR" \
  --output "$BUILD/dex" @"$BUILD/classes.txt"

echo "==> packaging"
cp "$BUILD/apk/base.apk" "$BUILD/unsigned.apk"
( cd "$BUILD/dex" && zip -q "$BUILD/unsigned.apk" classes*.dex )

echo "==> aligning"
"$ZIPALIGN" -f -p 4 "$BUILD/unsigned.apk" "$BUILD/aligned.apk"

KEYSTORE="$ROOT/keystore.properties"
if [ "$MODE" = "release" ] && [ -f "$KEYSTORE" ]; then
  # shellcheck disable=SC1090
  source "$KEYSTORE"
  OUT="$BUILD/video-upscaler-$VERSION_NAME-release.apk"
  "$APKSIGNER" sign --ks "$STORE_FILE" --ks-pass "pass:$STORE_PASSWORD" \
    --key-pass "pass:$KEY_PASSWORD" --ks-key-alias "$KEY_ALIAS" \
    --out "$OUT" "$BUILD/aligned.apk"
else
  if [ ! -f "$BUILD/debug.keystore" ]; then
    "$KEYTOOL" -genkeypair -keystore "$BUILD/debug.keystore" -storepass android \
      -keypass android -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 \
      -dname "CN=Android Debug,O=Android,C=US" >/dev/null 2>&1
  fi
  OUT="$BUILD/video-upscaler-$VERSION_NAME.apk"
  "$APKSIGNER" sign --ks "$BUILD/debug.keystore" --ks-pass pass:android \
    --key-pass pass:android --ks-key-alias androiddebugkey \
    --out "$OUT" "$BUILD/aligned.apk"
fi

"$APKSIGNER" verify --print-certs "$OUT" | head -5 || true
echo
echo "APK ready: $OUT"
ls -lh "$OUT"
