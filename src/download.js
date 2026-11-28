'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { resolveYtDlp, resolveFfmpeg } = require('./binaries');

const TMP_DIR = path.join(__dirname, '..', 'tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

function secToTimestamp(sec) {
  sec = Math.max(0, Math.floor(Number(sec) || 0));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function sanitizeFilename(name) {
  return (name || 'video')
    .replace(/[\\/:*?"<>|]+/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 120) || 'video';
}

function findOutputFile(jobId) {
  const files = fs.readdirSync(TMP_DIR).filter((f) => f.startsWith(jobId));
  // Prefer the final file (not a .part / .ytdl temp file).
  const final = files.find((f) => !/\.(part|ytdl)$/.test(f));
  if (!final) return null;
  return path.join(TMP_DIR, final);
}

/**
 * Download a trimmed section of a YouTube video.
 *
 * @param {object} opts
 * @param {string} opts.url
 * @param {number} opts.start   start offset in seconds
 * @param {number} opts.end     end offset in seconds
 * @param {'mp4'|'webm'|'mp3'} opts.format
 * @param {string} opts.quality 'best' or a height like '720'
 * @param {string} opts.jobId   unique id used for the temp file name
 * @param {(p:{percent:number,phase:string})=>void} onProgress
 * @returns {Promise<{filePath:string, fileName:string, ext:string}>}
 */
function downloadClip({ url, start, end, format, quality, jobId, title = 'video', onProgress }) {
  return new Promise((resolve, reject) => {
    const ytdlp = resolveYtDlp();
    if (!ytdlp) {
      return reject(Object.assign(new Error('yt-dlp binary not found'), { code: 'YTDLP_MISSING' }));
    }
    const ffmpeg = resolveFfmpeg();

    const ext = format === 'mp3' ? 'mp3' : format;
    const outTemplate = path.join(TMP_DIR, `${jobId}.%(ext)s`);

    const args = [
      '--no-warnings',
      '--no-call-home',
      '--no-playlist',
      '--force-keyframes-at-cuts',
      '--download-sections', `*${secToTimestamp(start)}-${secToTimestamp(end)}`,
      '-o', outTemplate,
    ];

    if (ffmpeg) args.unshift('--ffmpeg-location', ffmpeg);

    if (format === 'mp3') {
      args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
    } else {
      const h = quality && quality !== 'best' ? `[height<=${quality}]` : '';
      args.push('-f', `bv${h}+ba/b${h}/b`);
      args.push('--merge-output-format', format);
    }
    args.push(url);

    const cp = spawn(ytdlp, args, { env: process.env });
    let stderr = '';

    const progressRe = /\[download\]\s+(\d+(?:\.\d+)?)%/;
    const mergeRe = /\[Merger\]|\[ExtractAudio\]|merging|Extracting audio/i;

    cp.stderr.on('data', (d) => {
      const s = d.toString();
      stderr += s;
      if (onProgress) {
        const m = s.match(progressRe);
        if (m) onProgress({ percent: Math.min(100, parseFloat(m[1])), phase: 'download' });
        else if (mergeRe.test(s)) onProgress({ percent: 100, phase: 'processing' });
      }
    });
    cp.stdout.on('data', () => {});

    cp.on('error', (err) => reject(err));
    cp.on('close', (code) => {
      if (code !== 0) {
        return reject(Object.assign(new Error(stderr.trim() || `yt-dlp exited with code ${code}`), { code: 'YTDLP_ERROR' }));
      }
      const filePath = findOutputFile(jobId);
      if (!filePath) {
        return reject(Object.assign(new Error('Output file was not produced.'), { code: 'NO_OUTPUT' }));
      }
      const outExt = path.extname(filePath).replace('.', '') || ext;
      resolve({ filePath, fileName: `${sanitizeFilename(title)}.${outExt}`, ext: outExt });
    });
  });
}

/**
 * Download a subtitle / caption track and convert it to SRT or VTT.
 */
function downloadSubtitles({ url, lang, format, jobId, title = 'video' }) {
  return new Promise((resolve, reject) => {
    const ytdlp = resolveYtDlp();
    if (!ytdlp) {
      return reject(Object.assign(new Error('yt-dlp binary not found'), { code: 'YTDLP_MISSING' }));
    }
    const outTemplate = path.join(TMP_DIR, `${jobId}.%(ext)s`);
    const args = [
      '--no-warnings',
      '--no-call-home',
      '--no-playlist',
      '--skip-download',
      '--write-subs',
      '--write-auto-subs',
      '--sub-langs', lang,
      '--sub-format', 'vtt/best',
      '--convert-subs', format,
      '-o', outTemplate,
      url,
    ];

    const ffmpeg = resolveFfmpeg();
    if (ffmpeg) args.unshift('--ffmpeg-location', ffmpeg);
    const cp = spawn(ytdlp, args, { env: process.env });
    let stderr = '';
    cp.stderr.on('data', (d) => { stderr += d.toString(); });
    cp.stdout.on('data', () => {});
    cp.on('error', (err) => reject(err));
    cp.on('close', (code) => {
      if (code !== 0) {
        return reject(Object.assign(new Error(stderr.trim() || `yt-dlp exited with code ${code}`), { code: 'YTDLP_ERROR' }));
      }
      const filePath = findOutputFile(jobId);
      if (!filePath) {
        return reject(Object.assign(new Error(`Subtitles for "${lang}" are not available for this video.`), { code: 'NO_SUBS' }));
      }
      const outExt = path.extname(filePath).replace('.', '') || format;
      resolve({ filePath, fileName: `${sanitizeFilename(title)}.${outExt}`, ext: outExt });
    });
  });
}

module.exports = { downloadClip, downloadSubtitles, secToTimestamp, sanitizeFilename, findOutputFile, TMP_DIR };
