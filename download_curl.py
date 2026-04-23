import subprocess, os, shutil

BASE = "https://e5549ccf.claw-app-2026.pages.dev"
OUT = r"c:\Users\Administrator\WorkBuddy\Claw\complete-deploy\assets"

needed = [
    "app-BmCeXBoo.css",
    "circle-alert--JdwDCud.js",
    "circle-x-DCLHBbC9.js",
    "clock-CS2w0mRu.js",
    "external-link-BzZk3C36.js",
    "plus-CTFbwpWj.js",
    "refresh-cw-NS5xkf2q.js",
    "target-CGsDc9kC.js",
    "sparkles-CiiFND-i.js",
    "qr-code-CymnADeT.js",
]

ok, fail = 0, []
for fn in needed:
    path = os.path.join(OUT, fn)
    url = f"{BASE}/assets/{fn}"
    result = subprocess.run(
        ["curl", "-s", "-L", "-o", path, url],
        capture_output=True, text=True, timeout=60
    )
    if os.path.exists(path):
        size = os.path.getsize(path)
        if size > 500:
            print(f"  [OK] {fn} ({size:,} bytes)")
            ok += 1
        else:
            print(f"  [SMALL/ERR] {fn} ({size} bytes) - {open(path,'r',errors='ignore').read()[:100]}")
            fail.append(fn)
    else:
        print(f"  [FAIL] {fn} - no file")
        fail.append(fn)

print(f"\nDone: {ok} OK, {len(fail)} problem files")
