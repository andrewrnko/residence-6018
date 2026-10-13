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
# extras from alternates (published name -> source)
sips -s format jpeg -s formatOptions 82 -Z 2400 ~/RE-PHOTOS-20261012/02_ALTERNATES/ALT_Shed_Office.jpg --out img/l/34_Backyard_Office.jpg >/dev/null
sips -s format jpeg -s formatOptions 78 -Z 1200 ~/RE-PHOTOS-20261012/02_ALTERNATES/ALT_Shed_Office.jpg --out img/m/34_Backyard_Office.jpg >/dev/null
exiftool -q -q -overwrite_original -all= -tagsfromfile @ -icc_profile img/l/*.jpg img/m/*.jpg || true
python3 - <<'PY'
import os,json,re
fs=sorted(f[:-4] for f in os.listdir('img/l') if f.endswith('.jpg'))
SKY={'01','02','30','31'}  # enhanced sky per PHOTOS_V2_READY
out=[]
for f in fs:
    tw='Twilight' in f
    lab={'32_Virtual_Twilight_Front':'Front, at twilight','33_Virtual_Twilight_Entry':'Entry, at twilight'}.get(f) or re.sub(r'^\d+_','',f).replace('_',' ')
    out.append(dict(f=f,label=lab,ai=tw,tag='Virtual twilight' if tw else '',sky=f[:2] in SKY))
open('img/photos.js','w').write('window.PHOTOS='+json.dumps(out,indent=0)+';\n')
print(len(out),'photos;',sum(o['ai'] for o in out),'twilight')
PY
