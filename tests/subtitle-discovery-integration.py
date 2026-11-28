"""Check that metadata discovery and automatic subtitle downloads remain separate."""
import http.server
import json
import os
from pathlib import Path
import socketserver
import subprocess
import tempfile
import threading

class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True

class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def do_GET(self):
        self.server.requests.append(self.path)
        body = (b'WEBVTT\n\n22:20:06.100 --> 22:20:07.900\nAuto\n\n' if self.path == '/ar-auto.vtt'
                else b'WEBVTT\n\n00:00:04.000 --> 00:00:06.000\nHello\n\n')
        self.send_response(200)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

with tempfile.TemporaryDirectory() as temporary, Server(('127.0.0.1', 0), Handler) as server:
    server.requests = []
    threading.Thread(target=server.serve_forever, daemon=True).start()
    root = Path(temporary)
    url = f'http://127.0.0.1:{server.server_port}'
    info = {'id': 'test', 'title': 'test', 'duration': 22, 'extractor': 'generic', 'extractor_key': 'Generic',
            'formats': [{'format_id': '1', 'ext': 'mp4', 'url': f'{url}/video.mp4'}],
            'subtitles': {'fr': [{'ext': 'vtt', 'url': f'{url}/fr.vtt'}], 'ar': [{'ext': 'vtt', 'url': f'{url}/ar-manual.vtt'}]},
            'automatic_captions': {'en': [{'ext': 'vtt', 'url': f'{url}/en.vtt'}], 'ar': [{'ext': 'vtt', 'url': f'{url}/ar-auto.vtt'}]}}
    infofile = root / 'info.json'
    infofile.write_text(json.dumps(info))
    base = ['python3', '-m', 'yt_dlp', '--load-info-json', str(infofile), '--no-playlist']
    probe = subprocess.run(base + ['--dump-single-json', '--simulate', '--skip-download', '--write-subs', '--write-auto-subs'],
                           cwd=root, capture_output=True, text=True, check=True, timeout=30)
    metadata = json.loads(probe.stdout)
    assert 'fr' in metadata['subtitles'] and 'en' in metadata['automatic_captions']
    assert server.requests == [], server.requests
    assert list(root.glob('*.vtt')) == []
    subprocess.run(base + ['--skip-download', '--write-subs', '--write-auto-subs', '--sub-langs', 'en',
                           '--sub-format', 'vtt/best', '--convert-subs', 'vtt', '-o', str(root / 'download.%(ext)s')],
                   cwd=root, capture_output=True, text=True, check=True, timeout=30)
    files = list(root.glob('*.vtt'))
    assert len(files) == 1 and 'Hello' in files[0].read_text(), files
    assert server.requests == ['/en.vtt'], server.requests
    # yt-dlp prefers a manual track over automatic captions of the same language.
    # With an empty selected range, the app retries the automatic-only selection.
    for automatic_only, endpoint, phrase in [(False, '/ar-manual.vtt', '00:00:04,000'), (True, '/ar-auto.vtt', '22:20:06,100')]:
        output = root / ('auto' if automatic_only else 'manual')
        opts = ['--skip-download', '--write-auto-subs', '--sub-langs', 'ar', '--sub-format', 'vtt/best',
                '--convert-subs', 'srt', '--ffmpeg-location', os.environ.get('FFMPEG', 'ffmpeg'), '-o', str(output) + '.%(ext)s']
        if not automatic_only:
            opts.append('--write-subs')
        subprocess.run(base + opts, cwd=root, capture_output=True, text=True, check=True, timeout=30)
        assert server.requests[-1] == endpoint, server.requests
        assert phrase in (root / (output.name + '.ar.srt')).read_text()
    print('manual and automatic tracks discovered; automatic-only retry and long timestamp conversion passed')
