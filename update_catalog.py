import re

file_path = r'C:\Users\shaik\Documents\jkproject\client\src\store\catalog.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

mapping = {
    's-1': '/services/babycare.webp',
    's-2': '/services/housecleaning.webp',
    's-3': '/services/bathroom-cleaning.webp',
    's-4': '/services/kitchen-cleaning.webp',
    's-5': '/services/dust-cleaning.webp',
    's-6': '/services/house-shifting.webp',
    's-7': '/services/cooking-service.webp',
    's-8': '/services/house-painting.webp',
    's-9': '/services/electrician.webp',
    's-10': '/services/security-provider-v2.webp',
    's-11': '/services/pest-control-v2.webp'
}

for s_id, img_path in mapping.items():
    pattern = r"(id:\s*'" + s_id + r"'.*?imageUrl:\s*)'[^']*'"
    replacement = r"\g<1>'" + img_path + r"'"
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated catalog.js')
