'use strict';
const $ = (id) => document.getElementById(id);
const native = window.Capacitor?.Plugins?.DeviceDownloader;
let currentUrl = '', subtitleClient = 'default', duration = 0, clipMode = false, loading = false, taskState = 'idle', lastState = 'idle';
const error = $('error'), status = $('status'), statusText = $('status-text');

function showScreen(name) {
  for (const screen of ['link', 'edit', 'subs', 'files']) {
    $('screen-' + screen).hidden = screen !== name;
    const button = document.querySelector('[data-screen="' + screen + '"]');
    if (screen === name) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  }
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  if (name === 'files') refreshDownloads();
}
document.querySelectorAll('[data-screen]').forEach(button => button.addEventListener('click', () => showScreen(button.dataset.screen)));
document.querySelectorAll('.go-link').forEach(button => button.addEventListener('click', () => showScreen('link')));
$('edit-range').addEventListener('click', () => showScreen('edit'));

function showError(message) { error.textContent = message || 'هەڵەیەک ڕوویدا؛ دووبارە هەوڵ بدەوە.'; error.hidden = false; error.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
function buttons() {
  const busy = loading || taskState === 'queued' || taskState === 'running';
  $('load').disabled = busy; $('download').disabled = busy; $('subtitle').disabled = busy || !$('languages').value;
  $('choose-folder').disabled = busy;
}
function time(sec) {
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return (h ? String(h).padStart(2, '0') + ':' : '') + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}
function seconds(text) {
  if (!/^\d+(?::[0-5]?\d){0,2}$/.test(text.trim())) throw new Error('کات بە شێوەی 01:30 بنووسە.');
  return text.trim().split(':').reduce((total, value) => total * 60 + Number(value), 0);
}
function renderClip() {
  const start = Number($('start-range').value), end = Number($('end-range').value);
  $('start-label').textContent = time(start); $('end-label').textContent = time(end);
  $('clip-length').textContent = time(end - start);
  $('start').value = time(start); $('end').value = time(end);
  updateRangeSummary();
}
function updateRangeSummary() {
  $('subtitle-range').textContent = clipMode ? time(Number($('start-range').value)) + ' - ' + time(Number($('end-range').value)) : 'هەموو ڤیدیۆکە';
}
function mode(clip) {
  clipMode = clip; $('clip-controls').hidden = !clip;
  $('full-mode').classList.toggle('active', !clip); $('clip-mode').classList.toggle('active', clip);
  $('full-mode').setAttribute('aria-pressed', String(!clip)); $('clip-mode').setAttribute('aria-pressed', String(clip));
  updateRangeSummary();
}
$('full-mode').onclick = () => mode(false);
$('clip-mode').onclick = () => mode(true);
$('start-range').addEventListener('input', () => {
  if (Number($('start-range').value) >= Number($('end-range').value)) $('start-range').value = Math.max(0, Number($('end-range').value) - 1);
  renderClip();
});
$('end-range').addEventListener('input', () => {
  if (Number($('end-range').value) <= Number($('start-range').value)) $('end-range').value = Math.min(duration, Number($('start-range').value) + 1);
  renderClip();
});
for (const id of ['start', 'end']) $(id).addEventListener('change', () => {
  try {
    const start = seconds($('start').value), end = seconds($('end').value);
    if (start >= end || end > duration) throw new Error('کاتەکان دەبێت لە سنووری ڤیدیۆکەدا بن و کۆتایی دوای دەستپێک بێت.');
    $('start-range').value = start; $('end-range').value = end; renderClip(); error.hidden = true;
  } catch (err) { showError(err.message); }
});

async function updateStatus() {
  if (!native) return;
  try {
    const data = await native.status(); taskState = data.state;
    if (!loading && data.state !== 'idle') {
      status.hidden = false; statusText.textContent = data.message; if (data.percent < 0) $('progress').removeAttribute('value'); else $('progress').value = data.percent || 0;
      status.classList.toggle('failed', data.state === 'error');
      $('background-hint').hidden = data.state !== 'running' && data.state !== 'queued';
    }
    if (data.state === 'done' && lastState !== 'done') refreshDownloads();
    lastState = data.state;
    buttons();
  } catch (e) { /* next refresh retries */ }
}
async function folderLabel() { try { const label = (await native.getFolder()).label; $('folder-label').textContent = label; $('downloads-folder').textContent = label; } catch {} }
async function refreshDownloads() {
  if (!native) return;
  const list = $('download-list');
  try {
    const result = await native.listDownloads(); list.replaceChildren();
    if (!result.files.length) { list.textContent = 'هیچ فایلێکی SliceVid لەم شوێنە نەدۆزرایەوە.'; return; }
    result.files.forEach(file => {
      const item = document.createElement('button'); item.type = 'button'; item.className = 'download-item'; item.dir = 'ltr'; item.textContent = '▶  ' + file.name;
      item.onclick = async () => { try { await native.openDownload({uri: file.uri}); } catch (err) { showError(err.message); } };
      list.appendChild(item);
    });
  } catch (err) { list.textContent = err.message || 'نەتوانرا لیستی فایلەکان بکرێتەوە.'; }
}
$('refresh-downloads').onclick = refreshDownloads;
if (native) { folderLabel(); refreshDownloads(); updateStatus(); setInterval(updateStatus, 2000); document.addEventListener('visibilitychange', () => { if (!document.hidden) updateStatus(); }); }
else showError('ئەم پەڕەیە تەنها لە ئەپی ئەندرۆید کار دەکات.');
$('choose-folder').onclick = async () => { try { const folder = await native.chooseFolder(); $('folder-label').textContent = folder.label; $('downloads-folder').textContent = folder.label; refreshDownloads(); } catch (err) { showError(err.message); } };

$('form').addEventListener('submit', async (e) => {
  e.preventDefault(); if (!native) return;
  const url = $('url').value.trim(); error.hidden = true; $('details').hidden = true;
  $('subtitle-details').hidden = true; $('editor-empty').hidden = false; $('subs-empty').hidden = false; currentUrl = '';
  loading = true; buttons(); status.hidden = false; status.classList.remove('failed'); $('background-hint').hidden = true; statusText.textContent = 'ئامادەکردنی ڤیدیۆ... تکایە چاوەڕێ بکە.'; $('progress').removeAttribute('value');
  try {
    const video = await native.info({ url });
    currentUrl = url; subtitleClient = video.subtitleClient || 'default'; duration = Math.floor(video.duration || 0);
    $('title').textContent = video.title; $('channel').textContent = video.channel; $('thumb').src = video.thumbnail;
    const options = $('languages'); options.replaceChildren();
    (video.subtitles || []).forEach(code => { const o = document.createElement('option'); o.value = code; o.textContent = code; options.appendChild(o); });
    if (!options.length) { const o = document.createElement('option'); o.value = ''; o.textContent = 'ژێرنووس نەدۆزرایەوە یان بەردەست نییە'; options.appendChild(o); }
    for (const id of ['start-range', 'end-range']) { $(id).max = duration; $(id).disabled = duration < 1; }
    $('clip-mode').disabled = duration < 1;
    $('start-range').value = 0; $('end-range').value = Math.min(30, duration); renderClip(); mode(false);
    $('details').hidden = false; $('subtitle-details').hidden = false; $('editor-empty').hidden = true; $('subs-empty').hidden = true; status.hidden = true; showScreen('edit');
  } catch (err) { status.hidden = true; showError(err.message); }
  finally { loading = false; buttons(); }
});

function selectedRange() {
  if (!clipMode) return { start: 0, end: 0 };
  const start = seconds($('start').value), end = seconds($('end').value);
  if (start >= end || end > duration) throw new Error('کاتی دەستپێک و کۆتایی بپشکنە.');
  return { start, end };
}

$('download').addEventListener('click', async () => {
  error.hidden = true;
  try {
    const range = selectedRange();
    await native.download({ url: currentUrl, ...range, format: $('format').value, quality: $('quality').value });
    taskState = 'queued'; buttons(); status.hidden = false; statusText.textContent = 'دابەزاندن دەستی پێکرد...'; $('progress').removeAttribute('value'); status.scrollIntoView({behavior: 'smooth', block: 'center'}); updateStatus();
  } catch (err) { showError(err.message); }
});
$('subtitle').addEventListener('click', async () => {
  if (!$('languages').value) return;
  error.hidden = true;
  try {
    const range = selectedRange();
    await native.subtitles({ url: currentUrl, ...range, language: $('languages').value, format: $('subformat').value, subtitleClient });
    taskState = 'queued'; buttons(); status.hidden = false; statusText.textContent = 'دابەزاندنی ژێرنووس...'; $('progress').removeAttribute('value'); updateStatus();
  } catch (err) { showError(err.message); }
});
