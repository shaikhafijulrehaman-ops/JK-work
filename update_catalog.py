import re

file_path = r'c:\Users\shaik\OneDrive\Documents\jkproject\client\src\store\catalog.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

mapping = {
    's-1': '/services/babycare.jpg',
    's-2': '/services/housecleaning.jpg',
    's-3': '/services/bathroom-cleaning.jpg',
    's-4': '/services/kitchen-cleaning.jpg',
    's-5': '/services/dust-cleaning.jpg',
    's-6': '/services/house-shifting.jpg',
    's-7': '/services/cooking-service.jpg',
    's-8': '/services/house-painting.jpg',
    's-9': '/services/electrician.jpg',
    's-10': '/services/security-provider.jpg',
    's-11': '/services/pest-control.jpg'
}

for s_id, img_path in mapping.items():
    pattern = r"(id:\s*'" + s_id + r"'.*?imageUrl:\s*)'[^']*'"
    replacement = r"\g<1>'" + img_path + r"'"
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated catalog.js')
