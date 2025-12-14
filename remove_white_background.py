"""
Script to remove white background from logo and make it transparent
"""
from PIL import Image
import sys

def remove_white_background(input_path, output_path, threshold=240):
    """
    Remove white background from an image and make it transparent
    
    Args:
        input_path: Path to input image
        output_path: Path to save output image
        threshold: RGB value threshold for "white" (default 240)
    """
    # Open image
    img = Image.open(input_path)
    
    # Convert to RGBA if not already
    img = img.convert("RGBA")
    
    # Get pixel data
    datas = img.getdata()
    
    # Create new pixel data with transparency
    new_data = []
    for item in datas:
        # If pixel is close to white (all RGB values above threshold)
        if item[0] > threshold and item[1] > threshold and item[2] > threshold:
            # Make it transparent
            new_data.append((255, 255, 255, 0))
        else:
            # Keep original pixel
            new_data.append(item)
    
    # Update image data
    img.putdata(new_data)
    
    # Save as PNG with transparency
    img.save(output_path, "PNG")
    print(f"✓ Saved transparent logo to: {output_path}")

if __name__ == "__main__":
    # Process both logos
    print("Removing white background from logos...")
    
    # Process public/logo.png
    try:
        remove_white_background(
            "public/logo.png",
            "public/logo.png"
        )
    except Exception as e:
        print(f"Error processing public/logo.png: {e}")
    
    # Process assets/vocab_trainer_logo.png
    try:
        remove_white_background(
            "assets/vocab_trainer_logo.png",
            "assets/vocab_trainer_logo.png"
        )
    except Exception as e:
        print(f"Error processing assets/vocab_trainer_logo.png: {e}")
    
    print("\n✓ Done! White backgrounds removed from logos.")
