#!/usr/bin/env bash
set -euo pipefail
snapshot() {
  local stage="$1"
  adb shell uiautomator dump /sdcard/ui.xml >/dev/null || true
  adb exec-out cat /sdcard/ui.xml > "ui-$stage.xml" || true
  echo "::notice title=UI-$stage::$(base64 -w0 "ui-$stage.xml")"
  adb shell dumpsys activity activities | grep -E 'mResumedActivity|topResumedActivity' | sed 's/^/::notice title=Activity::/' || true
}
echo "::notice title=ABIs::$(adb shell getprop ro.product.cpu.abilist | tr -d '\r')"
adb install --abi arm64-v8a test-apk/app-release.apk
adb shell pm grant com.slicevid.app android.permission.POST_NOTIFICATIONS || true
adb shell am start -n com.slicevid.app/.MainActivity
sleep 15
snapshot before
adb shell input tap 140 292
adb shell input text 'https://youtu.be/-CCwYkvb9xU'
adb shell input keyevent 111
snapshot entered
adb shell input tap 160 360
sleep 90
snapshot result
