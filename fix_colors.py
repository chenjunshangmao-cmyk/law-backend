import re
with open(r'C:\Users\Administrator\WorkBuddy\Claw\frontend\src\pages\PublishPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace input field backgrounds
content = content.replace("background: '#0F1117', border: '1.5px solid #2A2D3A'," , "background: '#ffffff', border: '1.5px solid #D1D5DB',")
# Replace border colors
content = content.replace("#2A2D3A", "#E5E7EB")
# Replace light text colors in inputs
content = content.replace("color: '#F1F3F5'", "color: '#111827'")

with open(r'C:\Users\Administrator\WorkBuddy\Claw\frontend\src\pages\PublishPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done - replacements applied')
