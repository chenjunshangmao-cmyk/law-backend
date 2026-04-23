import os
import subprocess

base = r'c:\Users\Administrator\WorkBuddy\Claw'

# Check what commit bd77e5b contains vs current
r = subprocess.run(['git', 'show', '--stat', 'bd77e5b'], capture_output=True, text=True, cwd=base, encoding='utf-8', errors='replace')
print('=== bd77e5b (e5549ccf source commit) ===')
print(r.stdout[:3000])

# Check frontend/src changes between bd77e5b and HEAD
r2 = subprocess.run(['git', 'diff', 'bd77e5b', 'HEAD', '--', 'frontend/src/pages/'], capture_output=True, text=True, cwd=base, encoding='utf-8', errors='replace')
print('\n=== frontend pages changed since bd77e5b ===')
if r2.stdout:
    lines = r2.stdout.splitlines()
    print(f'Changed files: {len([l for l in lines if l.startswith(\"diff --git\")])}')
    for l in lines:
        if l.startswith('diff --git') or l.startswith('+') or l.startswith('-'):
            if len(l) < 200:
                print(l)
else:
    print('No diff (or error)')

# Check ServicesPage content difference
r3 = subprocess.run(['git', 'show', 'bd77e5b:frontend/src/pages/ServicesPage.tsx'], capture_output=True, text=True, cwd=base, encoding='utf-8', errors='replace')
old_content = r3.stdout
current = os.path.join(base, 'frontend', 'src', 'pages', 'ServicesPage.tsx')
with open(current, 'r', encoding='utf-8') as f:
    cur_content = f.read()
print(f'\n=== ServicesPage.tsx comparison ===')
print(f'bd77e5b version: {len(old_content)} bytes')
print(f'HEAD version:     {len(cur_content)} bytes')
print(f'DIFFERENT: {old_content != cur_content}')

# Show what files were added/modified/deleted
r4 = subprocess.run(['git', 'log', '--oneline', 'bd77e5b..HEAD'], capture_output=True, text=True, cwd=base, encoding='utf-8', errors='replace')
print('\n=== Commits between bd77e5b and HEAD ===')
print(r4.stdout or r4.stderr[:500])
