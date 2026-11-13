#!/usr/bin/env bash
# ---------------------------------------------------------------------------
#  fetch-tools.sh — downloads the whole Android toolchain into ./.tools
#  so that ./build-apk.sh can run without Gradle or an SDK manager.
#
#  Sources used (all reachable from restricted networks):
#    * JDK 17 (with javac)  → github.com/whynusn/android-sdk-bundle
#    * build-tools (aapt2, d8, zipalign, apksigner) → same mirror
#    * android.jar (API 34) → same mirror
#
#  If you already have a local Android SDK, just export AAPT2 / D8 /
#  ZIPALIGN / APKSIGNER / ANDROID_JAR and skip this script.
# ---------------------------------------------------------------------------
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
TOOLS="$ROOT/.tools"
MIRROR_API="https://api.github.com/repos/whynusn/android-sdk-bundle/git/blobs"

# blob shas from the mirror repository
JDK_PARTS=(
  "bcebbf5392b80d93a5569e75e888ceac387c12a9 OpenJDK17.tar.gz.part-00"
  "55e54de79c5fee51e33e281c0dfe8436a1b7ecb4 OpenJDK17.tar.gz.part-01"
  "b8391ddb85af44dc70e440367a9af113c93b616a OpenJDK17.tar.gz.part-02"
)
BUILD_TOOLS_SHA="e534f1d50e9ad6d40bd43896bcdcaf054c5089ea"
PLATFORM_SHA="496a304710ffb19621e55d672ca03e30937f661f"

mkdir -p "$TOOLS"
cd "$TOOLS"

dl_blob() { # sha, output
  curl -sSL --fail -H "Accept: application/vnd.github.raw" -o "$2" "$MIRROR_API/$1"
}

echo "==> JDK 17 (with javac)"
mkdir -p jdk-parts
for entry in "${JDK_PARTS[@]}"; do
  set -- $entry
  [ -f "jdk-parts/$2" ] || dl_blob "$1" "jdk-parts/$2"
done
if [ ! -d "$TOOLS/jdk" ]; then
  cat jdk-parts/OpenJDK17.tar.gz.part-* > jdk.tar.gz
  mkdir -p jdk && tar -xzf jdk.tar.gz -C jdk --strip-components=1
fi
export JAVA_HOME="$TOOLS/jdk"
export PATH="$JAVA_HOME/bin:$PATH"
javac -version

echo "==> Android build-tools"
if [ ! -x "$TOOLS/build-tools/aapt2" ]; then
  [ -f build-tools.zip ] || dl_blob "$BUILD_TOOLS_SHA" build-tools.zip
  rm -rf bt && mkdir bt && unzip -q build-tools.zip -d bt
  rm -rf build-tools && mv bt/android-14 build-tools && rm -rf bt build-tools.zip
fi

echo "==> Android platform (android.jar, API 34)"
if [ ! -f "$TOOLS/platform/android.jar" ]; then
  [ -f platform.zip ] || dl_blob "$PLATFORM_SHA" platform.zip
  rm -rf pf && mkdir pf && unzip -q platform.zip -d pf
  rm -rf platform && mv pf/android-34 platform && rm -rf pf platform.zip
fi

cat > "$TOOLS/env.sh" <<EOF
# source me before ./build-apk.sh
export JAVA_HOME="$TOOLS/jdk"
export PATH="\$JAVA_HOME/bin:\$PATH"
export AAPT2="$TOOLS/build-tools/aapt2"
export D8="$TOOLS/build-tools/d8"
export ZIPALIGN="$TOOLS/build-tools/zipalign"
export APKSIGNER="$TOOLS/build-tools/apksigner"
export ANDROID_JAR="$TOOLS/platform/android.jar"
EOF

echo
echo "Toolchain ready. Now run:"
echo "  source .tools/env.sh && ./build-apk.sh"
