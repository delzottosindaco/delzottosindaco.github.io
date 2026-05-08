from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import os

# Colors from logo
VERDE = colors.HexColor("#80B122")
GIALLO = colors.HexColor("#F5E106")
BLU = colors.HexColor("#211C6C")

# Candidate data: (position, name, age, profession)
candidati = [
    (0, "Pierangelo Del Zotto", 72, "Candidato Sindaco, già Dirigente Superiore della Polizia di Stato"),
    (1, "Corrado Callegari", 65, "Già parlamentare, pensionato"),
    (2, "Paolo Pizzolato", 68, "Pensionato, ragioniere e perito commerciale"),
    (3, "Lucio Gianni", 68, "Ragioniere, ex dirigente enti pubblici e società partecipate"),
    (4, "Lucia Baggio", 51, "Analista contabile, impiegata amministrativa"),
    (5, "Carmine Barbaro", 82, "Pensionato, ex dipendente Enichem/Syndial"),
    (6, "Fabio Bressanello", 59, "Addetto in fornace del vetro a Murano"),
    (7, "Giulia Buzzo", 40, "Addetta alla ristorazione"),
    (8, "Lorena Della Togna", 57, "Laureata in Storia e Antropologia, operatrice culturale"),
    (9, "Luciana Ferretti", 80, "Pensionata"),
    (10, "Sonia Franzoi", 60, "Impiegata amministrativa settore metalmeccanico"),
    (11, "Tiziana Fraticelli", 58, "Edicolante"),
    (12, "Stefano Gabbanoto", 60, "Pensionato, ex vetraio e gestore di edicola"),
    (13, "Silvana Gaggio", 76, "Pensionata, ex impiegata amministrativa e segretaria"),
    (14, "Martina Galvani", 61, "Editor, scrittrice, ghostwriter, insegnante di scrittura"),
    (15, "Valentina Garoli", 31, "Impiegata settore assicurativo"),
    (16, "Cristina Giacomazzi", 61, "Addetta alla vendita, settore isolamento termico"),
    (17, "Marzia Lodoli", 59, "Operaia, caposquadra Protezione Civile"),
    (18, "Vincenzo Marchesi", 73, "Pensionato, ex artigiano edile e imprenditore"),
    (19, "Giuseppe Marzato", 62, "Commerciante, gestore negozio di tabacchi"),
    (20, "Patrizia Mel", 74, "Terapista cranio sacrale"),
    (21, "Christian Omiccioli", 52, "Laureato Ca' Foscari, tecnico artistico e dello spettacolo"),
    (22, "Marco Paggiaro", 39, "Cuoco professionista"),
    (23, "Giovanni Pagotto", 36, "Consulente assicurativo"),
    (24, "Anna-Maria Palazzi", 71, "Pensionata, ex dipendente comunale"),
    (25, "Loris Peltrera", 46, "Autista NCC e conducente di motoscafi"),
    (26, "Simonetta Puppa", 64, "Operatrice culturale e artistica"),
    (27, "Fulvio Savio", 70, "Pensionato, ex dipendente Fondazione Querini Stampalia e autista ACTV"),
    (28, "Giorgio Tana", 83, "Pensionato, ex dirigente bancario e associativo"),
    (29, "Roberta Travaglia", 60, "Ragioniera e perito commerciale, consulente contabile"),
    (30, "Fiorella Trevisan", 59, "Autista di mezzi pubblici"),
    (31, "Giorgio Tronca", 58, "Impiegato tecnico, settore impiantistica"),
    (32, "Ivana Varagnolo", 52, "Segretaria e addetta alla contabilità"),
    (33, "Francesco Vianello", 48, "Insegnante di scuola superiore"),
    (34, "Michele Vio", 60, "Artigiano e taxista"),
    (35, "Laura Zaniol", 60, "Imprenditrice, artigianato tradizionale muranese"),
    (36, "Gianfranco Zennaro", 71, "Artigiano in pensione"),
]

output_path = os.path.join("public", "lista-candidati.pdf")

doc = SimpleDocTemplate(
    output_path,
    pagesize=A4,
    topMargin=20*mm,
    bottomMargin=15*mm,
    leftMargin=15*mm,
    rightMargin=15*mm,
)

styles = getSampleStyleSheet()

title_style = ParagraphStyle(
    'Title2',
    parent=styles['Title'],
    fontSize=18,
    textColor=BLU,
    spaceAfter=4*mm,
    alignment=TA_CENTER,
)

subtitle_style = ParagraphStyle(
    'Subtitle2',
    parent=styles['Normal'],
    fontSize=11,
    textColor=colors.HexColor("#444444"),
    alignment=TA_CENTER,
    spaceAfter=8*mm,
)

cell_name = ParagraphStyle('CellName', parent=styles['Normal'], fontSize=9, leading=12)
cell_prof = ParagraphStyle('CellProf', parent=styles['Normal'], fontSize=8.5, leading=11, textColor=colors.HexColor("#333333"))

elements = []

# Title
elements.append(Paragraph("Lista Candidati", title_style))
elements.append(Paragraph("Pierangelo Del Zotto Sindaco — Elezioni Comunali Venezia 2026", subtitle_style))

# Table header
header = ["N.", "Nome e Cognome", "Età", "Professione"]

data = [header]
for pos, name, age, prof in candidati:
    data.append([
        str(pos),
        Paragraph(name, cell_name),
        str(age),
        Paragraph(prof, cell_prof),
    ])

col_widths = [10*mm, 50*mm, 12*mm, None]
# Calculate last column
page_w = A4[0] - 30*mm  # left+right margins
col_widths[3] = page_w - sum(col_widths[:3])

table = Table(data, colWidths=col_widths, repeatRows=1)

table.setStyle(TableStyle([
    # Header
    ('BACKGROUND', (0, 0), (-1, 0), VERDE),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 10),
    ('BOTTOMPADDING', (0, 0), (-1, 0), 4*mm),
    ('TOPPADDING', (0, 0), (-1, 0), 3*mm),
    
    # Body
    ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
    ('FONTSIZE', (0, 1), (0, -1), 9),
    ('FONTSIZE', (2, 1), (2, -1), 9),
    ('TOPPADDING', (0, 1), (-1, -1), 2*mm),
    ('BOTTOMPADDING', (0, 1), (-1, -1), 2*mm),
    
    # Alignment
    ('ALIGN', (0, 0), (0, -1), 'CENTER'),
    ('ALIGN', (2, 0), (2, -1), 'CENTER'),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    
    # Alternating rows
    *[('BACKGROUND', (0, i), (-1, i), colors.HexColor("#F5F5F0")) for i in range(2, len(data), 2)],
    
    # Grid
    ('LINEBELOW', (0, 0), (-1, 0), 1.5, VERDE),
    ('LINEBELOW', (0, 1), (-1, -2), 0.5, colors.HexColor("#DDDDDD")),
    ('LINEBELOW', (0, -1), (-1, -1), 1, VERDE),
]))

elements.append(table)

# Footer
footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=colors.HexColor("#999999"), alignment=TA_CENTER, spaceBefore=6*mm)
elements.append(Paragraph("delzottosindaco.github.io — Materiale riservato alla stampa", footer_style))

doc.build(elements)
print(f"PDF created: {output_path}")
