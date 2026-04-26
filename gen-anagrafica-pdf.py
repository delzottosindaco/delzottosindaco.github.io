from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER

VERDE = colors.HexColor("#80B122")
BLU = colors.HexColor("#211C6C")

candidati = [
    (1, "Corrado Callegari", "Venezia", "06/09/1960"),
    (2, "Paolo Pizzolato", "Mira (VE)", "02/07/1957"),
    (3, "Lucio Gianni", "Chioggia (VE)", "21/05/1958"),
    (4, "Lucia Baggio", "Padova", "24/09/1974"),
    (5, "Carmine Barbaro", "Venezia", "28/01/1944"),
    (6, "Fabio Bressanello", "Venezia", "12/09/1966"),
    (7, "Giulia Buzzo", "Venezia", "11/03/1986"),
    (8, "Lorena Della Togna", "Venezia", "05/07/1968"),
    (9, "Luciana Ferretti", "Venezia", "07/02/1946"),
    (10, "Sonia Franzoi", "Venezia", "17/12/1965"),
    (11, "Tiziana Fraticelli", "Venezia", "04/10/1967"),
    (12, "Stefano Gabbanoto", "Venezia", "25/06/1965"),
    (13, "Silvana Gaggio", "Napoli", "09/05/1950"),
    (14, "Martina Galvani", "Venezia", "23/01/1965"),
    (15, "Valentina Garoli", "Este (PD)", "21/04/1995"),
    (16, "Cristina Giacomazzi", "Vicenza", "22/09/1964"),
    (17, "Marzia Lodoli", "Noale", "17/03/1967"),
    (18, "Vincenzo Marchesi", "Este (PD)", "01/11/1952"),
    (19, "Giuseppe Marzato", "Venezia", "09/06/1963"),
    (20, "Patrizia Mel", "Venezia", "05/06/1951"),
    (21, "Christian Omiccioli", "Padova", "12/05/1974"),
    (22, "Marco Paggiaro", "Venezia", "15/11/1986"),
    (23, "Giovanni Pagotto", "Venezia", "09/09/1989"),
    (24, "Anna-Maria Palazzi", "Venezia", "13/03/1955"),
    (25, "Loris Peltrera", "Venezia", "17/08/1979"),
    (26, "Simonetta Puppa", "Vo' (PD)", "10/04/1962"),
    (27, "Fulvio Savio", "Venezia", "10/07/1955"),
    (28, "Giorgio Tana", "Venezia", "24/04/1943"),
    (29, "Roberta Travaglia", "Este (PD)", "11/09/1965"),
    (30, "Fiorella Trevisan", "Venezia", "27/12/1966"),
    (31, "Giorgio Tronca", "Vicenza", "09/10/1967"),
    (32, "Ivana Varagnolo", "Venezia", "02/07/1973"),
    (33, "Francesco Vianello", "Venezia", "03/09/1977"),
    (34, "Michele Vio", "Venezia", "03/09/1965"),
    (35, "Laura Zaniol", "Venezia", "09/07/1965"),
    (36, "Gianfranco Zennaro", "Venezia", "29/12/1954"),
]

output_path = "public/lista-candidati-anagrafica.pdf"

doc = SimpleDocTemplate(output_path, pagesize=A4, topMargin=20*mm, bottomMargin=15*mm, leftMargin=15*mm, rightMargin=15*mm)
styles = getSampleStyleSheet()

title_style = ParagraphStyle('Title2', parent=styles['Title'], fontSize=18, textColor=BLU, spaceAfter=4*mm, alignment=TA_CENTER)
subtitle_style = ParagraphStyle('Subtitle2', parent=styles['Normal'], fontSize=11, textColor=colors.HexColor("#444444"), alignment=TA_CENTER, spaceAfter=8*mm)
cell_style = ParagraphStyle('Cell', parent=styles['Normal'], fontSize=9, leading=12)

elements = []
elements.append(Paragraph("Candidati alla Carica di Consigliere Comunale", title_style))
elements.append(Paragraph("Pierangelo Del Zotto Sindaco — Elezioni Comunali Venezia 2026", subtitle_style))

header = ["N.", "Nome e Cognome", "Luogo di nascita", "Data di nascita"]
data = [header]
for pos, name, luogo, data_nascita in candidati:
    data.append([str(pos), Paragraph(name, cell_style), luogo, data_nascita])

page_w = A4[0] - 30*mm
col_widths = [10*mm, 55*mm, 45*mm, None]
col_widths[3] = page_w - sum(col_widths[:3])

table = Table(data, colWidths=col_widths, repeatRows=1)
table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), VERDE),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 10),
    ('BOTTOMPADDING', (0, 0), (-1, 0), 4*mm),
    ('TOPPADDING', (0, 0), (-1, 0), 3*mm),
    ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
    ('FONTSIZE', (0, 1), (0, -1), 9),
    ('FONTSIZE', (2, 1), (-1, -1), 9),
    ('TOPPADDING', (0, 1), (-1, -1), 2*mm),
    ('BOTTOMPADDING', (0, 1), (-1, -1), 2*mm),
    ('ALIGN', (0, 0), (0, -1), 'CENTER'),
    ('ALIGN', (3, 0), (3, -1), 'CENTER'),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    *[('BACKGROUND', (0, i), (-1, i), colors.HexColor("#F5F5F0")) for i in range(2, len(data), 2)],
    ('LINEBELOW', (0, 0), (-1, 0), 1.5, VERDE),
    ('LINEBELOW', (0, 1), (-1, -2), 0.5, colors.HexColor("#DDDDDD")),
    ('LINEBELOW', (0, -1), (-1, -1), 1, VERDE),
]))

elements.append(table)
footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=colors.HexColor("#999999"), alignment=TA_CENTER, spaceBefore=6*mm)
elements.append(Paragraph("delzottosindaco.github.io — Materiale riservato alla stampa", footer_style))
doc.build(elements)
print(f"PDF created: {output_path}")
