'use strict';

/**
 * Resolves the ffmpeg and yt-dlp binaries at runtime.
 *
 * Resolution order for each tool:
 *   1. The binary bundled by an npm package (ffmpeg-static / yt-dlp-exec)
 *   2. A system-installed binary found on the PATH (ffmpeg / yt-dlp)
 *
 * This keeps the app self-contained when deployed (the npm post-install
 * downloads the binaries) while still working on hosts that already have
 * ffmpeg / yt-dlp installed system-wide.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function which(cmd) {
  try {
    const p = execSync(`command -v ${cmd}`, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    return p || null;
  } catch {
    return null;
  }
}

function resolveFfmpeg() {
  try {
    const p = require('ffmpeg-static');
    if (p && fs.existsSync(p)) return p;
  } catch {
    /* package not installed */
  }
  return which('ffmpeg');
}

function resolveYtDlp() {
  try {
    const base = path.join(__dirname, '..', 'node_modules', 'yt-dlp-exec', 'bin');
    const file = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
    const p = path.join(base, file);
    if (fs.existsSync(p)) return p;
  } catch {
    /* package not installed */
  }
  return which('yt-dlp');
}

module.exports = { which, resolveFfmpeg, resolveYtDlp };
