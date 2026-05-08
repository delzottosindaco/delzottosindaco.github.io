import os, re, urllib.parse

folder = r'C:\Users\Daniela\Downloads\pierangelo-del-zotto---campagna-elettorale-venezia (3)\public\stampa'
files = [f for f in os.listdir(folder) if f.endswith('.pdf')]

# Build mapping: (date, title) -> encoded filename
mapping = {}
for f in files:
    m = re.match(r'(\d{4})_(\d{2})_(\d{2})_(.*?)\.pdf$', f)
    if not m:
        continue
    data = f'{m.group(1)}-{m.group(2)}-{m.group(3)}'
    titolo = m.group(4).strip()
    encoded = urllib.parse.quote(f)
    mapping[(data, titolo)] = f'/stampa/{encoded}'

# Read App.tsx
app_path = r'C:\Users\Daniela\Downloads\pierangelo-del-zotto---campagna-elettorale-venezia (3)\src\App.tsx'
with open(app_path, 'r', encoding='utf-8') as fh:
    content = fh.read()

# For each entry, add link field
count = 0
for (data, titolo), link in mapping.items():
    escaped_titolo = titolo.replace("'", "\\'")
    # Find the line with this data+titolo and add link
    old = f"titolo: '{escaped_titolo}', tipo: 'articolo'"
    new = f"titolo: '{escaped_titolo}', tipo: 'articolo', link: '{link}'"
    if old in content:
        content = content.replace(old, new, 1)
        count += 1

with open(app_path, 'w', encoding='utf-8') as fh:
    fh.write(content)

print(f"Added links to {count}/{len(mapping)} entries")
