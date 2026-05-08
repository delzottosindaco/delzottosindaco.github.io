from PIL import Image, ImageDraw, ImageFont
import os, textwrap

# A5 print: 148x210mm @ 300dpi = 1748x2480px
W, H = 1748, 2480

img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

BLU = (33, 28, 108)
VERDE = (128, 177, 34)
BIANCO = (255, 255, 255)
GRIGIO_SCURO = (60, 60, 70)
SFONDO_CARD = (245, 248, 240, 255)
BORDO_CARD = (220, 230, 210, 255)

def get_font(size, bold=False):
    names = ['arialbd.ttf', 'segoeuib.ttf'] if bold else ['arial.ttf', 'segoeui.ttf']
    for name in names:
        path = os.path.join(r'C:\Windows\Fonts', name)
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()

font_num = get_font(52, bold=True)
font_heading = get_font(50, bold=True)
font_desc = get_font(38)

items = [
    ("1", "Bilancio e gestione pubblica", "Rendiamo ogni euro trasparente e lo trasformiamo in servizi."),
    ("2", "Sicurezza urbana", "Riorganizziamo la Polizia Locale e rendiamo più sicuri quartieri e spazi pubblici."),
    ("3", "Lavoro ed economia locale", "Creiamo lavoro stabile per artigiani, imprese, porto e giovani."),
    ("4", "Casa, residenza e turismo che rispetta la città", "Restituiamo le case ai residenti e regoliamo il turismo."),
    ("5", "Terraferma, Mestre e Marghera – Arsenale, grandi opere e sport", "Riuniamo laguna e terraferma e rafforziamo gli impianti sportivi esistenti."),
]

margin_x = 50
card_pad_x = 40
card_pad_y = 35
card_w = W - margin_x * 2
gap = 28
circle_r = 36

y = 30

for i, (num, title, desc) in enumerate(items):
    title_lines = textwrap.wrap(title, width=34)
    desc_text = '«' + desc + '»'
    desc_lines = textwrap.wrap(desc_text, width=48)
    
    title_h = len(title_lines) * 58
    desc_h = len(desc_lines) * 48
    card_h = card_pad_y + title_h + 14 + desc_h + card_pad_y

    x0, y0 = margin_x, y
    x1, y1 = margin_x + card_w, y + card_h
    draw.rounded_rectangle([x0, y0, x1, y1], radius=24, fill=SFONDO_CARD, outline=BORDO_CARD, width=2)

    cx = x0 + card_pad_x + circle_r + 5
    cy = y0 + card_pad_y + 24
    circle_color = VERDE if (i % 2 == 0) else BLU
    draw.ellipse([cx - circle_r, cy - circle_r, cx + circle_r, cy + circle_r], fill=circle_color)
    draw.text((cx, cy), num, fill=BIANCO, font=font_num, anchor="mm")

    text_x = cx + circle_r + 28
    ty = y0 + card_pad_y
    for line in title_lines:
        draw.text((text_x, ty), line, fill=BLU, font=font_heading)
        ty += 58

    ty += 10
    for line in desc_lines:
        draw.text((text_x, ty), line, fill=GRIGIO_SCURO, font=font_desc)
        ty += 48

    y += card_h + gap

final_h = y + 10
img = img.crop((0, 0, W, final_h))

output = r'C:\Users\Daniela\Downloads\pierangelo-del-zotto---campagna-elettorale-venezia (3)\public\5-punti-programma.png'
img.save(output, 'PNG')
print(f"Saved: {output} — {img.size[0]}x{img.size[1]}")
