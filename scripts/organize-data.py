import os
import shutil

# Base data folder (adjust this path if needed)
base_dir = "data"

# Folder mapping based on file name keywords
folders = {
    "parking": ["parking", "disponibilite", "relais", "stationnement", "places"],
    "mobilite_douce": [
        "velo", "cyclable", "pieton", "edp", "directionnel", "arceaux", "service_velo", "tmja"
    ],
    "zfe": ["zfe"],
    "irve": ["irve"],
    "transport_public": ["reseaux_tag", "transport"],
    "infrastructures": ["troncon", "schema", "radar"],
}

# Create subfolders if they don’t exist
for folder in folders:
    os.makedirs(os.path.join(base_dir, folder), exist_ok=True)

# Optional metadata folder
os.makedirs(os.path.join(base_dir, "metadata"), exist_ok=True)

# List all CSV files in the base folder
print("Organizing data files...\n")
for file_name in os.listdir(base_dir):
    if file_name.endswith(".csv"):
        src_path = os.path.join(base_dir, file_name)
        moved = False

        # Move file based on keyword matching
        for folder, keywords in folders.items():
            if any(keyword.lower() in file_name.lower() for keyword in keywords):
                dst_path = os.path.join(base_dir, folder, file_name)
                shutil.move(src_path, dst_path)
                print(f"Moved {file_name} → {folder}/")
                moved = True
                break

        # If no match, leave it or move to metadata for manual review
        if not moved:
            dst_path = os.path.join(base_dir, "metadata", file_name)
            shutil.move(src_path, dst_path)
            print(f"Moved {file_name} → metadata/ (manual check)")

print("\nData organization complete!")
