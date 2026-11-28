'use strict';
const $ = (id) => document.getElementById(id);
const native = window.Capacitor?.Plugins?.DeviceDownloader;
let currentUrl = '', duration = 0, clipMode = false, loading = false, taskState = 'idle';
const error = $('error'), status = $('status'), statusText = $('status-text');

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
}
function mode(clip) {
  clipMode = clip; $('clip-controls').hidden = !clip;
  $('full-mode').classList.toggle('active', !clip); $('clip-mode').classList.toggle('active', clip);
  $('full-mode').setAttribute('aria-pressed', String(!clip)); $('clip-mode').setAttribute('aria-pressed', String(clip));
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
      status.hidden = false; statusText.textContent = data.message; $('progress').value = data.percent || 0;
      status.classList.toggle('failed', data.state === 'error');
      $('background-hint').hidden = data.state !== 'running' && data.state !== 'queued';
    }
    buttons();
  } catch (e) { /* next refresh retries */ }
}
async function folderLabel() { try { $('folder-label').textContent = (await native.getFolder()).label; } catch {} }
if (native) { folderLabel(); updateStatus(); setInterval(updateStatus, 2000); document.addEventListener('visibilitychange', () => { if (!document.hidden) updateStatus(); }); }
else showError('ئەم پەڕەیە تەنها لە ئەپی ئەندرۆید کار دەکات.');
$('choose-folder').onclick = async () => { try { const folder = await native.chooseFolder(); $('folder-label').textContent = folder.label; } catch (err) { showError(err.message); } };

$('form').addEventListener('submit', async (e) => {
  e.preventDefault(); if (!native) return;
  const url = $('url').value.trim(); error.hidden = true; $('details').hidden = true;
  loading = true; buttons(); status.hidden = false; $('background-hint').hidden = true; statusText.textContent = 'ئامادەکردنی ڤیدیۆ... تکایە چاوەڕێ بکە.'; $('progress').value = 0;
  try {
    const video = await native.info({ url });
    currentUrl = url; duration = Math.floor(video.duration || 0);
    $('title').textContent = video.title; $('channel').textContent = video.channel; $('thumb').src = video.thumbnail;
    const options = $('languages'); options.replaceChildren();
    (video.subtitles || []).forEach(code => { const o = document.createElement('option'); o.value = code; o.textContent = code; options.appendChild(o); });
    if (!options.length) { const o = document.createElement('option'); o.value = ''; o.textContent = 'ژێرنووس بەردەست نییە'; options.appendChild(o); }
    for (const id of ['start-range', 'end-range']) { $(id).max = duration; $(id).disabled = duration < 1; }
    $('clip-mode').disabled = duration < 1;
    $('start-range').value = 0; $('end-range').value = Math.min(30, duration); renderClip(); mode(false);
    $('details').hidden = false; status.hidden = true;
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
    taskState = 'queued'; buttons(); status.hidden = false; statusText.textContent = 'دابەزاندن دەستی پێکرد...'; $('progress').value = 0; status.scrollIntoView({behavior: 'smooth', block: 'center'}); updateStatus();
  } catch (err) { showError(err.message); }
});
$('subtitle').addEventListener('click', async () => {
  if (!$('languages').value) return;
  error.hidden = true;
  try {
    const range = selectedRange();
    await native.subtitles({ url: currentUrl, ...range, language: $('languages').value, format: $('subformat').value });
    taskState = 'queued'; buttons(); status.hidden = false; statusText.textContent = 'دابەزاندنی ژێرنووس...'; $('progress').value = 0; updateStatus();
  } catch (err) { showError(err.message); }
});
