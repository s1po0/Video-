'use strict';

const $ = (sel) => document.querySelector(sel);

const state = {
  video: null,
  duration: 0,
  format: 'mp4',
  quality: 'best',
  downloading: false,
};

/* ----------------------------- helpers ----------------------------- */

function fmtTime(sec) {
  sec = Math.max(0, Math.floor(sec || 0));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const p = (n) => String(n).padStart(2, '0');
  return `${p(h)}:${p(m)}:${p(s)}`;
}

function showError(el, msg) {
  el.textContent = msg;
  el.hidden = false;
}
function clearError(el) {
  el.hidden = true;
  el.textContent = '';
}

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  let data = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = { error: text }; }
  return { ok: res.ok, status: res.status, data };
}

/* --------------------------- fetch video --------------------------- */

const urlForm = $('#url-form');
const urlInput = $('#url-input');
const urlSubmit = $('#url-submit');
const urlError = $('#url-error');

urlForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError(urlError);
  const url = urlInput.value.trim();
  if (!url) return;

  urlSubmit.disabled = true;
  urlSubmit.textContent = 'Loading…';
  try {
    const { ok, data } = await postJSON('/api/info', { url });
    if (!ok || !data.ok) {
      showError(urlError, data.error || 'Could not load that video. Check the link and try again.');
      return;
    }
    loadVideo(data.video, url);
  } catch (err) {
    showError(urlError, 'Network error. Please try again.');
  } finally {
    urlSubmit.disabled = false;
    urlSubmit.textContent = 'Trim video';
  }
});

function loadVideo(video, originalUrl) {
  state.video = video;
  state.duration = Number(video.duration) || 0;

  $('#video-thumb').src = video.thumbnail || '';
  $('#video-title').textContent = video.title || 'Untitled';
  $('#video-channel').textContent = video.uploader || '';
  $('#video-duration').textContent = fmtTime(state.duration);
  const link = $('#video-link');
  link.href = video.webpageUrl || originalUrl;

  if (video.demo) $('#demo-banner').hidden = false;

  setupTimeline();
  setupQuality(video);
  setupSubtitles(video);

  $('#editor').hidden = false;
  $('#editor').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ----------------------------- timeline ---------------------------- */

const startRange = $('#start-range');
const endRange = $('#end-range');
const selRegion = $('#timeline-selected');

function setupTimeline() {
  const d = state.duration;
  [startRange, endRange].forEach((r) => { r.min = 0; r.max = d; r.step = 0.1; });
  startRange.value = 0;
  endRange.value = d;

  // ticks
  const ticks = $('#timeline-ticks');
  ticks.innerHTML = '';
  const n = 5;
  for (let i = 0; i <= n; i++) {
    const span = document.createElement('span');
    span.textContent = fmtTime((d * i) / n);
    ticks.appendChild(span);
  }
  updateTimeline();
}

function getStart() { return Number(startRange.value); }
function getEnd() { return Number(endRange.value); }

function updateTimeline() {
  let s = getStart();
  let e = getEnd();
  if (s > e) { // keep start strictly before end
    if (document.activeElement === startRange) s = e;
    else e = s;
    startRange.value = s; endRange.value = e;
  }
  const d = state.duration || 1;
  const left = (s / d) * 100;
  const right = 100 - (e / d) * 100;
  selRegion.style.left = left + '%';
  selRegion.style.right = right + '%';

  $('#start-time').textContent = fmtTime(s);
  $('#end-time').textContent = fmtTime(e);
  $('#clip-length').textContent = fmtTime(e - s);

  // make the thumb on the side the user is editing easier to grab
  if (s > d / 2) { startRange.style.zIndex = 5; endRange.style.zIndex = 4; }
  else { startRange.style.zIndex = 4; endRange.style.zIndex = 5; }
}

[startRange, endRange].forEach((r) => r.addEventListener('input', updateTimeline));

/* ----------------------------- options ----------------------------- */

const formatSeg = $('#format-seg');
const qualityGroup = $('#quality-group');
const qualitySelect = $('#quality-select');

formatSeg.addEventListener('click', (e) => {
  const btn = e.target.closest('.seg-btn');
  if (!btn) return;
  formatSeg.querySelectorAll('.seg-btn').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  state.format = btn.dataset.format;
  qualityGroup.style.display = state.format === 'mp3' ? 'none' : 'flex';
});

function setupQuality(video) {
  qualitySelect.innerHTML = '';
  const best = document.createElement('option');
  best.value = 'best'; best.textContent = 'Best available';
  qualitySelect.appendChild(best);
  (video.qualities || []).forEach((h) => {
    const o = document.createElement('option');
    o.value = String(h); o.textContent = `${h}p`;
    qualitySelect.appendChild(o);
  });
  qualitySelect.value = 'best';
  state.quality = 'best';
  qualityGroup.style.display = state.format === 'mp3' ? 'none' : 'flex';
}

qualitySelect.addEventListener('change', () => { state.quality = qualitySelect.value; });

/* --------------------------- subtitles ----------------------------- */

const subLang = $('#sub-lang');
const subFormat = $('#sub-format');
const subsBtn = $('#subs-btn');
const subsError = $('#subs-error');

function setupSubtitles(video) {
  subLang.innerHTML = '';
  const subs = video.subtitles || [];
  if (!subs.length) {
    const o = document.createElement('option');
    o.value = ''; o.textContent = 'No subtitles available';
    subLang.appendChild(o);
    subsBtn.disabled = true;
    return;
  }
  subsBtn.disabled = false;
  subs.forEach((s) => {
    const o = document.createElement('option');
    o.value = s.code;
    o.textContent = `${s.name}${s.auto ? ' (auto)' : ''} [${s.code}]`;
    subLang.appendChild(o);
  });
}

subsBtn.addEventListener('click', async () => {
  clearError(subsError);
  const lang = subLang.value;
  if (!lang) { showError(subsError, 'No subtitle language available for this video.'); return; }
  subsBtn.disabled = true;
  subsBtn.textContent = 'Downloading…';
  try {
    const res = await fetch('/api/subtitles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: state.video.webpageUrl,
        lang,
        format: subFormat.value,
        title: state.video.title,
      }),
    });
    if (!res.ok) {
      let msg = 'Could not download subtitles.';
      try { msg = (await res.json()).error || msg; } catch {}
      showError(subsError, msg);
      return;
    }
    const blob = await res.blob();
    const fn = (state.video.title || 'video').replace(/[\\/:*?"<>|]+/g, '').slice(0, 120) + '.' + (subFormat.value);
    triggerDownload(blob, fn);
  } catch {
    showError(subsError, 'Network error while downloading subtitles.');
  } finally {
    subsBtn.disabled = false;
    subsBtn.textContent = 'Download subtitles';
  }
});

