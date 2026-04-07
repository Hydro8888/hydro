#!/usr/bin/env python3
"""
LiveNews.co.kr Favicon Generator
Design: Dark rounded rectangle with "LN" (L=red, N=blue) + red live dot
Colors: bg=#0d1117, red=#f85149, blue=#58a6ff
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Colors
BG = '#0d1117'
RED = '#f85149'
BLUE = '#58a6ff'
WHITE = '#e6edf3'

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public')
os.makedirs(OUTPUT_DIR, exist_ok=True)


def create_favicon(size: int) -> Image.Image:
    """Create a single favicon image at the given size."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Rounded rectangle background
    margin = max(1, size // 32)
    radius = max(2, size // 5)
    draw.rounded_rectangle(
        [margin, margin, size - margin - 1, size - margin - 1],
        radius=radius,
        fill=BG,
    )

    # "LN" text - try to use a bold font
    font_size = int(size * 0.48)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except (OSError, IOError):
        try:
            font = ImageFont.truetype("/usr/share/fonts/TTF/DejaVuSans-Bold.ttf", font_size)
        except (OSError, IOError):
            font = ImageFont.load_default()

    # Measure "L" and "N" separately for coloring
    l_bbox = draw.textbbox((0, 0), "L", font=font)
    n_bbox = draw.textbbox((0, 0), "N", font=font)
    full_bbox = draw.textbbox((0, 0), "LN", font=font)

    l_width = l_bbox[2] - l_bbox[0]
    full_width = full_bbox[2] - full_bbox[0]
    full_height = full_bbox[3] - full_bbox[1]

    # Center the text
    x_start = (size - full_width) // 2
    y_start = (size - full_height) // 2 - full_bbox[1]  # Adjust for font ascent

    # Draw "L" in red
    draw.text((x_start, y_start), "L", fill=RED, font=font)

    # Draw "N" in blue
    # Calculate kerning-aware position
    ln_bbox = draw.textbbox((x_start, y_start), "L", font=font)
    n_x = ln_bbox[2] + max(0, size // 64)
    draw.text((n_x, y_start), "N", fill=BLUE, font=font)

    # Red "live" dot (top-right corner)
    dot_radius = max(1, size // 10)
    dot_x = size - margin - dot_radius - max(1, size // 12)
    dot_y = margin + dot_radius + max(1, size // 12)
    draw.ellipse(
        [dot_x - dot_radius, dot_y - dot_radius, dot_x + dot_radius, dot_y + dot_radius],
        fill=RED,
    )

    # Small white highlight on dot for depth
    if size >= 64:
        hl_r = max(1, dot_radius // 3)
        hl_x = dot_x - dot_radius // 3
        hl_y = dot_y - dot_radius // 3
        draw.ellipse(
            [hl_x - hl_r, hl_y - hl_r, hl_x + hl_r, hl_y + hl_r],
            fill='#ff8080',
        )

    return img


def main():
    # Generate multi-size ICO
    sizes_ico = [16, 32, 48]
    ico_images = [create_favicon(s) for s in sizes_ico]
    ico_path = os.path.join(OUTPUT_DIR, 'favicon.ico')
    ico_images[0].save(
        ico_path,
        format='ICO',
        sizes=[(s, s) for s in sizes_ico],
        append_images=ico_images[1:],
    )
    print(f"Created {ico_path}")

    # Generate PNG icons
    for name, size in [
        ('apple-touch-icon.png', 180),
        ('icon-192.png', 192),
        ('icon-512.png', 512),
    ]:
        img = create_favicon(size)
        path = os.path.join(OUTPUT_DIR, name)
        img.save(path, format='PNG')
        print(f"Created {path}")

    print("\nAll favicon files generated successfully!")


if __name__ == '__main__':
    main()
