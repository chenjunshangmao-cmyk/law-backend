import subprocess, os

BASE = "https://e5549ccf.claw-app-2026.pages.dev"
OUT = r"c:\Users\Administrator\WorkBuddy\Claw\complete-deploy\assets"

missing = [
    # icon chunks that Python failed to get
    "circle-alert--JdwDCud.js",
    "circle-x-DCLHBbC9.js",
    "clock-CS2w0mRu.js",
    "external-link-BzZk3C36.js",
    "plus-CTFbwpWj.js",
    "refresh-cw-NS5xkf2q.js",
    "target-CGsDc9kC.js",
    "app-BmCeXBoo.css",
]

ok, fail = 0, []
for fn in missing:
    path = os.path.join(OUT, fn)
    url = f"{BASE}/assets/{fn}"
    r = subprocess.run(["curl", "-s", "-L", "-o", path, "-w", "%{http_code}", url],
                      capture_output=True, text=True, timeout=60)
    status = r.stdout.strip()
    if os.path.exists(path):
        size = os.path.getsize(path)
        if size > 500:
            print(f"  [OK] {fn} ({size:,} bytes, HTTP {status})")
            ok += 1
        else:
            content = open(path, 'r', errors='ignore').read()
            print(f"  [WARN] {fn} ({size} bytes): {content[:80]}")
            fail.append(fn)
    else:
        print(f"  [FAIL] {fn}: no file, HTTP {status}")
        fail.append(fn)

# Delete wrong files (old app.css which is not the right hash)
wrong_css = os.path.join(OUT, "app.css")
if os.path.exists(wrong_css):
    os.remove(wrong_css)
    print("\n  [DEL] removed old app.css (will use app-BmCeXBoo.css)")

# Final count
total = sum(1 for _, _, files in os.walk(r"c:\Users\Administrator\WorkBuddy\Claw\complete-deploy") for _ in files)
print(f"\n=== DONE: {ok} OK, {len(fail)} failed, total {total} files ===")
if fail:
    print("Problem files:")
    for f in fail: print(f"  {f}")
