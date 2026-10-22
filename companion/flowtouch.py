"""FlowTouch Windows companion. Python stdlib only; no shell command execution."""
import argparse
from urllib.parse import urlparse
from ctypes import wintypes
from agent import MovementAgent
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
import logging
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = 8765
VERSION = '2.1.0'
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
ACTIONS = set(URLS) | set(KEYS) | set(APPS) | {'pointer', 'click', 'scrollup', 'scrolldown', 'arm', 'disarm', 'heartbeat', 'shortcut', 'keydown', 'keyup', 'url', 'app', 'rightclick', 'doubleclick'}

KEY_CODES={'Space':0x20,'Enter':0x0D,'Tab':0x09,'Escape':0x1B,'Backspace':0x08,'Delete':0x2E,'ArrowUp':0x26,'ArrowDown':0x28,'ArrowLeft':0x25,'ArrowRight':0x27,'Shift':0x10,'Control':0x11,'Alt':0x12}
KEY_CODES.update({chr(i):i for i in range(65,91)})
KEY_CODES.update({str(i):0x30+i for i in range(10)})
KEY_CODES.update({'F'+str(i):0x6F+i for i in range(1,13)})
class KeyboardInput(ctypes.Structure):
    _fields_=[('vk',wintypes.WORD),('scan',wintypes.WORD),('flags',wintypes.DWORD),('time',wintypes.DWORD),('extra',ctypes.c_size_t)]
class MouseInput(ctypes.Structure):
    _fields_=[('dx',wintypes.LONG),('dy',wintypes.LONG),('data',wintypes.DWORD),('flags',wintypes.DWORD),('time',wintypes.DWORD),('extra',ctypes.c_size_t)]
class InputUnion(ctypes.Union):
    _fields_=[('keyboard',KeyboardInput),('mouse',MouseInput)]
class Input(ctypes.Structure):
    _fields_=[('kind',wintypes.DWORD),('value',InputUnion)]

