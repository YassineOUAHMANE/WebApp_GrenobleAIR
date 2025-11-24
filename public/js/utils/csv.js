
export const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current.trim());
    return result;
};

export const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    const headers = parseCSVLine(lines[0]);
    return lines.slice(1).map(line => {
        const values = parseCSVLine(line);
        const obj = {};
        headers.forEach((h, i) => {
            obj[h] = values[i]?.trim() || '';
        });
        return obj;
    });
};

export const loadCSV = async (path) => {
    const gzipPath = `${path}.gzip`;

    // Helper to decompress gzip
    const decompressGzip = async (blob) => {
        const ds = new DecompressionStream("gzip");
        const stream = blob.stream().pipeThrough(ds);
        return await new Response(stream).text();
    };

    try {
        // --- Try loading the gzip version first ---
        const gzipRes = await fetch(gzipPath);
        if (gzipRes.ok) {
            const blob = await gzipRes.blob();
            const text = await decompressGzip(blob);
            console.log(`Fetched ${path} as gzip`)
            return parseCSV(text);
        }

        // Otherwise fallback to uncompressed CSV
        const csvRes = await fetch(path);
        if (csvRes.ok) {
            const text = await csvRes.text();
            return parseCSV(text);
        }

        console.warn(`Failed to load ${gzipPath} and ${path}`);
        return [];

    } catch (err) {
        console.warn(`Failed to load CSV from ${path}:`, err);
        return [];
    }
};
