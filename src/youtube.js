'use strict';

const { spawn } = require('child_process');
const { resolveYtDlp } = require('./binaries');

const DEMO_MODE = !resolveYtDlp();

/**
 * Map of ISO 639-1 language codes to human readable names.
 * Only a curated subset is listed; anything missing falls back to its code.
 */
const LANG_NAMES = {
  en: 'English', ar: 'Arabic', es: 'Spanish', fr: 'French', de: 'German',
  it: 'Italian', pt: 'Portuguese', ru: 'Russian', ja: 'Japanese', ko: 'Korean',
  zh: 'Chinese', 'zh-Hans': 'Chinese (Simplified)', 'zh-Hant': 'Chinese (Traditional)',
  hi: 'Hindi', tr: 'Turkish', nl: 'Dutch', pl: 'Polish', sv: 'Swedish',
  uk: 'Ukrainian', id: 'Indonesian', vi: 'Vietnamese', th: 'Thai', fa: 'Persian',
  he: 'Hebrew', el: 'Greek', cs: 'Czech', ro: 'Romanian', hu: 'Hungarian',
  fi: 'Finnish', da: 'Danish', no: 'Norwegian', bg: 'Bulgarian', hr: 'Croatian',
  sk: 'Slovak', sl: 'Slovenian', sr: 'Serbian', ms: 'Malay', tl: 'Filipino',
  bn: 'Bengali', ur: 'Urdu', ps: 'Pashto', ku: 'Kurdish', ca: 'Catalan',
  eu: 'Basque', gl: 'Galician', af: 'Afrikaans', sw: 'Swahili', am: 'Amharic',
};

function langName(code) {
  if (!code) return 'Unknown';
  if (LANG_NAMES[code]) return LANG_NAMES[code];
  // try base code (e.g. "en-US" -> "en")
  const base = code.split('-')[0];
  if (LANG_NAMES[base]) return LANG_NAMES[base];
  return code;
}

function runYtDlp(args, { onLog } = {}) {
  return new Promise((resolve, reject) => {
    const bin = resolveYtDlp();
    if (!bin) return reject(Object.assign(new Error('yt-dlp binary not found'), { code: 'YTDLP_MISSING' }));

    const cp = spawn(bin, args, { env: process.env });
    let stdout = '';
    let stderr = '';

    cp.stdout.on('data', (d) => {
      stdout += d.toString();
      if (onLog) onLog(d.toString(), 'stdout');
    });
    cp.stderr.on('data', (d) => {
      const s = d.toString();
      stderr += s;
      if (onLog) onLog(s, 'stderr');
    });
    cp.on('error', (err) => reject(err));
    cp.on('close', (code) => {
      if (code === 0) resolve(stdout);
      else reject(Object.assign(new Error(stderr.trim() || `yt-dlp exited with code ${code}`), { code: 'YTDLP_ERROR', exitCode: code }));
    });
  });
}

function normalizeInfo(data) {
  const duration = Number(data.duration) || 0;
  const viewCount = Number(data.view_count) || 0;

  // Build the quality menu from formats that contain video.
  const heights = new Set();
  (data.formats || []).forEach((f) => {
    if (f.vcodec && f.vcodec !== 'none' && f.height) heights.add(Number(f.height));
  });
  const qualities = Array.from(heights).sort((a, b) => b - a);

  // Collect subtitle languages (manual + auto-generated).
  const subMap = new Map();
  const addSubs = (obj, auto) => {
    Object.keys(obj || {}).forEach((code) => {
      if (!subMap.has(code)) subMap.set(code, { code, name: langName(code), auto });
      else subMap.get(code).auto = subMap.get(code).auto || auto;
    });
  };
  addSubs(data.subtitles, false);
  addSubs(data.automatic_captions, true);

  return {
    id: data.id,
    title: data.title,
    uploader: data.uploader || data.channel || data.channel_id || 'Unknown',
    duration,
    thumbnail: Array.isArray(data.thumbnails) && data.thumbnails.length
      ? data.thumbnails[data.thumbnails.length - 1].url
      : (data.thumbnail || ''),
    viewCount,
    uploadDate: data.upload_date || '',
    webpageUrl: data.webpage_url || data.url || '',
    qualities,
    subtitles: Array.from(subMap.values()),
    demo: false,
  };
}

async function getVideoInfo(url) {
  if (DEMO_MODE) return getDemoInfo(url);

  const stdout = await runYtDlp([
    '--dump-single-json',
    '--no-warnings',
    '--no-call-home',
    '--no-playlist',
    '--skip-download',
    '--extractor-args', 'youtube:skip=translated_subs',
    url,
  ]);

  const data = JSON.parse(stdout);
  return normalizeInfo(data);
}

/* ------------------------------------------------------------------ */
/* Demo / preview mode                                                 */
/* ------------------------------------------------------------------ */

function getDemoInfo(url) {
  // Extract a plausible video id from the pasted URL so the thumbnail looks real.
  let id = 'dQw4w9WgXcQ';
  const m = /(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/.exec(url || '');
  if (m) id = m[1];

  return {
    id,
    title: 'Demo Video — SliceVid Preview',
    uploader: 'SliceVid',
    duration: 213,
    thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    viewCount: 1048576,
    uploadDate: '20240101',
    webpageUrl: `https://www.youtube.com/watch?v=${id}`,
    qualities: [1080, 720, 480, 360, 240, 144],
    subtitles: [
      { code: 'en', name: 'English', auto: false },
      { code: 'es', name: 'Spanish', auto: false },
      { code: 'ar', name: 'Arabic', auto: true },
      { code: 'fr', name: 'French', auto: true },
    ],
    demo: true,
  };
}

module.exports = { getVideoInfo, DEMO_MODE, langName };