class Controller:
    def __init__(self, dry_run=False):
        self.token = secrets.token_urlsafe(32)
        self.dry_run = dry_run
        self.armed = False
        self.deadline = 0
        self.last = {}
        self.lock = threading.RLock()
        self.held_keys=set()
        self.key_deadline=0
        self.agent=MovementAgent()
        self.last_command=None
        self.last_error=None
        self.user32 = ctypes.windll.user32 if os.name == 'nt' and not dry_run else None
        if self.user32:
            self.user32.SetProcessDPIAware()
            self.user32.SendInput.argtypes=[wintypes.UINT,ctypes.POINTER(Input),ctypes.c_int]
            self.user32.SendInput.restype=wintypes.UINT
            self.user32.MapVirtualKeyW.argtypes=[wintypes.UINT,wintypes.UINT]
            self.user32.MapVirtualKeyW.restype=wintypes.UINT

    def key_event(self,code,up=False):
        if not self.user32:return
        scan=self.user32.MapVirtualKeyW(code,0)
        flags=(8 if scan else 0)|(2 if up else 0)|(1 if code in (0x25,0x26,0x27,0x28,0x2E) else 0)
        item=Input(kind=1,value=InputUnion(keyboard=KeyboardInput(0 if scan else code,scan,flags,0,0)))
        if self.user32.SendInput(1,ctypes.byref(item),ctypes.sizeof(Input))!=1:raise OSError('Windows rejected keyboard input. Focus the target app. Elevated apps and protected games can block input.')

    def release_keys(self):
        for key in list(self.held_keys):
            try:self.key_event(KEY_CODES[key],True)
            except OSError:pass
        self.held_keys.clear()

    def pause(self):
        with self.lock:self.armed=False;self.release_keys()

    def watchdog(self):
        with self.lock:
            if self.armed and time.monotonic()>self.deadline:self.pause()
            elif self.held_keys and time.monotonic()>self.key_deadline:self.release_keys()

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
                self.pause()
                return
            if not self.armed or now > self.deadline:
                self.pause()
                raise PermissionError('Paused. Enable commands in local studio.')
            if action == 'heartbeat':
                self.deadline = now + 3
                return
            if self.user32 and self.user32.GetAsyncKeyState(0x1B) & 0x8000:
                self.pause()
                raise PermissionError('Emergency pause')
            minimum = 0 if action in ('keydown','keyup') else .04 if action in ('pointer','shortcut','click') else .6
            if now - self.last.get(action, -math.inf) < minimum:
                return
            self.last[action] = now
            self.last_command=action
            self.last_error=None
            if action in ('shortcut','keydown','keyup'):
                keys=data.get('keys')
                if not isinstance(keys,list) or not 1<=len(keys)<=4 or any(not isinstance(k,str) or k not in KEY_CODES for k in keys) or len(set(keys))!=len(keys):raise ValueError('Invalid keys')
                if action=='keydown':self.key_deadline=now+.85
                if action=='keyup':
                    for key in reversed(keys):
                        if key in self.held_keys:self.key_event(KEY_CODES[key],True);self.held_keys.discard(key)
                else:
                    try:
                        for key in keys:
                            if key not in self.held_keys:self.key_event(KEY_CODES[key]);self.held_keys.add(key)
                    except OSError:
                        self.pause()
                        raise
                    finally:
                        if action=='shortcut':
                            self.release_keys()
                return
            if action=='url':
                url=data.get('url','')
                if not isinstance(url,str) or len(url)>2048:raise ValueError('Invalid URL')
                parsed=urlparse(url)
                if parsed.scheme not in ('http','https') or not parsed.netloc or parsed.username or parsed.password:raise ValueError('Invalid URL')
                if not self.dry_run:webbrowser.open_new_tab(url)
                return
            if action=='app':
                path=data.get('path','')
                if not isinstance(path,str) or not Path(path).is_absolute() or Path(path).suffix.lower()!='.exe' or not Path(path).is_file():raise ValueError('Choose an existing absolute .exe path')
                if not self.dry_run:subprocess.Popen([path],shell=False)
                return
            if action == 'pointer':
                x, y = data.get('x'), data.get('y')
                if not all(type(n) in (float, int) and math.isfinite(n) and 0 <= n <= 1 for n in [x, y]):
                    raise ValueError('Coordinates must be normalized numbers')
                if x < .025 and y < .025:
                    self.pause()
                    raise PermissionError('Top-left corner emergency pause')
                if self.user32:
                    w, h = self.user32.GetSystemMetrics(0), self.user32.GetSystemMetrics(1)
                    self.user32.SetCursorPos(round(x * (w-1)), round(y * (h-1)))
            elif not self.dry_run:
                if action in URLS:
                    if not webbrowser.open_new_tab(URLS[action]):
                        raise OSError('Windows could not open the default browser')
                elif action in APPS:
                    subprocess.Popen([str(APPS[action])])
                elif action in KEYS:
                    pressed=[]
                    try:
                        for key in KEYS[action]:
                            self.key_event(key);pressed.append(key)
                    finally:
                        for key in reversed(pressed):self.key_event(key,True)
                elif action in ('click','rightclick','doubleclick'):
                    for _ in range(2 if action=='doubleclick' else 1):
                        self.user32.mouse_event(0x0008 if action=='rightclick' else 0x0002,0,0,0,0)
                        self.user32.mouse_event(0x0010 if action=='rightclick' else 0x0004,0,0,0,0)
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
            # Cross-site top-level navigation may open the public UI, never the session API.
            ui_navigation = (not self.path.startswith('/api/') and self.headers.get('Host') in HOSTS
                             and self.headers.get('Sec-Fetch-Mode') == 'navigate'
                             and self.headers.get('Sec-Fetch-Dest') == 'document')
            if not self.allowed() and not ui_navigation:
                return self.reply(403, {'error': 'Local origin required'})
            if self.path in ('/','/index.html'):
                self.send_response(302);self.send_header('Location','/studio/');self.end_headers();return
            if self.path == '/api/session':
                return self.reply(200, {'token': controller.token, 'platform': 'windows', 'app': 'FlowTouch', 'version':VERSION, 'dryRun': controller.dry_run})
            if self.path=='/api/status':
                if not hmac.compare_digest(self.headers.get('X-FlowTouch-Token',''),controller.token):return self.reply(403,{'error':'Session token required'})
                return self.reply(200,{'armed':controller.armed,'lastCommand':controller.last_command,'lastError':controller.last_error,'version':VERSION})
            if self.path=='/api/agent/settings':
                if not hmac.compare_digest(self.headers.get('X-FlowTouch-Token',''),controller.token):return self.reply(403,{'error':'Session token required'})
                return self.reply(200,controller.agent.public())
            if self.path.startswith('/api/'):
                return self.reply(404, {'error': 'Not found'})
            super().do_GET()

        def do_POST(self):
            if self.path not in ('/api/action','/api/agent/settings','/api/agent/analyze'):
                return self.reply(404, {'error': 'Not found'})
            token = self.headers.get('X-FlowTouch-Token', '')
            if not self.allowed(write=True) or not hmac.compare_digest(token, controller.token):
                return self.reply(403, {'error': 'Local origin and session token required'})
            try:
                length = int(self.headers.get('Content-Length', 0))
                if not 0 < length <= 8192:
                    raise ValueError('Invalid body length')
                data = json.loads(self.rfile.read(length))
                if not isinstance(data, dict):
                    raise ValueError('Object required')
                if self.path=='/api/agent/settings':return self.reply(200,controller.agent.configure(data))
                if self.path=='/api/agent/analyze':return self.reply(200,controller.agent.analyze(data))
                controller.execute(data)
                self.reply(200, {'ok': True})
            except PermissionError as error:
                self.reply(409, {'error': str(error)})
            except OSError as error:
                controller.last_error=str(error)
                self.reply(500, {'error': str(error)})
            except (ValueError, TypeError) as error:
                self.reply(400, {'error': str(error) if self.path.startswith('/api/agent/') else 'Invalid command'})

        def end_headers(self):
            self.send_header('Cache-Control', 'no-store')
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
    parser.add_argument('--app-root', type=Path, help='Development build directory')
    parser.add_argument('--browser',action='store_true',help='Use the external browser instead of the native Studio window')
    args = parser.parse_args()
    if os.name != 'nt' and not args.dry_run:
        raise SystemExit('This companion supports Windows. Use --dry-run for development elsewhere.')
    root = args.app_root or Path(__file__).resolve().parent / 'app'
    if not (root / 'index.html').is_file():
        raise SystemExit('Missing app/index.html. Extract the complete FlowTouch-Windows.zip first.')
    if args.self_test:
        controller = Controller(True)
        controller.execute({'action':'arm'})
        controller.execute({'action':'calculator'})
        controller.execute({'action':'youtube'})
        report = {'ok':True,'studio':(root/'studio'/'index.html').is_file(),'model':(root/'models'/'gesture_recognizer.task').is_file(),'worker':(root/'vision-worker.bundle.js').is_file(),'native_commands':'dry-run passed','version':VERSION,'agent':True}
        Path(args.self_test).write_text(json.dumps(report),encoding='utf-8')
        return
    controller = Controller(args.dry_run)
    try:
        server = ThreadingHTTPServer(('127.0.0.1', PORT), make_handler(root, controller))
    except OSError:
        # A second launch must not crash with an invisible console traceback.
        ctypes.windll.user32.MessageBoxW(None,'FlowTouch is already running, or port 8765 is occupied. Close the previous version and try again.','FlowTouch Studio',0x40)
        return
    server.daemon_threads = True
    def emergency_monitor():
        while True:
            if controller.user32 and controller.user32.GetAsyncKeyState(0x1B) & 0x8000:
                with controller.lock:
                    controller.pause()
            controller.watchdog()
            time.sleep(.025)
    threading.Thread(target=emergency_monitor, daemon=True).start()
    print('FlowTouch is running at http://127.0.0.1:8765')
    print('Enable commands in the local studio. Escape pauses OS control globally.')
    print('Close this window or press Ctrl+C to stop the companion.')
    try:
        if args.no_browser:
            server.serve_forever()
        elif args.browser:
            webbrowser.open('http://127.0.0.1:8765/studio/?desktop=1&v='+VERSION)
            server.serve_forever()
        else:
            threading.Thread(target=server.serve_forever,daemon=True).start()
            import webview
            # A dedicated WebView2 instance keeps the live-camera pipeline active
            # when a different application has focus. Never disable its sandbox.
            os.environ['WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS']='--disable-background-timer-throttling --disable-renderer-backgrounding --disable-backgrounding-occluded-windows'
            webview.settings['ALLOW_FILE_URLS']=False
            webview.settings['ALLOW_DOWNLOADS']=True
            webview.settings['OPEN_EXTERNAL_LINKS_IN_BROWSER']=True
            window=webview.create_window('FlowTouch Studio','http://127.0.0.1:8765/studio/?desktop=1&v='+VERSION,width=1280,height=850,min_size=(960,680),background_color='#eef0ed',text_select=True)
            window.events.closed += controller.pause
            webview.start(gui='edgechromium',private_mode=False,storage_path=str(Path(os.environ['LOCALAPPDATA'])/'FlowTouch'/'WebView'))
            server.shutdown()
    except KeyboardInterrupt:
        pass
    except Exception as error:
        logging.exception('Studio window failed')
        ctypes.windll.user32.MessageBoxW(None,'Could not start Studio. Microsoft Edge WebView2 Runtime is required. See the README and studio.log for details.','FlowTouch Studio',0x10)
    finally:
        controller.pause()
        server.server_close()

if __name__ == '__main__':
    log_dir=Path(os.environ.get('LOCALAPPDATA',str(Path.home())))/'FlowTouch'
    log_dir.mkdir(parents=True,exist_ok=True)
    logging.basicConfig(filename=log_dir/'studio.log',level=logging.WARNING,format='%(asctime)s %(levelname)s %(message)s')
    main()
