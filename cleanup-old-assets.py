import os, shutil

assets = r"c:\Users\Administrator\WorkBuddy\Claw\complete-deploy\assets"

# 删除旧的小文件占位符（< 490 bytes）
removed = []
for fn in os.listdir(assets):
    fp = os.path.join(assets, fn)
    if os.path.isfile(fp) and os.path.getsize(fp) < 490:
        os.remove(fp)
        removed.append(fn)
        print(f"  [DEL] {fn}")

# 统计
total = sum(1 for _, _, files in os.walk(r"c:\Users\Administrator\WorkBuddy\Claw\complete-deploy") for _ in files)
print(f"\nRemoved {len(removed)} old placeholder files")
print(f"Total files in complete-deploy: {total}")

# 列出 assets 目录
print("\nAssets directory contents:")
for fn in sorted(os.listdir(assets)):
    fp = os.path.join(assets, fn)
    size = os.path.getsize(fp)
    print(f"  {fn} ({size:,} bytes)")
