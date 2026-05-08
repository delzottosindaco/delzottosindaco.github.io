import os
import re

# Percorsi
project_folder = r'C:\Users\Daniela\Downloads\pierangelo-del-zotto---campagna-elettorale-venezia (3)'
casellari_folder = os.path.join(project_folder, 'public', 'casellari')
app_path = os.path.join(project_folder, 'src', 'App.tsx')

# Leggere tutti i PDF
pdf_files = [f for f in os.listdir(casellari_folder) if f.endswith('.pdf')]

# Leggi App.tsx
with open(app_path, 'r', encoding='utf-8') as fh:
    content = fh.read()

# Mappa nomi: Cognome Nome → Nome Cognome (come è nel codice React)
nome_mapping = {
    'Callegari Corrado': 'Corrado Callegari',
    'Gianni Lucio': 'Lucio Gianni',
    'Pizzolato Paolo': 'Paolo Pizzolato',
    'Baggio Lucia': 'Lucia Baggio',
    'Barbaro Carmine': 'Carmine Barbaro',
    'Bressanello Fabio': 'Fabio Bressanello',
    'Buzzo Giulia': 'Giulia Buzzo',
    'Della Togni Lorena': 'Lorena Della Togna',
    'Ferretti Luciana': 'Luciana Ferretti',
    'Franzoi Sonia': 'Sonia Franzoi',
    'Fratlicelli Tiziana': 'Tiziana Fratlicelli',
    'Gabbanato Stefano': 'Stefano Gabbanato',
    'Gaggio Silvana': 'Silvana Gaggio',
    'Galvani Martina': 'Martina Galvani',
    'Garoli Valentina': 'Valentina Garoli',
    'Giacomazzi Cristina': 'Cristina Giacomazzi',
    'Lodoli Marzia': 'Marzia Lodoli',
    'Marchesi Vincenzo': 'Vincenzo Marchesi',
    'Marzato Giuseppe': 'Giuseppe Marzato',
    'Mel Patrizia': 'Patrizia Mel',
    'Omiccioli Christian': 'Christian Omiccioli',
    'Paggiaro Marco': 'Marco Paggiaro',
    'Pagotto Giovanni': 'Giovanni Pagotto',
    'Palazzi Anna Maria': 'Anna-Maria Palazzi',
    'Peltrera Loris': 'Loris Peltrera',
    'Puppa Simonetta': 'Simonetta Puppa',
    'Savio Fulvio': 'Fulvio Savio',
    'Tana Giorgio': 'Giorgio Tana',
    'Travaglia Roberta': 'Roberta Travaglia',
    'Trevisan Fiorella': 'Fiorella Trevisan',
    'Tronca Giorgio': 'Giorgio Tronca',
    'Varagnolo Ivana': 'Ivana Varagnolo',
    'Vianello Francesco': 'Francesco Vianello',
    'Vio Michele': 'Michele Vio',
    'Zaniol Laura': 'Laura Zaniol',
    'Zennaro Gianfranco': 'Gianfranco Zennaro',
}

count = 0
not_found = []

for pdf_nome, react_nome in nome_mapping.items():
    encoded = f'{pdf_nome}.pdf'.replace(' ', '%20')
    
    # Cerca la riga con name: 'Nome Cognome', e aggiungi criminalRecordUrl
    # Pattern: name: 'Nome Cognome', img → name: 'Nome Cognome', criminalRecordUrl: '/casellari/...', img
    pattern = rf"(name: '{re.escape(react_nome)}',)"
    
    match = re.search(pattern, content)
    if match:
        line_before = match.group(1)
        new_line = f"{line_before} criminalRecordUrl: '/casellari/{encoded}',"
        content = content.replace(line_before, new_line, 1)
        count += 1
        print(f"OK: {react_nome} → /casellari/{pdf_nome.replace(' ', '%20')}")
    else:
        not_found.append(react_nome)
        print(f"NON TROVATO: {react_nome}")

with open(app_path, 'w', encoding='utf-8') as fh:
    fh.write(content)

print(f"\n{'='*50}")
print(f"Aggiunti {count} link su {len(nome_mapping)} candidati")
if not_found:
    print(f"\nNon trovati ({len(not_found)}): {', '.join(not_found)}")