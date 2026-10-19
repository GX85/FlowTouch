"""Run after npm run build. Excludes the download archive from its own app copy."""
from pathlib import Path
import shutil
import zipfile
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'downloads'
OUT.mkdir(parents=True, exist_ok=True)
archive = OUT / 'FlowTouch-Windows.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for p in (ROOT / 'companion').iterdir():
        if p.is_file(): z.write(p, 'FlowTouch/' + p.name)
    for p in (ROOT / 'dist').rglob('*'):
        rel = p.relative_to(ROOT / 'dist')
        if p.is_file() and rel.parts[0] != 'downloads': z.write(p, 'FlowTouch/app/' + rel.as_posix())
(ROOT / 'dist' / 'downloads').mkdir(exist_ok=True)
shutil.copy2(archive, ROOT / 'dist' / 'downloads' / archive.name)
print(str(archive))
