const cache = new Map();

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
    const lines = text.trim().split('\n').filter(i => !i.startsWith('#')); // Ignore comments
    const headers = parseCSVLine(lines[0]);
  
    return lines.slice(1).map(line => {
      const values = parseCSVLine(line);
      const obj = {};
  
      headers.forEach((header, i) => {
        const value = values[i]?.trim() ?? '';
  
        const path = header.split('/');   // Detect nested properties
        let current = obj;
  
        path.forEach((key, idx) => {
          if (idx === path.length - 1) {
            // auto-cast number if possible
            current[key] = isNaN(value) ? value : Number(value);
          } else {
            if (!current[key]) current[key] = {};
            current = current[key];
          }
        });
      });
  
      return obj;
    });
  };

export async function fetchCSV(path){
    if (cache.has(path)) return cache.get(path);
    try {
        const rawCsv = await fetchGZIP(path);
        if (!rawCsv) {
            console.warn(`Failed to load CSV from ${path}`);
            return [];
        }
        const parsed = parseCSV(rawCsv)
        cache.set(path, parsed)
        return parsed;
    } catch (err) {
        console.warn(`Failed to load CSV from ${path}:`, err);
        return [];
    }
};

export async function fetchJSON(path) {
    if (cache.has(path)) return cache.get(path);
    try {
        const j = await fetchGZIP(path);
        const json = JSON.parse(j);
        cache.set(path, json);
        return json;
    } catch (err) {
        console.warn(`Failed to load JSON from ${path}:`, err);
        return {}
    }
}


export const fetchGZIP = async (path) => {
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
            // console.log(`Fetched ${path} as gzip`)
            return await decompressGzip(blob);
        }

        // Otherwise fallback to uncompressed
        const rawRes = await fetch(path);
        if (rawRes.ok) {
            return await rawRes.text();
        }

        // console.warn(`Failed to load ${gzipPath} and ${path}`);
        return null;

    } catch (err) {
        console.warn(`Failed to load from ${path}:`, err);
        return null;
    }
};