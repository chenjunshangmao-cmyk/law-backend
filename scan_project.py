import os
import subprocess

base = r'c:\Users\Administrator\WorkBuddy\Claw'

# frontend pages
fe_pages = os.path.join(base, 'frontend', 'src', 'pages')
pages = sorted(os.listdir(fe_pages)) if os.path.exists(fe_pages) else []
print('=== 前端页面 ===')
for p in pages:
    print(f'  {p}')

# backend routes
be_routes = os.path.join(base, 'backend', 'src', 'routes')
routes = sorted(os.listdir(be_routes)) if os.path.exists(be_routes) else []
print('\n=== 后端路由 ===')
for r in routes:
    fp = os.path.join(be_routes, r)
    size = os.path.getsize(fp) if os.path.isfile(fp) else 0
    print(f'  {size:>6} bytes  {r}')

# Git
print('\n=== Git Remote ===')
r1 = subprocess.run(['git', 'remote', '-v'], capture_output=True, text=True, cwd=base)
print(r1.stdout or r1.stderr)

print('\n=== Git Log (recent 5) ===')
r2 = subprocess.run(['git', 'log', '--oneline', '-5'], capture_output=True, text=True, cwd=base)
print(r2.stdout)

print('\n=== Git Status (deleted files in complete-deploy) ===')
r3 = subprocess.run(['git', 'status', '--short'], capture_output=True, text=True, cwd=base, encoding='utf-8', errors='replace')
for line in r3.stdout.splitlines():
    if ' D ' in line and 'complete-deploy' in line:
        print(f'  {line}')

print('\n=== complete-deploy 现状 ===')
cd_path = os.path.join(base, 'complete-deploy')
total = 0
for root, _, files in os.walk(cd_path):
    for f in files:
        fp = os.path.join(root, f)
        size = os.path.getsize(fp)
        total += 1
        rel = os.path.relpath(fp, cd_path)
        print(f'  {size:>8} bytes  {rel}')
print(f'\n总计: {total} 个文件')

print('\n=== deploy-package 现状 ===')
dp_path = os.path.join(base, 'deploy-package')
total2 = 0
for root, _, files in os.walk(dp_path):
    for f in files:
        fp = os.path.join(root, f)
        size = os.path.getsize(fp)
        total2 += 1
        rel = os.path.relpath(fp, dp_path)
        print(f'  {size:>8} bytes  {rel}')
print(f'\n总计: {total2} 个文件')

# Key source files check
print('\n=== 关键源码文件 ===')
key_files = [
    'frontend/src/pages/ServicesPage.tsx',
    'frontend/src/services/api.ts',
    'backend/src/routes/payment.db.js',
    'backend/src/routes/shouqianba.db.js',
    'backend/src/index.db.js',
    'frontend/src/App.tsx',
]
for kf in key_files:
    fp = os.path.join(base, kf)
    exists = os.path.exists(fp)
    size = os.path.getsize(fp) if exists else 0
    print(f'  {"OK" if exists else "MISS"}  {kf} ({size} bytes)')
