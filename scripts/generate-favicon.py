#!/usr/bin/env python3
"""
AI Portal Pro — favicon.ico 생성 스크립트
브랜드 색상 #6366F1 (인디고) 기반의 "AI" 로고를 ICO 파일로 생성
"""

from PIL import Image, ImageDraw, ImageFont
import struct
import os

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'apps', 'web', 'public')

def create_favicon(size):
    """지정 크기의 favicon 이미지를 생성"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 둥근 사각형 배경 (그라데이션 효과를 위한 2단계)
    margin = int(size * 0.06)
    radius = int(size * 0.22)

    # 배경: 인디고 그라데이션 (위→아래)
    for y in range(margin, size - margin):
        ratio = (y - margin) / (size - 2 * margin)
        r = int(129 + (79 - 129) * ratio)  # #818CF8 → #4F46E5
        g = int(140 + (70 - 140) * ratio)
        b = int(248 + (229 - 248) * ratio)
        draw.line([(margin, y), (size - margin, y)], fill=(r, g, b, 255))

    # 둥근 모서리 마스크
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=radius,
        fill=255
    )
    img.putalpha(mask)

    # 내부 테두리 (미묘한 하이라이트)
    inner_margin = margin + int(size * 0.02)
    inner_radius = radius - int(size * 0.02)
    draw.rounded_rectangle(
        [inner_margin, inner_margin, size - inner_margin, size - inner_margin],
        radius=inner_radius,
        outline=(255, 255, 255, 40),
        width=max(1, size // 128)
    )

    # "AI" 텍스트
    font_size = int(size * 0.42)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except (IOError, OSError):
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf", font_size)
        except (IOError, OSError):
            font = ImageFont.load_default()

    text = "AI"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    text_x = (size - text_width) // 2
    text_y = (size - text_height) // 2 - int(size * 0.04)

    # 텍스트 그림자
    shadow_offset = max(1, size // 64)
    draw.text((text_x + shadow_offset, text_y + shadow_offset), text, fill=(0, 0, 0, 50), font=font)
    # 텍스트 본체
    draw.text((text_x, text_y), text, fill=(255, 255, 255, 255), font=font)

    # 스파클 점 (우상단)
    if size >= 32:
        sparkle_x = int(size * 0.76)
        sparkle_y = int(size * 0.22)
        sparkle_r = max(2, int(size * 0.04))
        draw.ellipse(
            [sparkle_x - sparkle_r, sparkle_y - sparkle_r,
             sparkle_x + sparkle_r, sparkle_y + sparkle_r],
            fill=(255, 255, 255, 230)
        )

    return img


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # ICO 파일 생성 (16, 32, 48, 64, 128, 256 크기 포함)
    sizes = [16, 32, 48, 64, 128, 256]
    images = [create_favicon(s) for s in sizes]

    ico_path = os.path.join(OUTPUT_DIR, 'favicon.ico')
    # 256px 이미지를 기반으로 모든 크기를 ICO에 포함
    base_img = create_favicon(256).convert('RGBA')
    base_img.save(
        ico_path,
        format='ICO',
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )
    print(f"✓ favicon.ico 생성: {ico_path} ({os.path.getsize(ico_path):,} bytes)")

    # Apple Touch Icon (180x180)
    apple_icon = create_favicon(180)
    apple_path = os.path.join(OUTPUT_DIR, 'apple-touch-icon.png')
    apple_icon.save(apple_path, format='PNG')
    print(f"✓ apple-touch-icon.png 생성: {apple_path}")

    # Android/Chrome icon (192x192)
    android_icon = create_favicon(192)
    android_path = os.path.join(OUTPUT_DIR, 'icon-192.png')
    android_icon.save(android_path, format='PNG')
    print(f"✓ icon-192.png 생성: {android_path}")

    # Large icon (512x512)
    large_icon = create_favicon(512)
    large_path = os.path.join(OUTPUT_DIR, 'icon-512.png')
    large_icon.save(large_path, format='PNG')
    print(f"✓ icon-512.png 생성: {large_path}")

    print(f"\n모든 favicon 파일이 {OUTPUT_DIR}에 생성되었습니다.")


if __name__ == '__main__':
    main()
