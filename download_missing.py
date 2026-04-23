import urllib.request, os

BASE = "https://e5549ccf.claw-app-2026.pages.dev"
OUT = r"c:\Users\Administrator\WorkBuddy\Claw\complete-deploy\assets"
HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

needed = [
    "app-BmCeXBoo.css",
    "circle-alert--JdwDCud.js",
    "circle-x-DCLHBbC9.js",
    "clock-CS2w0mRu.js",
    "external-link-BzZk3C36.js",
    "plus-CTFbwpWj.js",
    "qr-code-CymnADeT.js",
    "refresh-cw-NS5xkf2q.js",
    "sparkles-CiiFND-i.js",
    "target-CGsDc9kC.js",
    "trash-2-D_GfdIrD.js",
    "upload-CPepE9sz.js",
    "users-Coa7o6pv.js",
]

ok, fail = 0, []
for fn in needed:
    url = f"{BASE}/assets/{fn}"
    path = os.path.join(OUT, fn)
    if os.path.exists(path):
        print(f"  [SKIP] {fn} (exists)")
        continue
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=30) as r:
            content = r.read()
            with open(path, 'wb') as f:
                f.write(content)
            print(f"  [OK] {fn} ({len(content):,} bytes)")
            ok += 1
    except Exception as e:
        print(f"  [FAIL] {fn}: {e}")
        fail.append(url)

# Count total
total = sum(1 for _, _, files in os.walk(r"c:\Users\Administrator\WorkBuddy\Claw\complete-deploy") for _ in files)
print(f"\n=== DONE: {ok} downloaded, {len(fail)} failed, total {total} files ===")
if fail:
    print("Failed:")
    for u in fail: print(f"  {u}")
