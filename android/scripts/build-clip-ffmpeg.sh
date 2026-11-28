#!/usr/bin/env bash
set -euo pipefail

# Android PIE executable; yt-dlp's existing FFmpeg remains in use outside MP4 clips.
root=$(cd "$(dirname "$0")/../.." && pwd)
ndk=${ANDROID_NDK_HOME:-${ANDROID_NDK_LATEST_HOME:-}}
[ -n "$ndk" ] && [ -d "$ndk/toolchains/llvm/prebuilt/linux-x86_64" ] || { echo 'Android NDK not found' >&2; exit 1; }
toolchain="$ndk/toolchains/llvm/prebuilt/linux-x86_64"
export PATH="$toolchain/bin:$PATH"
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
prefix="$work/prefix"
mkdir -p "$prefix" "$work/src"
fetch() {
  local name=$1 repo=$2 ref=$3 checksum=$4
  curl --fail --location --retry 3 --silent --show-error "https://codeload.github.com/$repo/tar.gz/$ref" -o "$work/$name.tar.gz"
  echo "$checksum  $work/$name.tar.gz" | sha256sum -c -
  mkdir -p "$work/src/$name"
  tar -xzf "$work/$name.tar.gz" --strip-components=1 -C "$work/src/$name"
}
fetch openssl openssl/openssl openssl-3.5.4 758b69feed5787dc12d34b0eb29b60d3c9d73d5a64760c62d93a6d26b344d65d
fetch x264 mirror/x264 c24e06c2e184345ceb33eb20a15d1024d9fd3497 090d730e867fc63631782a1287974635d1237d0fa7c6fd1d09fd543620a56689
fetch ffmpeg FFmpeg/FFmpeg n9.0.2 6e374ed621e48faa40639307dff48ba6fe574a509977956d2cce9669b7cc27e9
jobs=${BUILD_JOBS:-4}
(
  cd "$work/src/openssl"
  export ANDROID_NDK_ROOT="$ndk"
  ./Configure android-arm64 -D__ANDROID_API__=29 no-shared no-tests --prefix="$prefix" --libdir=lib
  make -j"$jobs" build_libs
  make install_dev
)
(
  cd "$work/src/x264"
  CC=aarch64-linux-android29-clang ./configure --host=aarch64-linux-android --cross-prefix="$toolchain/bin/llvm-" \
    --sysroot="$toolchain/sysroot" \
    --prefix="$prefix" --enable-static --enable-pic --disable-cli --disable-opencl
  make -j"$jobs"
  make install
)
(
  cd "$work/src/ffmpeg"
  export PKG_CONFIG_PATH="$prefix/lib/pkgconfig"
  ./configure --prefix="$prefix" --arch=aarch64 --target-os=android --enable-cross-compile \
    --cc=aarch64-linux-android29-clang --cxx=aarch64-linux-android29-clang++ \
    --ar=llvm-ar --ranlib=llvm-ranlib --strip=llvm-strip --nm=llvm-nm \
    --sysroot="$toolchain/sysroot" --pkg-config-flags=--static \
    --extra-cflags="-I$prefix/include" --extra-ldflags="-L$prefix/lib -Wl,-z,max-page-size=16384" \
    --extra-libs='-ldl -lm' --enable-openssl --enable-libx264 --enable-gpl --enable-version3 \
    --disable-shared --enable-static --disable-doc --disable-debug --disable-ffplay --disable-ffprobe
  make -j"$jobs" ffmpeg
  mkdir -p "$root/android/app/src/main/jniLibs/arm64-v8a"
  cp ffmpeg "$root/android/app/src/main/jniLibs/arm64-v8a/libffmpeg_slice.so"
  llvm-strip "$root/android/app/src/main/jniLibs/arm64-v8a/libffmpeg_slice.so"
)
