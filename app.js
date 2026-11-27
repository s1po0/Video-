'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');

const { getVideoInfo, DEMO_MODE } = require('./src/youtube');
const { downloadClip, downloadSubtitles, TMP_DIR } = require('./src/download');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

/* ----------------------------- job store ----------------------------- */

const jobs = new Map();

function createJob() {
  const id = crypto.randomUUID();
  const job = {
    id,
    status: 'pending', // pending | running | done | error
    percent: 0,
    phase: 'starting',
    filePath: null,
    fileName: null,
    error: null,
    createdAt: Date.now(),
    listeners: new Set(),
  };
  jobs.set(id, job);
  return job;
}

function emit(job, event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  job.listeners.forEach((res) => {
    try { res.write(payload); } catch { /* ignore broken pipe */ }
  });
}

function updateJob(job, patch) {
  Object.assign(job, patch);
  emit(job, 'progress', {
    status: job.status,
    percent: job.percent,
    phase: job.phase,
    error: job.error,
  });
}

// Periodic cleanup of stale jobs and their temp files.
setInterval(() => {
  const now = Date.now();
  for (const [id, job] of jobs) {
    if (now - job.createdAt > 10 * 60 * 1000) {
      if (job.filePath && fs.existsSync(job.filePath)) {
        try { fs.unlinkSync(job.filePath); } catch { /* noop */ }
      }
      jobs.delete(id);
    }
  }
}, 60 * 1000);

/* ------------------------------ helpers ------------------------------- */

function isValidUrl(value) {
  if (typeof value !== 'string' || value.trim().length === 0) return false;
  if (value.length > 2000) return false;
  return /^https?:\/\//i.test(value.trim());
}

const FORMATS = new Set(['mp4', 'webm', 'mp3']);
const QUALITIES = new Set(['best', '1080', '720', '480', '360', '240', '144']);

function fail(res, status, error, extra = {}) {
  res.status(status).json({ ok: false, error, ...extra });
}

/* ------------------------------- routes ------------------------------- */

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, demo: DEMO_MODE });
});

app.post('/api/info', async (req, res) => {
  const { url } = req.body || {};
  if (!isValidUrl(url)) return fail(res, 400, 'Please provide a valid YouTube URL.');
  try {
    const video = await getVideoInfo(url.trim());
    res.json({ ok: true, video });
  } catch (err) {
    console.error('[info]', err.message);
    fail(res, 502, 'Could not fetch video information. Please check the URL and try again.', { code: err.code });
  }
});

app.post('/api/download', async (req, res) => {
  const { url, start, end, format, quality, title } = req.body || {};

  if (!isValidUrl(url)) return fail(res, 400, 'Please provide a valid YouTube URL.');
  if (!FORMATS.has(format)) return fail(res, 400, 'Unsupported format. Use mp4, webm or mp3.');
  if (quality && !QUALITIES.has(quality)) return fail(res, 400, 'Unsupported quality.');

  const s = Number(start);
  const e = Number(end);
  if (!Number.isFinite(s) || !Number.isFinite(e) || s < 0 || e <= s) {
    return fail(res, 400, 'Start and end times are invalid.');
  }
  const maxClip = 3 * 60 * 60; // 3 hours safety cap
  if (e - s > maxClip) return fail(res, 400, `Clip is too long (max ${maxClip / 60} minutes).`);

  if (DEMO_MODE) {
    return fail(res, 503, 'This is preview / demo mode. Deploy SliceVid to a host with internet access to download real clips.', { demo: true });
  }

  const job = createJob();
  job.status = 'running';
  // Kick off processing without blocking the response.
  downloadClip({
    url: url.trim(),
    start: s,
    end: e,
    format,
    quality: quality || 'best',
    jobId: job.id,
    title,
    onProgress: ({ percent, phase }) => updateJob(job, { percent, phase }),
  })
    .then(({ filePath, fileName }) => {
      job.filePath = filePath;
      job.fileName = fileName;
      job.status = 'done';
      job.percent = 100;
      emit(job, 'done', { fileName });
    })
    .catch((err) => {
      console.error('[download]', err.message);
      job.status = 'error';
      job.error = err.message || 'Download failed.';
      emit(job, 'error', { error: job.error, code: err.code });
    });

  res.json({ ok: true, jobId: job.id });
});

app.get('/api/job/:id/events', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).end();

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write('retry: 3000\n\n');
  res.write(`event: state\ndata: ${JSON.stringify({
    status: job.status, percent: job.percent, phase: job.phase, error: job.error,
  })}\n\n`);

  job.listeners.add(res);
  req.on('close', () => job.listeners.delete(res));
});

app.get('/api/job/:id/file', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job || !job.filePath || !fs.existsSync(job.filePath)) {
    return res.status(404).json({ ok: false, error: 'File not ready or expired.' });
  }
  const filePath = job.filePath;
  const fileName = job.fileName || path.basename(filePath);
  res.download(filePath, fileName, (err) => {
    if (err) console.error('[file]', err.message);
    try { fs.unlinkSync(filePath); } catch { /* noop */ }
    jobs.delete(job.id);
  });
});

app.post('/api/subtitles', async (req, res) => {
  const { url, lang, format, title } = req.body || {};
  if (!isValidUrl(url)) return fail(res, 400, 'Please provide a valid YouTube URL.');
  if (!lang) return fail(res, 400, 'Please choose a subtitle language.');
  if (!['srt', 'vtt'].includes(format)) return fail(res, 400, 'Subtitle format must be srt or vtt.');

  if (DEMO_MODE) {
    return fail(res, 503, 'This is preview / demo mode. Deploy SliceVid to a host with internet access to download real subtitles.', { demo: true });
  }

  try {
    const { filePath, fileName } = await downloadSubtitles({
      url: url.trim(),
      lang,
      format,
      jobId: crypto.randomUUID(),
      title,
    });
    res.download(filePath, fileName, (err) => {
      if (err) console.error('[subtitles]', err.message);
      try { fs.unlinkSync(filePath); } catch { /* noop */ }
    });
  } catch (err) {
    console.error('[subtitles]', err.message);
    fail(res, 502, err.message || 'Could not download subtitles.', { code: err.code });
  }
});

// Make sure the tmp directory exists.
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

module.exports = app;
