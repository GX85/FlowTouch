"""FlowTouch Windows companion. Python stdlib only; no shell command execution."""
import argparse
import ctypes
import hmac
import json
import math
import os
from pathlib import Path
import secrets
import subprocess
import sys
import threading
import time
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = 8765
HOSTS = {f'127.0.0.1:{PORT}', f'localhost:{PORT}'}
ORIGINS = {f'http://{host}' for host in HOSTS}
URLS = {'youtube': 'https://www.youtube.com/', 'spotify': 'https://open.spotify.com/',
        'google': 'https://www.google.com/', 'github': 'https://github.com/', 'wiki': 'https://www.wikipedia.org/'}
KEYS = {'media': [0xB3], 'stopmedia': [0xB2], 'next': [0xB0], 'previous': [0xB1],
        'mute': [0xAD], 'volumeup': [0xAF], 'volumedown': [0xAE], 'home': [0x12, 0x24],
        'prevtab': [0x11, 0x10, 0x09], 'nexttab': [0x11, 0x09], 'copy': [0x11, 0x43],
        'paste': [0x11, 0x56], 'switchwindow': [0x12, 0x09], 'minimize': [0x5B, 0x28],
        'zoomin': [0x11, 0xBB], 'zoomout': [0x11, 0xBD], 'zoomreset': [0x11, 0x30],
        'newtab': [0x11, 0x54], 'fullscreen': [0x7A], 'desktop': [0x5B, 0x44]}
WINDOWS_ROOT = Path(os.environ.get('SystemRoot', 'C:/Windows'))
APPS = {'calculator': WINDOWS_ROOT / 'System32' / 'calc.exe', 'notepad': WINDOWS_ROOT / 'System32' / 'notepad.exe', 'explorer': WINDOWS_ROOT / 'explorer.exe'}
ACTIONS = set(URLS) | set(KEYS) | set(APPS) | {'pointer', 'click', 'scrollup', 'scrolldown', 'arm', 'disarm', 'heartbeat'}

class Controller:
    def __init__(self, dry_run=False):
        self.token = secrets.token_urlsafe(32)
        self.dry_run = dry_run
        self.armed = False
        self.deadline = 0
        self.last = {}
        self.lock = threading.Lock()
        self.user32 = ctypes.windll.user32 if os.name == 'nt' and not dry_run else None
        if self.user32:
            self.user32.SetProcessDPIAware()

    def execute(self, data):
        action = data.get('action')
        if action not in ACTIONS:
            raise ValueError('Unknown action')
        with self.lock:
            now = time.monotonic()
            if action == 'arm':
                self.armed = True
                self.deadline = now + 3
                return
            if action == 'disarm':
                self.armed = False
                return
            if not self.armed or now > self.deadline:
                self.armed = False
                raise PermissionError('Paused. Enable commands in local studio.')
            if action == 'heartbeat':
                self.deadline = now + 3
                return
            if self.user32 and self.user32.GetAsyncKeyState(0x1B) & 0x8000:
                self.armed = False
                raise PermissionError('Emergency pause')
            minimum = .06 if action == 'pointer' else .6
            if now - self.last.get(action, -math.inf) < minimum:
                return
            self.last[action] = now
            if action == 'pointer':
                x, y = data.get('x'), data.get('y')
                if not all(type(n) in (float, int) and math.isfinite(n) and 0 <= n <= 1 for n in [x, y]):
                    raise ValueError('Coordinates must be normalized numbers')
                if x < .025 and y < .025:
                    self.armed = False
                    raise PermissionError('Top-left corner emergency pause')
                if self.user32:
                    w, h = self.user32.GetSystemMetrics(0), self.user32.GetSystemMetrics(1)
                    self.user32.SetCursorPos(round(x * (w-1)), round(y * (h-1)))
            elif not self.dry_run:
                if action in URLS:
                    webbrowser.open_new_tab(URLS[action])
                elif action in APPS:
                    subprocess.Popen([str(APPS[action])])
                elif action in KEYS:
                    for key in KEYS[action]:
                        self.user32.keybd_event(key, 0, 0, 0)
                    for key in reversed(KEYS[action]):
                        self.user32.keybd_event(key, 0, 2, 0)
                elif action == 'click':
                    self.user32.mouse_event(0x0002, 0, 0, 0, 0)
                    self.user32.mouse_event(0x0004, 0, 0, 0, 0)
                elif action in ('scrollup', 'scrolldown'):
                    delta = 360 if action == 'scrollup' else -360
                    self.user32.mouse_event(0x0800, 0, 0, ctypes.c_uint32(delta).value, 0)

