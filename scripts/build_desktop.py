from pathlib import Path
import shutil
import subprocess
import sys
ROOT=Path(__file__).resolve().parents[1]
BUILD=ROOT.parent/'desktop-build'
APP=BUILD/'app'
OUT=ROOT.parents[1]/'outputs'
APP.mkdir(parents=True,exist_ok=True)
shutil.copytree(ROOT/'dist',APP,dirs_exist_ok=True,ignore=shutil.ignore_patterns('downloads','.openai'))
subprocess.run([sys.executable,'-m','PyInstaller','--noconfirm','--onefile','--console','--name','FlowTouch','--distpath',str(OUT),'--workpath',str(BUILD/'pyinstaller'),'--specpath',str(BUILD),'--add-data',str(APP)+';app',str(ROOT/'companion'/'flowtouch.py')],check=True,cwd=ROOT)
(ROOT/'public'/'downloads').mkdir(exist_ok=True)
shutil.copy2(OUT/'FlowTouch.exe',ROOT/'public'/'downloads'/'FlowTouch.exe')
print(OUT/'FlowTouch.exe')
