'use strict';
const $ = (id) => document.getElementById(id);
const native = window.Capacitor?.Plugins?.DeviceDownloader;
let currentUrl = '';
const error = $('error'), status = $('status'), statusText = $('status-text');

function showError(message) { error.textContent = message || 'هەڵەیەک ڕوویدا؛ دووبارە هەوڵ بدەوە.'; error.hidden = false; }
function busy(active, message) {
  for (const id of ['load', 'download', 'subtitle']) $(id).disabled = active;
  if (!active && !$('languages').value) $('subtitle').disabled = true;
  status.hidden = !active;
  statusText.textContent = message || '';
  $('progress').value = 0;
}
function seconds(text) {
  if (!text.trim()) return 0;
  if (!/^\d+(?::[0-5]?\d){0,2}$/.test(text.trim())) throw new Error('کات بە شێوەی 01:30 بنووسە.');
  return text.trim().split(':').reduce((total, value) => total * 60 + Number(value), 0);
}
if (native) native.addListener('downloadProgress', ({ percent }) => {
  $('progress').value = percent;
  statusText.textContent = `دابەزاندن... ${percent}%`;
});
else showError('ئەم پەڕەیە تەنها لە ئەپی ئەندرۆید کار دەکات.');

$('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!native) return;
  const url = $('url').value.trim();
  error.hidden = true;
  $('details').hidden = true;
  busy(true, 'ئامادەکردنی ڤیدیۆ... تکایە چاوەڕێ بکە.');
  try {
    const video = await native.info({ url });
    currentUrl = url;
    $('title').textContent = video.title;
    $('channel').textContent = video.channel;
    $('thumb').src = video.thumbnail;
    const options = $('languages'); options.replaceChildren();
    (video.subtitles || []).forEach(code => { const o = document.createElement('option'); o.value = code; o.textContent = code; options.appendChild(o); });
    if (!options.length) { const o = document.createElement('option'); o.value = ''; o.textContent = 'ژێرنووس بەردەست نییە'; options.appendChild(o); }
    $('start').value = ''; $('end').value = '';
    $('details').hidden = false;
  } catch (err) { showError(err.message); }
  finally { busy(false); }
});

$('download').addEventListener('click', async () => {
  error.hidden = true;
  try {
    const startText = $('start').value.trim(), endText = $('end').value.trim();
    if (!!startText !== !!endText) throw new Error('بۆ بڕین، هەردوو کاتی دەستپێک و کۆتایی بنووسە.');
    const start = seconds(startText), end = seconds(endText);
    if (endText && end <= start) throw new Error('کۆتایی دەبێت دوای دەستپێک بێت.');
    busy(true, 'دابەزاندن دەستی پێکرد...');
    await native.download({ url: currentUrl, start, end, format: $('format').value, quality: $('quality').value });
    busy(false);
    status.hidden = false; statusText.textContent = 'تەواو بوو ✓ فایلەکە لە Downloads / SliceVid پاشەکەوت کرا.'; $('progress').value = 100;
  } catch (err) { busy(false); showError(err.message); }
});
$('subtitle').addEventListener('click', async () => {
  if (!$('languages').value) return;
  error.hidden = true; busy(true, 'دابەزاندنی ژێرنووس...');
  try {
    await native.subtitles({ url: currentUrl, language: $('languages').value, format: $('subformat').value });
    busy(false); status.hidden = false; statusText.textContent = 'تەواو بوو ✓ ژێرنووس لە Downloads / SliceVid پاشەکەوت کرا.'; $('progress').value = 100;
  } catch (err) { busy(false); showError(err.message); }
});
