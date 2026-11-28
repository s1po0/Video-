"""Exercise yt-dlp's section downloader against a local bounded-range server.

Requires yt-dlp and FFmpeg 9 with libx264. Set FFMPEG to the executable path.
"""
import http.server
import os
from pathlib import Path
import re
import socketserver
import subprocess
import tempfile
import threading

ffmpeg = os.environ.get('FFMPEG', 'ffmpeg')
with tempfile.TemporaryDirectory() as temporary:
    root = Path(temporary)
    source = root / 'source.mp4'
    subprocess.run([ffmpeg, '-v', 'error', '-y', '-f', 'lavfi', '-i',
                    'testsrc2=size=1280x720:rate=24', '-f', 'lavfi', '-i',
                    'sine=frequency=1000', '-t', '22', '-c:v', 'libx264',
                    '-preset', 'ultrafast', '-b:v', '6M', '-c:a', 'aac',
                    '-movflags', '+faststart', str(source)], check=True)

    class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
        daemon_threads = True

    class Handler(http.server.BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass

        def do_GET(self):
            size = source.stat().st_size
            match = re.fullmatch(r'bytes=(\d+)-(\d*)', self.headers.get('Range', ''))
            start = int(match[1]) if match else 0
            end = min(int(match[2]) if match and match[2] else size - 1, size - 1)
            self.server.ranges.append((start, end, bool(match and match[2])))
            if start >= size:
                self.send_error(416)
                return
            self.send_response(206 if match else 200)
            self.send_header('Content-Length', str(end - start + 1))
            self.send_header('Accept-Ranges', 'bytes')
            self.send_header('Content-Type', 'video/mp4')
            if match:
                self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
            self.end_headers()
            try:
                with source.open('rb') as media:
                    media.seek(start)
                    remaining = end - start + 1
                    while remaining:
                        chunk = media.read(min(65536, remaining))
                        self.wfile.write(chunk)
                        remaining -= len(chunk)
            except (BrokenPipeError, ConnectionResetError):
                pass

    with Server(('127.0.0.1', 0), Handler) as server:
        server.ranges = []
        threading.Thread(target=server.serve_forever, daemon=True).start()
        target = root / 'clip.%(ext)s'
        url = f'http://127.0.0.1:{server.server_port}/source.mp4'
        cmd = ['python3', '-m', 'yt_dlp', '--no-playlist', '--ffmpeg-location', ffmpeg,
               '--download-sections', '*3-15', '--force-keyframes-at-cuts',
               '--downloader-args', 'ffmpeg_i:-request_size 8388608 -short_seek_size 8388608',
               '--downloader-args', 'ffmpeg:-progress pipe:1 -nostats -preset veryfast',
               '-o', str(target), url]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=90)
        if result.returncode:
            raise AssertionError(result.stderr + '\n' + result.stdout)
        assert 'out_time_us=' in result.stdout, result.stdout
        bounded = [(a, b) for a, b, bounded in server.ranges if bounded]
        assert bounded, f'no bounded requests: {server.ranges}'
        assert all(b - a + 1 <= 8388608 for a, b in bounded), bounded
        clip = root / 'clip.mp4'
        assert clip.is_file() and clip.stat().st_size > 1000
        probe = subprocess.run([ffmpeg, '-hide_banner', '-i', str(clip)], capture_output=True, text=True)
        assert 'Video: h264' in probe.stderr and 'Audio: aac' in probe.stderr, probe.stderr
        duration = re.search(r'Duration: (\d+):(\d+):(\d+(?:\.\d+)?)', probe.stderr)
        assert duration, probe.stderr
        seconds = int(duration[1]) * 3600 + int(duration[2]) * 60 + float(duration[3])
        assert abs(seconds - 12) < 0.3, seconds
        print(f'clip: {seconds:.2f}s, H.264 + AAC, {len(bounded)} bounded HTTP requests')
