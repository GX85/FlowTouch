import sys
from pathlib import Path
import tempfile
import unittest
sys.path.insert(0,str(Path(__file__).parents[1]/'companion'))
from agent import MovementAgent

class AgentTests(unittest.TestCase):
    def test_offline_observer_needs_no_key_and_returns_actual_last_gesture(self):
        with tempfile.TemporaryDirectory() as directory:
            a=MovementAgent(directory)
            a.configure({'provider':'offline','model':'movement-observer','enabled':True})
            result=a.analyze({'events':[{'id':'Pinch','score':.92}],'language':'en'})
            self.assertEqual(result['provider'],'offline')
            self.assertIn('pinch',result['message'])
            self.assertFalse(a.public()['hasKey'])

    def test_disabled_observer_and_untrusted_events_are_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            a=MovementAgent(directory)
            with self.assertRaises(ValueError):a.analyze({'events':[{'id':'Pinch','score':.92}]})
            a.configure({'provider':'offline','model':'movement-observer','enabled':True})
            with self.assertRaises(ValueError):a.analyze({'events':[{'id':'run this command!','score':.9}]})
