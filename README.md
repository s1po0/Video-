# Video Upscaler — باشکردنی ڤیدیۆ

بەرنامەیەکی ئەندرۆید کە **هەر ڤیدیۆیەک ٢× / ٣× / ٤× گەورە دەکات** — تەنها لەسەر مۆبایلەکەت، بێ ئینتەرنێت، بێ ڕیکلام و بێ بارکردنی هیچ شتێک بۆ سێرڤەر.

An Android video upscaler: **2× / 3× / 4× any video on the device**, 100 % offline.

---

## ⬇️ داونلۆدکردنی APK — وەشان ١.١.٠

### 👉 [**Google Drive — داونلۆدی ڕاستەوخۆ**](https://drive.google.com/uc?id=19UHWBZz7nKAJo8CeFpji5YZH9jcOrptk&export=download)

| سەرچاوە | لینک |
|---|---|
| 📥 **Google Drive** | [VideoUpscaler-1.1.0.apk](https://drive.google.com/uc?id=19UHWBZz7nKAJo8CeFpji5YZH9jcOrptk&export=download) |
| ☁️ **Dropbox** | [VideoUpscaler-1.1.0.apk](https://www.dropbox.com/scl/fi/j2fyylqn1efuohz58ca2k/VideoUpscaler-1.1.0.apk?rlkey=6opr8jc8fi5kno01h8bb2rj31&dl=1) |
| 🐙 **GitHub** (خام) | [VideoUpscaler-1.1.0.apk](https://github.com/s1po0/Video-/raw/arena/50215008-video/VideoUpscaler-1.1.0.apk) |

٥٣ کیلۆبایت · Android 7.0+ · ئیمزاکراو (v2+v3)

### دامەزراندن
1. لە لینکەکەوە فایلی `.apk` دابەزێنە
2. Settings → Security → **Install unknown apps** ڕێگە بە Chrome/فایل مەنجەر بدە
3. کرتە لە فایلەکە → **Install**
4. ⚠️ وەشانی کۆن (1.0.x) سەرەتا لابەرە

### دروستکردنی خۆت
```bash
./fetch-tools.sh                 # JDK + build-tools + android.jar → .tools/
source .tools/env.sh
./build-apk.sh                   # → build/video-upscaler-1.1.0-debug.apk
./build-apk.sh --release         # لەگەڵ keystore.properties
```

---

## 🆕 چی نوێیە لە ١.١.٠

**ڕووکار (UI/UX) بە تەواوی نوێکرایەوە**
- دیزاینی تاریکی نوێ بە ڕەنگی شین-مۆر (aurora)، کارتی خڕ، سێبەری نەرم
- چیپی هەڵبژاردن (٢×/٣×/٤×، خێرا/هاوسەنگ/زۆرترین) لە جیاتی spinner
- **thumbnail** ی ڤیدیۆکە لە خۆکاری دەردەکەوێت
- سلایدەری تیژکردن بە ڕەنگی ڕوانگە + سوێچی نوێ
- شریتی پێشکەوتن بە **٪ و کاتی ماوە (ETA)**

**پشتگیری فیلمی گەورە و درێژ**
- نووسین **ڕاستەوخۆ** بۆ فایلی کۆتایی (بێ فایلی تەمپەڕی دووهەند) — فیلمی ٢ کاتژمێریش بێ کێشەی بیرگە
- `MediaMuxer` بە **FileDescriptor** (API 26+) — بێ کۆپیکردنی زیادە
- پلەی گەورەکردن بە خۆکاری کەم دەکرێتەوە ئەگەر ئینکۆدەری ئامێر نەیگرێتەوە (وەک 4K→16K)
- `PTS` ی ڕێکخراو بۆ stream ی B-frame، GOP ی ٢ چرکە
- پشکنینی **بیرگەی بەردەست** پێش دەستپێکردن
- کۆپیکردنی دەنگ بە streaming (بیرەوەری کەم)
- پاککردنەوەی خۆکاری فایلە کاتییەکان

## ✨ تایبەتمەندییەکان

| | |
|---|---|
| **پلەی گەورەکردن** | ٢× (خێرا)، ٣× (هاوسەنگ)، ٤× (زۆرترین) |
| **کوالیتی** | Bicubic (Catmull-Rom) بۆ خێرایی، **Lanczos-3** بۆ باشترین وردەکاری |
| **تیژکردن** | Unsharp-mask ی ڕێکخراو (٠–١٠٠٪) |
| **کۆدەک** | H.264 یان H.265/HEVC (خۆکار بەپێی ئامێر) |
| **دەنگ** | دەنگی ڕەسەن بەبێ گۆڕان دەگوازرێتەوە |
| **شوێنی پاشەکەوت** | `Movies/Video Upscaler/` |
| **زمان** | کوردی (سۆرانی) + ئینگلیزی |
| **تایبەتمەندی** | ١٠٠٪ لەسەر ئامێر · بێ ئینتەرنێت · بێ ڕیکلام · کۆدی سەرچاوە کراوە |

هەروەها دەتوانیت ڤیدیۆیەک لە Gallery یان فایل مەنجەرەوە **ڕاستەوخۆ بەم بەرنامەیە بکەیتەوە** (Open with / Share).

---

## 🔧 چۆن کار دەکات

```
MP4 ──► MediaExtractor ──► MediaCodec (دیکۆدەر)
                              │
                              ▼
                     YUV_420_888 → I420
                              │
                ┌─────────────┴─────────────┐
                │  Lanczos-3 / Bicubic       │  ← 16.16 fixed-point،
                │  (جیاکراوە: ئاسۆیی+ستوونی) │     چەند thread ی هاوکات
                └─────────────┬─────────────┘
                              ▼
                     Unsharp-mask (لەسەر Y)
                              │
                              ▼
                 MediaCodec (ئینکۆدەر) ──► MediaMuxer ──► MP4
                                                          ▲
                     دەنگی ڕەسەن (passthrough) ───────────┘
```

* هەموو پڕۆسەکە بە `MediaCodec` ی ئامێر (هاردوێر) دەکرێت — بۆیە خێرایە و پاتری کەم دەخوات.
* قەبارەی کۆدکراو (وەک ١٠٨٠ → ١٠٨٨) و crop rect بە خۆکاری ڕێکدەخرێت.
* ئەگەر ئینکۆدەرەکە HEVC پشتگیری نەکات، خۆکار بۆ H.264 دەگۆڕێت.
* ئەگەر ئامێرەکە نەتوانێت قەبارەی دەرچوو ئینکۆد بکات، پەیامێکی ڕوون پیشان دەدات.

### خێرایی خەمڵێنراو

| ئامێر | 1080p → 4K (٢×) Lanczos | 720p → 1440p (٢×) |
|---|---|---|
| Snapdragon 8xx / Dimensity 9xx | ~١–٢× خێرایی ڕاستەقینە | ~٢–٤× |
| ئامێری مامناوەند | ~٠٫٣–٠٫٦× | ~١–٢× |

> ئەلگۆریتمەکە تەنها plane ی Y بە تەواوی چاک دەکاتەوە و chroma بە هەمان کێشەڵ (kernel) بەرز دەکاتەوە — ئەمە ستانداردی پیشەسازییە بۆ SR ی ڤیدیۆ.

---

## 📁 پێکهاتەی پڕۆژە

```
app/src/main/java/com/videoupscaler/app/
├── MainActivity.java   # ڕووکار (build بە کۆد، بێ لایئۆت XML)
├── VideoEngine.java    # pipeline: دیکۆد → scale → sharpen → ئینکۆد → mux
├── Scaler.java         # Lanczos-3 / Bicubic + unsharp-mask، multi-thread
├── YuvUtils.java       # YUV_420_888 → I420 (crop/stride aware)
└── FileProvider.java   # هاوبەشکردنی ئەنجام بێ AndroidX
```

**هیچ dependency ی دەرەکی نییە** — تەنها Java و Android SDK. بۆیە APK ەکە ~٤٥ کیلۆبایتە و لەسەر هەموو ئامێرەکان (Android 7.0+) کار دەکات.

---

## 🛠 Build بە Android Studio

پڕۆژەکە `settings.gradle` و `app/build.gradle` ی هەیە — تەنها فۆڵدەرەکە بکەرەوە لە Android Studio (AGP 8.5، JDK 17) و Run بکە.

## 📄 مۆڵەت

MIT — بەخۆڕایی بەکاری بهێنە و بگۆڕە.
