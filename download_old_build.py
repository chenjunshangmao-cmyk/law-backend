import urllib.request
import urllib.error
import re
import os

BASE = "https://e5549ccf.claw-app-2026.pages.dev"
OUT = r"c:\Users\Administrator\WorkBuddy\Claw\complete-deploy"
HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
os.makedirs(OUT, exist_ok=True)
os.makedirs(os.path.join(OUT, "assets"), exist_ok=True)

ok, failed = 0, []

def fetch(url, path):
    global ok
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            content = r.read()
            if path:
                dir_ = os.path.dirname(path)
                if dir_:
                    os.makedirs(dir_, exist_ok=True)
                with open(path, 'wb') as f:
                    f.write(content)
            print(f"  [OK] {path} ({len(content)} bytes)")
            ok += 1
            return content
    except Exception as e:
        print(f"  [FAIL] {path}: {e}")
        failed.append(url)
        return None

# 1. index.html
print("[1] Fetching index.html...")
html = fetch(BASE + "/", os.path.join(OUT, "index.html")).decode('utf-8')

# 2. app.js + app.css
print("\n[2] Fetching app.js + app.css...")
appjs = fetch(BASE + "/assets/app.js", os.path.join(OUT, "assets", "app.js"))
appcss = fetch(BASE + "/assets/app.css", os.path.join(OUT, "assets", "app.css"))

# 3. Extract chunk refs from app.js
print("\n[3] Extracting chunk refs...")
chunk_refs = set()
css_refs = set()

if appjs:
    # Find "assets/XXX-HASH.js" patterns
    refs = re.findall(r'"assets/([^"]+\.(?:js|css))"', appjs.decode('utf-8', errors='ignore'))
    for r in refs:
        if r.endswith('.js'):
            chunk_refs.add(r)
        elif r.endswith('.css'):
            css_refs.add(r)

if appcss:
    # Extract @import or url() refs from CSS
    refs = re.findall(r'url\(["\']?([^)\'"]+)["\']?\)', appcss.decode('utf-8', errors='ignore'))
    for r in refs:
        if r.endswith('.css') and 'assets/' in r:
            css_refs.add(r.replace('assets/', ''))

print(f"  Found {len(chunk_refs)} JS chunks + {len(css_refs)} CSS refs")

# 4. Download all JS chunks
print(f"\n[4] Downloading {len(chunk_refs)} JS chunks...")
for c in sorted(chunk_refs):
    path = os.path.join(OUT, "assets", c)
    if not os.path.exists(path):
        fetch(BASE + "/assets/" + c, path)
    else:
        print(f"  [SKIP] {c} (exists)")

# 5. Download all CSS refs
print(f"\n[5] Downloading {len(css_refs)} CSS refs...")
for c in sorted(css_refs):
    path = os.path.join(OUT, "assets", c)
    if not os.path.exists(path):
        fetch(BASE + "/assets/" + c, path)
    else:
        print(f"  [SKIP] {c} (exists)")

# 6. Known icon assets (from old build structure)
print("\n[6] Trying known icon assets...")
icon_files = [
    "building-2-lVXkzonG.js", "circle-x-BLvES6cf.js",
    "external-link-CG7Kg4mT.js", "refresh-cw-BhxJ_MTF.js",
    "shield-NsWRgIpi.js", "shopping-bag-qJtKXq5V.js",
    "trash-2-siSrgMXK.js", "upload-orpDW_tJ.js",
    "users-BeUwJ-7w.js", "video-Dd4YZ7pM.js",
    "video-XrUIltFi.js", "zap-C7wl6_UV.js",
    "favicon.svg",
]
for icon in icon_files:
    path = os.path.join(OUT, "assets", icon)
    if not os.path.exists(path):
        fetch(BASE + "/assets/" + icon, path)
    else:
        print(f"  [SKIP] {icon} (exists)")

# Count
total = sum(len(files) + 0 for _, _, files in os.walk(OUT))
print(f"\n=== DONE: {ok} OK, {len(failed)} failed, total files ===")
if failed:
    print("Failed URLs:")
    for f in failed:
        print(f"  {f}")
