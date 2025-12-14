"""
Script to recolor the logo to emerald green/white tones
"""
from PIL import Image

def recolor_to_green(input_path, output_path):
    """
    Recolor image to emerald green tones
    """
    # Open image
    img = Image.open(input_path)
    img = img.convert("RGBA")
    
    # Get pixel data
    pixels = img.load()
    width, height = img.size
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            # Skip fully transparent pixels
            if a == 0:
                continue
            
            # Calculate brightness/luminance
            brightness = (r + g + b) / 3
            
            # Map to emerald green gradient (darker green to white-green)
            if brightness < 50:
                # Very dark -> Dark emerald green
                new_r = int(brightness * 0.2)
                new_g = int(brightness * 1.8)
                new_b = int(brightness * 0.6)
            elif brightness < 128:
                # Medium -> Emerald green
                factor = brightness / 128
                new_r = int(16 + factor * 50)   # 16-66
                new_g = int(185 + factor * 40)  # 185-225
                new_b = int(129 + factor * 50)  # 129-179
            else:
                # Light -> White-ish green
                factor = (brightness - 128) / 127
                new_r = int(200 + factor * 55)   # 200-255
                new_g = int(240 + factor * 15)   # 240-255
                new_b = int(220 + factor * 35)   # 220-255
            
            # Ensure values are in valid range
            new_r = max(0, min(255, new_r))
            new_g = max(0, min(255, new_g))
            new_b = max(0, min(255, new_b))
            
            pixels[x, y] = (new_r, new_g, new_b, a)
    
    # Save
    img.save(output_path, "PNG")
    print(f"✓ Saved green logo to: {output_path}")

if __name__ == "__main__":
    print("Recoloring logos to emerald green...")
    
    # Process public/logo.png
    try:
        recolor_to_green("public/logo.png", "public/logo.png")
    except Exception as e:
        print(f"Error processing public/logo.png: {e}")
    
    # Process assets/vocab_trainer_logo.png
    try:
        recolor_to_green("assets/vocab_trainer_logo.png", "assets/vocab_trainer_logo.png")
    except Exception as e:
        print(f"Error processing assets/vocab_trainer_logo.png: {e}")
    
    print("\n✓ Done! Logos recolored to emerald green.")