def make_handler(root, controller):
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(root), **kwargs)

        def allowed(self, write=False):
            if self.headers.get('Host') not in HOSTS:
                return False
            origin = self.headers.get('Origin')
            if write and origin not in ORIGINS:
                return False
            if origin is not None and origin not in ORIGINS:
                return False
            return self.headers.get('Sec-Fetch-Site', 'none') in ('none', 'same-origin')

        def reply(self, status, value):
            body = json.dumps(value).encode()
            self.send_response(status)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Cache-Control', 'no-store')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            if not self.allowed():
                return self.reply(403, {'error': 'Local origin required'})
            if self.path == '/api/session':
                return self.reply(200, {'token': controller.token, 'platform': 'windows', 'app': 'FlowTouch', 'version':'1.1.0', 'dryRun': controller.dry_run})
            if self.path.startswith('/api/'):
                return self.reply(404, {'error': 'Not found'})
            super().do_GET()

        def do_POST(self):
            if self.path != '/api/action':
                return self.reply(404, {'error': 'Not found'})
            token = self.headers.get('X-FlowTouch-Token', '')
            if not self.allowed(write=True) or not hmac.compare_digest(token, controller.token):
                return self.reply(403, {'error': 'Local origin and session token required'})
            try:
                length = int(self.headers.get('Content-Length', 0))
                if not 0 < length <= 2048:
                    raise ValueError('Invalid body length')
                data = json.loads(self.rfile.read(length))
                if not isinstance(data, dict):
                    raise ValueError('Object required')
                controller.execute(data)
                self.reply(200, {'ok': True})
            except PermissionError as error:
                self.reply(409, {'error': str(error)})
            except (ValueError, TypeError):
                self.reply(400, {'error': 'Invalid command'})

        def end_headers(self):
            self.send_header('X-Content-Type-Options', 'nosniff')
            self.send_header('Cross-Origin-Resource-Policy', 'same-origin')
            self.send_header('Permissions-Policy', 'camera=(self), microphone=()')
            super().end_headers()

        def list_directory(self, path):
            self.send_error(403)

        def log_message(self, format, *args):
            pass
    Handler.extensions_map = {**Handler.extensions_map, '.wasm': 'application/wasm', '.js': 'text/javascript'}
    return Handler

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run', action='store_true', help='Validate commands without OS input')
    parser.add_argument('--no-browser', action='store_true')
    parser.add_argument('--self-test', help='Write a dry-run verification report and exit')
    args = parser.parse_args()
    if os.name != 'nt' and not args.dry_run:
        raise SystemExit('This companion supports Windows. Use --dry-run for development elsewhere.')
    root = Path(__file__).resolve().parent / 'app'
    if not (root / 'index.html').is_file():
        raise SystemExit('Missing app/index.html. Extract the complete FlowTouch-Windows.zip first.')
    if args.self_test:
        controller = Controller(True)
        controller.execute({'action':'arm'})
        controller.execute({'action':'calculator'})
        controller.execute({'action':'youtube'})
        report = {'ok':True,'studio':(root/'studio'/'index.html').is_file(),'model':(root/'models'/'gesture_recognizer.task').is_file(),'worker':(root/'vision-worker.bundle.js').is_file(),'native_commands':'dry-run passed'}
        Path(args.self_test).write_text(json.dumps(report),encoding='utf-8')
        return
    controller = Controller(args.dry_run)
    server = ThreadingHTTPServer(('127.0.0.1', PORT), make_handler(root, controller))
    server.daemon_threads = True
    def emergency_monitor():
        while True:
            if controller.user32 and controller.user32.GetAsyncKeyState(0x1B) & 0x8000:
                with controller.lock:
                    controller.armed = False
            time.sleep(.025)
    threading.Thread(target=emergency_monitor, daemon=True).start()
    print('FlowTouch is running at http://127.0.0.1:8765')
    print('Enable commands in the local studio. Escape pauses OS control globally.')
    print('Close this window or press Ctrl+C to stop the companion.')
    if not args.no_browser:
        webbrowser.open('http://127.0.0.1:8765/studio/')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        controller.armed = False
        server.server_close()

if __name__ == '__main__':
    main()
