"""
Script to remove ONLY edge-connected white background from logos and make it transparent,
while preserving internal white areas (e.g., white details within green shapes).
"""
from PIL import Image
from collections import deque
import os
import glob

def is_near_white(r, g, b, threshold=240):
    return r >= threshold and g >= threshold and b >= threshold

def remove_background_edge_floodfill(input_path, output_path, threshold=240):
    """
    Make near-white background transparent using edge-connected flood fill.
    Preserves internal white that is not connected to image edges.

    Args:
        input_path: Path to input image
        output_path: Path to save output image
        threshold: RGB value threshold for treating a pixel as "white"
    """
    img = Image.open(input_path).convert("RGBA")
    w, h = img.size
    pixels = img.load()

    visited = [[False]*w for _ in range(h)]
    to_transparent = [[False]*w for _ in range(h)]

    q = deque()
    # Seed flood fill from all edges
    for x in range(w):
        q.append((x, 0))
        q.append((x, h-1))
    for y in range(h):
        q.append((0, y))
        q.append((w-1, y))

    # BFS flood fill marking edge-connected near-white pixels
    while q:
        x, y = q.popleft()
        if x < 0 or x >= w or y < 0 or y >= h:
            continue
        if visited[y][x]:
            continue
        visited[y][x] = True
        r, g, b, a = pixels[x, y]
        if a == 0:
            # Already transparent; treat as background region
            to_transparent[y][x] = True
        elif is_near_white(r, g, b, threshold):
            to_transparent[y][x] = True
            # Explore neighbors
            q.append((x+1, y))
            q.append((x-1, y))
            q.append((x, y+1))
            q.append((x, y-1))

    # Apply transparency only to marked background pixels
    for y in range(h):
        for x in range(w):
            if to_transparent[y][x]:
                r, g, b, a = pixels[x, y]
                pixels[x, y] = (r, g, b, 0)

    img.save(output_path, "PNG")
    print(f"✓ Saved edge-clean transparent logo to: {output_path}")

if __name__ == "__main__":
    print("Removing edge-connected white background from logos...")
    processed = 0
    # Auto-detect logo files in public/ and assets/ ending with logo*.png
    for folder in ("public", "assets"):
        for path in glob.glob(os.path.join(folder, "*logo*.png")):
            try:
                remove_background_edge_floodfill(path, path)
                processed += 1
            except Exception as e:
                print(f"Error processing {path}: {e}")
    if processed == 0:
        print("No matching logo PNGs found (looking for *logo*.png in public/ and assets/).")
    else:
        print(f"\n✓ Done! Cleaned backgrounds for {processed} file(s).")