/* ----------------------------- download ----------------------------- */

const downloadBtn = $('#download-btn');
const progress = $('#progress');
const progressFill = $('#progress-fill');
const progressText = $('#progress-text');

downloadBtn.addEventListener('click', async () => {
  if (state.downloading || !state.video) return;
  const start = getStart();
  const end = getEnd();
  if (!(end > start)) { alert('Please set an end time after the start time.'); return; }

  state.downloading = true;
  downloadBtn.disabled = true;
  downloadBtn.textContent = 'Preparing…';
  progress.hidden = false;
  progressFill.style.width = '0%';
  progressText.textContent = 'Starting…';

  try {
    const { ok, data } = await postJSON('/api/download', {
      url: state.video.webpageUrl,
      start, end,
      format: state.format,
      quality: state.quality,
      title: state.video.title,
    });
    if (!ok || !data.ok) {
      showDownloadError(data.error || 'Could not start the download.');
      return;
    }
    await streamProgress(data.jobId, state.video.title);
  } catch {
    showDownloadError('Network error while starting the download.');
  }
});

function showDownloadError(msg) {
  progressText.textContent = msg;
  progressText.style.color = 'var(--danger)';
  state.downloading = false;
  downloadBtn.disabled = false;
  downloadBtn.textContent = 'Download clip';
}

function streamProgress(jobId, title) {
  return new Promise((resolve) => {
    const es = new EventSource('/api/job/' + jobId + '/events');

    es.addEventListener('progress', (e) => {
      const d = JSON.parse(e.data);
      const pct = Math.round(d.percent || 0);
      progressFill.style.width = pct + '%';
      const phase = d.phase === 'processing' ? 'Merging & finalizing…' : `Downloading… ${pct}%`;
      progressText.textContent = d.status === 'error' ? (d.error || 'Error') : phase;
    });

    es.addEventListener('done', () => {
      progressText.textContent = 'Done! Starting download…';
      progressFill.style.width = '100%';
      es.close();
      // Trigger the actual file download.
      window.location.href = '/api/job/' + jobId + '/file';
      finishDownload();
      resolve();
    });

    es.addEventListener('error', (e) => {
      let msg = 'Download failed.';
      try { msg = JSON.parse(e.data).error || msg; } catch {}
      es.close();
      showDownloadError(msg);
      resolve();
    });

    // Fallback: if the connection drops, poll job state.
    es.onerror = () => {
      // EventSource will try to reconnect; if job already done it will emit 'done'.
    };
  });
}

function finishDownload() {
  state.downloading = false;
  downloadBtn.disabled = false;
  downloadBtn.textContent = 'Download clip';
  // keep progress visible briefly so the user sees "Done"
  setTimeout(() => { progress.hidden = true; }, 2500);
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
