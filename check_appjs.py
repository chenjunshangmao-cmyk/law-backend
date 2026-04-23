import re

with open(r'c:\Users\Administrator\WorkBuddy\Claw\complete-deploy\assets\app.js', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

refs = re.findall(r'"assets/([^"]+\.(?:js|css))"', content)
print(f'Total refs found: {len(refs)}')
for r in sorted(set(refs)):
    print(r)
