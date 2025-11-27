
import { VolcanoStatus } from '../types';

const WOVODAT_URL = "https://wovodat.phivolcs.dost.gov.ph/bulletin/list-of-bulletin";

export const fetchVolcanoStatus = async (): Promise<VolcanoStatus[]> => {
  // 1. Initialize Default Data (Fail-safe)
  const majorVolcanoes = ['Mayon', 'Taal', 'Kanlaon', 'Bulusan', 'Pinatubo'];
  // We use a map to ensure we only capture the LATEST entry for each volcano (assuming list is desc)
  const resultsMap = new Map<string, VolcanoStatus>();

  majorVolcanoes.forEach(name => {
      resultsMap.set(name, {
        name,
        level: '?',
        date: 'Checking...',
        url: WOVODAT_URL
      });
  });

  let htmlText = '';
  
  // Use robust proxy list
  const proxies = [
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  ];

  let fetchSuccess = false;
  // Cache buster
  const targetUrlWithCacheBuster = `${WOVODAT_URL}?t=${Date.now()}`;

  // 2. Fetch HTML
  for (const proxy of proxies) {
    if (fetchSuccess) break;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

        const target = proxy(targetUrlWithCacheBuster);
        const response = await fetch(target, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
            const text = await response.text();
            // Basic validation
            if (text && (text.includes('table') || text.includes('Volcano'))) {
                htmlText = text;
                fetchSuccess = true;
            }
        }
    } catch (e) {
        continue;
    }
  }

  if (!fetchSuccess || !htmlText) {
     console.warn("Volcano fetch failed, returning default states.");
     return Array.from(resultsMap.values());
  }

  // 3. Parsing Logic
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const rows = Array.from(doc.querySelectorAll('tr'));

    // Iterate through table rows. 
    // We expect the table to be sorted by date descending (newest first).
    // So if we find a volcano name, we update it ONLY if we haven't touched it yet (or check date).
    const foundSet = new Set<string>();

    for (const row of rows) {
        const text = row.textContent || "";
        const cleanText = text.replace(/\s+/g, ' ').trim();

        // Check which volcano this row belongs to
        let matchedVolcano = null;
        for (const vName of majorVolcanoes) {
            if (cleanText.toLowerCase().includes(vName.toLowerCase())) {
                matchedVolcano = vName;
                break;
            }
        }

        // If it's one of our target volcanoes and we haven't found its latest bulletin yet
        if (matchedVolcano && !foundSet.has(matchedVolcano)) {
            
            // Extract Level
            const levelMatch = cleanText.match(/(?:Alert|Status)\s*Level\s*(\d)/i);
            const level = levelMatch ? levelMatch[1] : null;

            // Extract Date (Format varies: "14 October 2023" or "2023-10-14")
            // Looking for standard date patterns
            const dateMatch = cleanText.match(/(\d{1,2}\s+[A-Za-z]+\s+\d{4}|\d{4}-\d{2}-\d{2})/);
            
            // Time match (HH:MM AM/PM)
            const timeMatch = cleanText.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i);

            if (level) {
                let dateDisplay = "Recent";
                if (dateMatch) {
                    dateDisplay = dateMatch[0]; // e.g., 14 October 2023
                    if (timeMatch) {
                         // Keep it short: "14 Oct 8:00 AM"
                         const shortDate = dateDisplay.replace(/(\d{4})/, '').trim(); // Remove year to save space if needed
                         dateDisplay = `${shortDate} ${timeMatch[1]}`;
                    }
                }

                resultsMap.set(matchedVolcano, {
                    name: matchedVolcano,
                    level: level,
                    date: dateDisplay,
                    url: WOVODAT_URL
                });
                
                foundSet.add(matchedVolcano);
            } else if (cleanText.toLowerCase().includes("low level unrest")) {
                 // Fallback if "Alert Level" phrase is missing but status text exists
                 resultsMap.set(matchedVolcano, {
                    name: matchedVolcano,
                    level: "1",
                    date: "Recent",
                    url: WOVODAT_URL
                });
                foundSet.add(matchedVolcano);
            }
        }
    }
    
    // Check if we found anything. If purely 0, maybe the table structure is wildly different.
    // In that case, we keep the defaults (Checking...) or set to Unknown.

  } catch (parseError) {
      console.error("Error parsing volcano table:", parseError);
  }

  return Array.from(resultsMap.values());
};
