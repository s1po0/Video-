"""Evaluate a lossless MP4 section against a local bounded-range server.

Requires yt-dlp and FFmpeg 9 with libx264. Set FFMPEG to the executable path.
"""
import json
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
                    'anoisesrc=color=white:seed=42:sample_rate=44100', '-t', '22', '-c:v', 'libx264',
                    '-preset', 'veryfast', '-g', '240', '-keyint_min', '240', '-sc_threshold', '0', '-b:v', '6M', '-c:a', 'aac',
                    '-movflags', '+faststart', str(source)], check=True)

    for target, mapping in [('video.mp4', '0:v:0'), ('audio.m4a', '0:a:0')]:
        subprocess.run([ffmpeg, '-v', 'error', '-y', '-i', str(source), '-map', mapping, '-c', 'copy', str(root / target)], check=True)
    class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
        daemon_threads = True

    class Handler(http.server.BaseHTTPRequestHandler):
        protocol_version = 'HTTP/1.0' if os.environ.get('TEST_HTTP_10') == '1' else 'HTTP/1.1'

        def handle(self):
            try:
                super().handle()
            except ConnectionResetError:
                pass
        def log_message(self, *args):
            pass

        def do_GET(self):
            mediafile = root / self.path.lstrip("/")
            size = mediafile.stat().st_size
            match = re.fullmatch(r'bytes=(\d+)-(\d*)', self.headers.get('Range', ''))
            start = int(match[1]) if match else 0
            end = min(int(match[2]) if match and match[2] else size - 1, size - 1)
            self.server.ranges.append((self.path, start, end, bool(match and match[2]), self.client_address))
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
                with mediafile.open('rb') as media:
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
        info = {'id':'test', 'title':'test', 'duration':22, 'extractor':'generic', 'extractor_key':'Generic',
                'formats': [{'format_id':'137', 'ext':'mp4', 'protocol':'http', 'vcodec':'avc1.64001f', 'acodec':'none', 'height':720, 'url':url.replace('source.mp4','video.mp4')}, {'format_id':'140', 'ext':'m4a', 'protocol':'http', 'vcodec':'none', 'acodec':'mp4a.40.2','url':url.replace('source.mp4','audio.m4a')}]}
        infofile=root/'info.json'; infofile.write_text(json.dumps(info))
        cmd = ['python3', '-m', 'yt_dlp', '-f','137+140', '--load-info-json', str(infofile), '--no-playlist', '--ffmpeg-location', ffmpeg,
               '--download-sections', '*3-15',
               '--downloader-args', 'ffmpeg_i:-request_size 8388608 -short_seek_size 8388608 -multiple_requests 1',
               '--downloader-args', 'ffmpeg:-progress pipe:1 -nostats',
               '-o', str(target)]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=90)
        if result.returncode:
            raise AssertionError(result.stderr + '\n' + result.stdout)
        assert 'out_time_us=' in result.stdout, result.stdout
        bounded = [(path, a, b, client) for path, a, b, is_bounded, client in server.ranges if is_bounded]
        assert server.ranges and len(bounded) == len(server.ranges), f'unbounded request: {server.ranges}'
        assert {path for path, _, _, _ in bounded} == {'/video.mp4', '/audio.m4a'}, bounded
        assert all(b - a + 1 <= 8388608 for _, a, b, _ in bounded), bounded
        if Handler.protocol_version == 'HTTP/1.1':
            assert len({client for _, _, _, client in bounded}) < len(bounded), f'no persistent connections: {bounded}'
        clip = root / 'clip.mp4'
        assert clip.is_file() and clip.stat().st_size > 1000
        probe = subprocess.run([ffmpeg, '-hide_banner', '-i', str(clip)], capture_output=True, text=True)
        assert 'Video: h264' in probe.stderr and 'Audio: aac' in probe.stderr, probe.stderr
        duration = re.search(r'Duration: (\d+):(\d+):(\d+(?:\.\d+)?)', probe.stderr)
        assert duration, probe.stderr
        seconds = int(duration[1]) * 3600 + int(duration[2]) * 60 + float(duration[3])
        assert abs(seconds - 12) < 0.3, seconds
        def packet_hashes(path, stream):
            result = subprocess.run([ffmpeg, '-v', 'error', '-i', str(path), '-map', f'0:{stream}:0', '-c', 'copy',
                                     '-f', 'framemd5', '-'], capture_output=True, text=True, check=True)
            return [re.search(r'\b[0-9a-f]{32}\b', line).group() for line in result.stdout.splitlines()
                    if not line.startswith('#') and re.search(r'\b[0-9a-f]{32}\b', line)]

        for stream in ('v', 'a'):
            original = set(packet_hashes(source, stream))
            copied = packet_hashes(clip, stream)
            assert copied and all(digest in original for digest in copied), f'{stream} re-encoded or changed'

        def frame_hashes(path, seek, ignore_edit=False):
            args = [ffmpeg, '-v', 'error'] + (['-ignore_editlist', '1'] if ignore_edit else []) + (['-ss', '3'] if seek else [])
            result = subprocess.run(args + ['-i', str(path), '-map', '0:v:0', '-frames:v', '8',
                                            '-f', 'framemd5', '-'], capture_output=True, text=True, check=True)
            return [line.split(',')[-1].strip() for line in result.stdout.splitlines() if not line.startswith('#')]

        requested_frames = frame_hashes(source, True)
        assert requested_frames == frame_hashes(clip, False), 'first displayed frames differ'
        assert requested_frames != frame_hashes(clip, False, ignore_edit=True), 'expected visible preroll without edit lists'

        import array
        def samples(path, seek):
            args = [ffmpeg, '-v', 'error'] + (['-ss', '3'] if seek else [])
            data = subprocess.run(args + ['-i', str(path), '-map', '0:a:0', '-t', '2', '-ac', '1',
                                          '-ar', '44100', '-f', 's16le', '-'], capture_output=True, check=True).stdout
            out = array.array('h')
            out.frombytes(data)
            return out[44100:47100]
        a, b = samples(source, True), samples(clip, False)
        assert len(a) == len(b) == 3000
        import math
        correlation = sum(x*y for x,y in zip(a,b)) / math.sqrt(sum(x*x for x in a) * sum(y*y for y in b))
        assert correlation > 0.9, f'audio not aligned: {correlation}'
        assert b'elst' in clip.read_bytes(), 'MP4 edit list missing'
        print(f'copy cut: {seconds:.2f}s, audio correlation {correlation:.3f}; source packets preserved')
