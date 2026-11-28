import { chromium as playwright } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
fs.mkdirSync('tmp/screenshots', {recursive:true});
const server = http.createServer((req, res) => {
  const name = req.url.split('?')[0] === '/' ? '/native.html' : req.url.split('?')[0];
  if (!['/native.html', '/native.css', '/native.js'].includes(name)) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', name.endsWith('.css') ? 'text/css' : name.endsWith('.js') ? 'text/javascript' : 'text/html');
  fs.createReadStream(path.join('public', name.slice(1))).pipe(res);
});
await new Promise(resolve=>server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const browser = await playwright.launch({executablePath: process.env.BROWSER_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox'], headless:true});
for (const width of [320, 390, 600]) {
  const page = await browser.newPage({viewport:{width,height:844}, deviceScaleFactor:1});
  const errors=[]; page.on('pageerror', e=>errors.push(e.message));
  await page.addInitScript(() => {
    window.calls=[]; window.state={state:'idle',percent:0};
    window.Capacitor={Plugins:{DeviceDownloader:{
      getFolder: async()=>({label:'Downloads / SliceVid'}), listDownloads:async()=>({files:[{name:'SliceVid-123.mp4',uri:'content://media/123',mime:'video/mp4'}]}),
      status:async()=>window.state, chooseFolder:async()=>({label:'Custom / Videos'}),
      info:async()=>({title:'A video title with a long unbroken name testtesttesttesttesttest', channel:'Example', duration:5400, thumbnail:'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', subtitles:['en','ku']}),
      download:async payload=>window.calls.push(['video',payload]), subtitles:async payload=>window.calls.push(['subs',payload]), openDownload:async payload=>window.calls.push(['open',payload])
    }}};
  });
  await page.goto(`http://127.0.0.1:${port}/native.html`);
  await page.screenshot({path:`tmp/screenshots/link-${width}.png`,fullPage:true});
  await page.click('[data-screen=subs]'); assert.equal(await page.locator('#subs-empty').isVisible(),true);
  await page.click('[data-screen=edit]'); assert.equal(await page.locator('#editor-empty').isVisible(),true);
  await page.click('.go-link >> nth=0');
  await page.fill('#url','https://youtu.be/abcdefghijk'); await page.click('#load');
  await page.waitForSelector('#details:not([hidden])');
  assert.equal(await page.locator('#screen-edit').isVisible(),true);
  await page.click('#clip-mode'); await page.click('#full-mode'); assert.equal(await page.locator('#clip-controls').isVisible(),false); await page.click('#clip-mode');
  await page.locator('#start-range').fill('10'); await page.locator('#end-range').fill('90');
  await page.locator('.advanced-time summary').click(); await page.locator('#start').fill('00:10'); await page.locator('#start').dispatchEvent('change'); await page.locator('#end').fill('01:30'); await page.locator('#end').dispatchEvent('change');
  await page.selectOption('#format','webm'); await page.selectOption('#format','mp4'); await page.selectOption('#quality','1080'); await page.selectOption('#quality','720');
  await page.click('#download');
  await page.waitForFunction(()=>window.calls.some(x=>x[0]==='video'));
  let req=await page.evaluate(()=>window.calls.find(x=>x[0]==='video')[1]); assert.equal(req.start,10); assert.equal(req.end,90);
  await page.click('[data-screen=subs]');
  assert.match(await page.locator('#subtitle-range').innerText(),/00:10.*01:30/);
  await page.selectOption('#languages','ku'); await page.selectOption('#languages','en'); await page.selectOption('#subformat','vtt'); await page.selectOption('#subformat','srt');
  await page.click('#subtitle'); await page.waitForFunction(()=>window.calls.some(x=>x[0]==='subs'));
  req=await page.evaluate(()=>window.calls.find(x=>x[0]==='subs')[1]); assert.equal(req.start,10);assert.equal(req.end,90);
  await page.click('#edit-range'); assert.equal(await page.locator('#screen-edit').isVisible(),true);
  await page.screenshot({path:`tmp/screenshots/edit-${width}.png`,fullPage:true});
  await page.click('[data-screen=files]'); await page.locator('.download-item').click();
  await page.click('#choose-folder'); assert.equal(await page.locator('#folder-label').innerText(),'Custom / Videos');
  await page.click('#refresh-downloads');
  await page.screenshot({path:`tmp/screenshots/files-${width}.png`,fullPage:true});
  for (const screen of ['link','edit','subs','files']) {
    await page.click(`[data-screen=${screen}]`);
    const metrics=await page.evaluate(()=>({view:document.documentElement.clientWidth, scroll:document.documentElement.scrollWidth}));
    assert.ok(metrics.scroll <= metrics.view, `${screen} at ${width} overflow ${JSON.stringify(metrics)}`);
    assert.equal(await page.locator(`[data-screen=${screen}]`).getAttribute('aria-current'),'page');
  }
  assert.equal(await page.locator('.foot a').count(),2);
  await page.locator('[data-screen=link]').focus(); await page.keyboard.press('Enter'); assert.equal(await page.locator('#screen-link').isVisible(),true);
  assert.deepEqual(errors,[]); console.log(`width ${width}: navigation, clip/subtitle range, download, folder, files and overflow passed`); await page.close();
}
await browser.close();
server.close();
