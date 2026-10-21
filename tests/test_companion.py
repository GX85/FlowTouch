import sys
sys.path.insert(0,str(__import__('pathlib').Path(__file__).parents[1]/'companion'))
import importlib.util
from pathlib import Path
import unittest
import time
import threading
import http.client
import json
from http.server import ThreadingHTTPServer
spec = importlib.util.spec_from_file_location('flowtouch', Path(__file__).parents[1] / 'companion' / 'flowtouch.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class CompanionTests(unittest.TestCase):
    def setUp(self):
        self.c = module.Controller(dry_run=True)

    def test_actions_require_explicit_arm(self):
        with self.assertRaises(PermissionError): self.c.execute({'action': 'click'})
        self.c.execute({'action': 'arm'})
        self.c.execute({'action': 'click'})
        self.c.execute({'action': 'disarm'})
        with self.assertRaises(PermissionError): self.c.execute({'action': 'youtube'})

    def test_rejects_arbitrary_actions(self):
        with self.assertRaises(ValueError): self.c.execute({'action': 'powershell'})

    def test_heartbeat_timeout(self):
        self.c.execute({'action': 'arm'})
        self.c.deadline = time.monotonic() - 1
        with self.assertRaises(PermissionError): self.c.execute({'action': 'copy'})

    def test_invalid_and_panic_coordinates(self):
        self.c.execute({'action': 'arm'})
        with self.assertRaises(ValueError): self.c.execute({'action': 'pointer', 'x': float('nan'), 'y': .5})
        self.c.last.clear()
        with self.assertRaises(PermissionError): self.c.execute({'action': 'pointer', 'x': 0, 'y': 0})
        self.assertFalse(self.c.armed)

    def test_game_keys_release_on_pause_and_watchdog(self):
        self.c.execute({'action':'arm'})
        self.c.execute({'action':'keydown','keys':['Space']})
        self.assertEqual(self.c.held_keys,{'Space'})
        self.c.execute({'action':'keyup','keys':['Space']})
        self.assertFalse(self.c.held_keys)
        self.c.execute({'action':'keydown','keys':['ArrowUp']})
        self.c.deadline=time.monotonic()-1
        self.c.watchdog()
        self.assertFalse(self.c.held_keys)
        self.assertFalse(self.c.armed)

    def test_shortcuts_and_urls_are_validated(self):
        self.c.execute({'action':'arm'})
        self.c.execute({'action':'shortcut','keys':['Control','S']})
        self.assertFalse(self.c.held_keys)
        for data in [{'action':'keydown','keys':['Unknown']},{'action':'keyup','keys':['Space','Space']},{'action':'url','url':'javascript:alert(1)'},{'action':'app','path':'cmd.exe'}]:
            self.c.last.clear()
            with self.assertRaises(ValueError):self.c.execute(data)

    def test_http_origin_token_and_allowlist(self):
        server = ThreadingHTTPServer(('127.0.0.1', 0), module.make_handler(Path(__file__).parents[1] / 'dist', self.c))
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        def post(data, origin='http://127.0.0.1:8765', token=None):
            connection = http.client.HTTPConnection('127.0.0.1', server.server_port)
            connection.request('POST', '/api/action', json.dumps(data), {'Host':'127.0.0.1:8765','Origin':origin,'Content-Type':'application/json','X-FlowTouch-Token':token or self.c.token})
            response = connection.getresponse(); response.read(); connection.close(); return response.status
        try:
            connection = http.client.HTTPConnection('127.0.0.1', server.server_port)
            headers = {'Host':'127.0.0.1:8765','Sec-Fetch-Site':'cross-site','Sec-Fetch-Mode':'navigate','Sec-Fetch-Dest':'document'}
            connection.request('GET','/studio/',headers=headers)
            response = connection.getresponse(); response.read()
            self.assertEqual(response.status,200)
            connection.request('GET','/api/session',headers=headers)
            response = connection.getresponse(); response.read()
            self.assertEqual(response.status,403)
            connection.close()
            self.assertEqual(post({'action':'arm'}, origin='https://external.example'), 403)
            self.assertEqual(post({'action':'arm'}, token='wrong'), 403)
            self.assertEqual(post({'action':'click'}), 409)
            self.assertEqual(post({'action':'arm'}), 200)
            self.assertEqual(post({'action':'copy'}), 200)
            self.assertEqual(post({'action':'shell'}), 400)
        finally:
            server.shutdown();server.server_close();thread.join()

if __name__ == '__main__': unittest.main()
