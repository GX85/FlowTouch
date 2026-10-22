from pathlib import Path
import shutil
import subprocess
import sys
import hashlib
import json
ROOT=Path(__file__).resolve().parents[1]
BUILD=ROOT.parent/'desktop-build'
APP=BUILD/'app'
OUT=ROOT.parents[1]/'outputs'
if APP.resolve().parent != BUILD.resolve():
    raise RuntimeError('Unexpected app staging path')
if APP.exists():
    shutil.rmtree(APP)
APP.mkdir(parents=True,exist_ok=True)
shutil.copytree(ROOT/'dist',APP,dirs_exist_ok=True,ignore=shutil.ignore_patterns('downloads','.openai'))
subprocess.run([sys.executable,'-m','PyInstaller','--noconfirm','--clean','--onedir','--windowed','--noupx','--name','FlowTouch Studio','--hidden-import','backports.tarfile','--exclude-module','PyQt5','--exclude-module','PyQt6','--exclude-module','PySide6','--exclude-module','tkinter','--distpath',str(OUT),'--workpath',str(BUILD/'pyinstaller-studio'),'--specpath',str(BUILD),'--add-data',str(APP)+';app',str(ROOT/'companion'/'flowtouch.py')],check=True,cwd=ROOT)
portable=OUT/'FlowTouch Studio'
report_file=BUILD/'packaged-self-test.json'
report_file.unlink(missing_ok=True)
subprocess.run([str(portable/'FlowTouch Studio.exe'),'--self-test',str(report_file)],check=True,timeout=25)
report=json.loads(report_file.read_text('utf8'))
if not all(report.get(key) for key in ('ok','studio','model','worker','agent')):raise RuntimeError('Packaged Studio verification failed')
shutil.copy2(ROOT/'companion'/'README.md',portable/'README.md')
archive=Path(shutil.make_archive(str(OUT/'FlowTouch-Studio-Windows'),'zip',root_dir=OUT,base_dir=portable.name))
destination=ROOT/'public'/'downloads';destination.mkdir(exist_ok=True)
shutil.copy2(archive,destination/archive.name)
with archive.open('rb') as stream:digest=hashlib.file_digest(stream,'sha256').hexdigest()
(destination/'SHA256SUMS.txt').write_text(digest+'  '+archive.name+'\n','ascii')
print('Portable build:',archive)
print('SHA-256:',digest)
