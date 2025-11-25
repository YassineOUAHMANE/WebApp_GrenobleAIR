#!/usr/bin/env bash

# Compress CSV files recursively and report space savings (macOS + Linux compatible)

set -e

BASE_DIR="public/data"

# Detect OS and choose the correct stat command
if stat --version >/dev/null 2>&1; then
    # GNU stat (Linux)
    get_size() { stat -c%s "$1"; }
else
    # BSD stat (macOS)
    get_size() { stat -f%z "$1"; }
fi

total_original=0
total_compressed=0
file_count=0

echo "=== Compressing CSV files in $BASE_DIR ==="
echo

# Use process substitution instead of piping into while
while read -r file; do
    gzip_file="${file}.gzip"

    orig_size=$(get_size "$file")
    gzip -c "$file" > "$gzip_file"
    comp_size=$(get_size "$gzip_file")

    total_original=$((total_original + orig_size))
    total_compressed=$((total_compressed + comp_size))
    file_count=$((file_count + 1))

    saved=$((orig_size - comp_size))
    percent=$(awk "BEGIN { printf \"%.2f\", ($saved / $orig_size) * 100 }")

    printf "• %s\n" "$file"
    printf "   Original:   %'d bytes\n" "$orig_size"
    printf "   Compressed: %'d bytes\n" "$comp_size"
    printf "   Saved:      %'d bytes (%s%%)\n" "$saved" "$percent"
    echo

done < <(find "$BASE_DIR" -type f -name "*.csv")

echo "=== Summary ==="

if [ "$file_count" -gt 0 ]; then
    total_saved=$((total_original - total_compressed))
    avg_percent=$(awk "BEGIN { printf \"%.2f\", ($total_saved / $total_original) * 100 }")

    printf "Files processed:        %d\n" "$file_count"
    printf "Total original size:    %'d bytes\n" "$total_original"
    printf "Total compressed size:  %'d bytes\n" "$total_compressed"
    printf "Total saved:            %'d bytes\n" "$total_saved"
    printf "Average space saved:    %s%%\n" "$avg_percent"
else
    echo "No CSV files found."
fi

echo "Done."
