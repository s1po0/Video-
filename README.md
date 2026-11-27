# SliceVid — YouTube Video Trimmer & Downloader

Cut, trim and download **any part** of a YouTube video. Paste a link, choose
your start and end timestamps, and download the exact clip you want as **MP4**,
**WebM** or **MP3** — plus download the **subtitles** as **SRT** or **VTT**.
No software to install, no watermark, no account required.

This project is a self-hostable, open-source alternative to sites like
[slicetube.io](https://www.slicetube.io/).

---

## Features

- 🎬 **Trim any section** — set start/end times with a draggable timeline.
- 📦 **Multiple formats** — MP4, WebM (video) and MP3 (audio only).
- 📝 **Subtitle download** — grab captions in SRT or VTT (including
  auto-generated tracks when available).
- 🔒 **No watermark, no account** — paste a link and go.
- ⚡ **Modern UI** — fast, responsive single-page interface.

## How it works

The backend uses [`yt-dlp`](https://github.com/yt-dlp/yt-dlp) to fetch video
metadata and download the selected section (`--download-sections`) and
[`ffmpeg`](https://ffmpeg.org/) (via `ffmpeg-static`) to merge/transcode the
clip. The frontend is a small static page that talks to a tiny JSON API.

## Quick start (local)

```bash
npm install
node server.js
# open http://localhost:3000
```

> **Note:** `npm install` downloads the `ffmpeg` and `yt-dlp` binaries. Your
> machine needs internet access to GitHub for that step (the binaries are
> fetched from GitHub releases). If you already have `ffmpeg` and `yt-dlp`
> installed system-wide, the app will use those instead.

### Environment

| Variable | Default | Description |
| -------- | ------- | ----------- |
| `PORT`   | `3000`  | Port the server listens on. |

## Deploy

### Render (easiest)

1. Push this repo to GitHub.
2. In Render, create a new **Web Service** → connect the repo.
3. Render auto-detects `render.yaml` (`npm install` + `node server.js`).
4. Done — the `/api/health` endpoint is used for health checks.

### Docker / any VPS

```bash
docker build -t slicevid .
docker run -p 3000:3000 slicevid
```

### Vercel

This repo is set up for Vercel via `api/index.js` + `vercel.json`. Import the
repo in Vercel and deploy.

> ⚠️ **Vercel note:** serverless functions have execution time limits
> (60s on Hobby, up to 300s on Pro) and binary-size limits. Short clips work
> fine; very long or very high-resolution clips may time out. For heavy use,
> prefer Render / Railway / a VPS.

## API

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET`  | `/api/health` | Health check. Returns `{ ok, demo }`. |
| `POST` | `/api/info` | Body `{ url }` → video metadata, qualities, subtitle languages. |
| `POST` | `/api/download` | Body `{ url, start, end, format, quality }` → starts a job, returns `{ jobId }`. |
| `GET`  | `/api/job/:id/events` | Server-Sent Events stream with download progress. |
| `GET`  | `/api/job/:id/file` | Streams the finished file (triggers a download). |
| `POST` | `/api/subtitles` | Body `{ url, lang, format }` → streams the subtitle file. |

### Demo / preview mode

If the backend cannot find the `yt-dlp` binary (e.g. it is running in an
environment without internet access to download the tools), it automatically
serves a **demo video** from `/api/info` so the UI can be explored end-to-end.
Real downloads/subtitles require a deployment with internet access.

## Legal

This tool is provided for personal use. Respect copyright and YouTube's Terms
of Service. Do not download content you do not have the right to access or
redistribute.
