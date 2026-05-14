from PIL import Image, ImageDraw, ImageFont

text = """
> node priority_inbox.js

=== PRIORITY INBOX (Top 10) ===

1. [Placement] Amgen Inc. hiring | 2026-05-14 07:45:56
2. [Placement] Alphabet Inc. Class C hiring | 2026-05-14 06:40:33
3. [Placement] Meta Platforms Inc. hiring | 2026-05-14 06:11:24
4. [Placement] Alphabet Inc. Class C hiring | 2026-05-13 14:41:41
5. [Result] mid-sem | 2026-05-14 12:11:58
6. [Result] end-sem | 2026-05-14 01:15:22
7. [Result] end-sem | 2026-05-13 23:12:49
8. [Result] end-sem | 2026-05-13 23:11:07
9. [Result] mid-sem | 2026-05-13 17:13:06
10. [Result] internal | 2026-05-13 17:12:15

=================================
"""

# Create image
img = Image.new('RGB', (800, 380), color = (30, 30, 30))
d = ImageDraw.Draw(img)

try:
    font = ImageFont.truetype("consola.ttf", 20)
except:
    font = ImageFont.load_default()

d.text((20, 20), text, fill=(200, 200, 200), font=font)
img.save('screenshot.png')
