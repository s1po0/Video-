#!/usr/bin/env bash
set -euo pipefail
adb shell getprop ro.product.cpu.abilist
adb install --abi arm64-v8a test-apk/app-release.apk
adb shell pm grant com.slicevid.app android.permission.POST_NOTIFICATIONS || true
adb shell am start -n com.slicevid.app/.MainActivity
sleep 15
adb shell input tap 140 292
adb shell input text 'https://youtu.be/-CCwYkvb9xU'
adb shell input keyevent 111
adb shell input tap 160 360
sleep 120
adb shell uiautomator dump /sdcard/ui.xml >/dev/null
adb exec-out cat /sdcard/ui.xml > ui.xml
python3 - <<'PY'
import xml.etree.ElementTree as ET
root = ET.parse('ui.xml')
for n in root.iter('node'):
 text=n.get('text',''); desc=n.get('content-desc',''); bounds=n.get('bounds','')
 if text or desc:
  print('::notice title=Android UI::'+(text or desc).replace('%','%25').replace('\n','%0A')+' '+bounds)
PY
