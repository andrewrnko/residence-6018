#!/bin/zsh
# Rebuild web copies + img/photos.js from the delivered listing photos. Re-run after any photo update.
set -e
SRC=~/RE-PHOTOS-20261012/01_LISTING_READY
cd ~/listing-6018
rm -rf img/l img/m; mkdir -p img/l img/m
for f in $SRC/*.jpg; do b=$(basename $f .jpg)
  sips -s format jpeg -s formatOptions 82 -Z 2400 "$f" --out img/l/$b.jpg >/dev/null
  sips -s format jpeg -s formatOptions 78 -Z 1200 "$f" --out img/m/$b.jpg >/dev/null
done
exiftool -q -q -overwrite_original -all= -tagsfromfile @ -icc_profile img/l/*.jpg img/m/*.jpg || true
python3 - <<'PY'
import os,json,re
fs=sorted(f[:-4] for f in os.listdir('img/l') if f.endswith('.jpg'))
out=[]
for f in fs:
    ai=bool(re.search(r'(^|_)(AI|VIRTUAL|Virtual)(_|$)',f)) or 'Twilight' in f or 'AI_' in f
    lab=re.sub(r'^\d+_','',f).replace('AI_','').replace('_',' ')
    out.append(dict(f=f,label=lab,ai=ai))
open('img/photos.js','w').write('window.PHOTOS='+json.dumps(out,indent=0)+';\n')
print(len(out),'photos;',sum(o['ai'] for o in out),'AI-labeled')
PY
