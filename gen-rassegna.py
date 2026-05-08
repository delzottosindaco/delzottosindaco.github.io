import os, re

folder = r'C:\Users\Daniela\Desktop\piero\stampa\rassegna stampa'
files = [f for f in os.listdir(folder) if f.endswith('.pdf') and f != 'rassegna stampa.zip']

items = []
for f in files:
    m = re.match(r'(\d{4})_(\d{2})_(\d{2})_(.*?)\.pdf$', f)
    if not m:
        continue
    data = f'{m.group(1)}-{m.group(2)}-{m.group(3)}'
    titolo = m.group(4).strip()
    
    tl = titolo.lower()
    if any(k in tl for k in ['ticket', 'flussi', 'turismo', 'paganti', 'accesso']):
        tema = 'Turismo/Ticket'
    elif any(k in tl for k in ['candidat', 'elezioni', 'sindaco', 'corsa', 'lizza', 'scheda', 'liste', 'campagna', 'sondaggio', 'voto', 'comunali', 'capolista', 'municipalit']):
        tema = 'Elezioni'
    elif any(k in tl for k in ['sicurezza', 'polizia', 'vigili', 'agenti']):
        tema = 'Sicurezza'
    elif any(k in tl for k in ['porto', 'logistica']):
        tema = 'Porto/Logistica'
    elif 'trasport' in tl or 'actv' in tl or 'mobilit' in tl:
        tema = 'Mobilita'
    elif any(k in tl for k in ['case', 'insula', 'alloggi']):
        tema = 'Casa/Patrimonio'
    elif any(k in tl for k in ['biennale', 'cultura', 'fondazion']):
        tema = 'Cultura'
    elif any(k in tl for k in ['bilancio', 'rendiconto', 'stipendio', 'spese']):
        tema = 'Finanze'
    elif any(k in tl for k in ['25 aprile', 'san marco', 'liberazione', 'patrono']):
        tema = 'Storia/Ricorrenze'
    elif any(k in tl for k in ['scommesse', 'wall street']):
        tema = 'Sondaggi/Media'
    elif any(k in tl for k in ['vandal', 'letame', 'imbrattata', 'offens', 'biglietti offensivi']):
        tema = 'Episodi di campagna'
    elif any(k in tl for k in ['artigian', 'albergator', 'confartigianato']):
        tema = 'Categorie economiche'
    elif 'brugnaro' in tl:
        tema = 'Amministrazione uscente'
    else:
        tema = 'Politica locale'
    
    if 'resegone' in tl:
        testata = 'Resegone Online'
    else:
        testata = 'Quotidiano locale'
    
    priorita = 'alta' if 'del zotto' in tl else 'normale'
    
    items.append({
        'data': data, 'testata': testata, 'titolo': titolo,
        'tipo': 'articolo', 'tema': tema, 'priorita': priorita
    })

items.sort(key=lambda x: (-int(x['data'].replace('-','')), x['titolo']))

lines = []
for it in items:
    t = it['titolo'].replace("'", "\\'")
    ts = it['testata']
    line = "  { data: '%s', testata: '%s', titolo: '%s', tipo: 'articolo', tema: '%s', priorita: '%s' }," % (
        it['data'], ts, t, it['tema'], it['priorita'])
    lines.append(line)

with open(r'C:\Users\Daniela\Downloads\pierangelo-del-zotto---campagna-elettorale-venezia (3)\rassegna-output.txt', 'w', encoding='utf-8') as f:
    f.write("const rassegnaStampa: PressItem[] = [\n")
    for l in lines:
        f.write(l + "\n")
    f.write("];\n")

print(f"Done: {len(items)} items written to rassegna-output.txt")
