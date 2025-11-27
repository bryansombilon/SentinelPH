
import { VolcanoStatus } from '../types';

// We scrape the main site because it contains the text summary of alert levels.
// The WOVOdat bulletin list often hides the level inside PDF files, making it unscrapeable.
const DATA_SOURCE_URL = "https://www.phivolcs.dost.gov.ph/";
// This is the URL the user wants to visit for details
const DISPLAY_URL = "https://wovodat.phivolcs.dost.gov.ph/bulletin/list-of-bulletin";

export const fetchVolcanoStatus = async (): Promise<VolcanoStatus[]> => {
  const majorVolcanoes = ['Mayon', 'Taal', 'Kanlaon', 'Bulusan', 'Pinatubo'];
  
  // Initialize with default/loading state
  const resultsMap = new Map<string, VolcanoStatus>();
  majorVolcanoes.forEach(name => {
      resultsMap.set(name, {
        name,
        level: '?',
        date: 'Updating...',
        url: DISPLAY_URL
      });
  });

  let htmlText = '';
  
  // Robust proxy list
  const proxies = [
    (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  ];

  let fetchSuccess = false;
  const targetUrlWithCacheBuster = `${DATA_SOURCE_URL}?t=${Date.now()}`;

  // Attempt fetch
  for (const proxy of proxies) {
    if (fetchSuccess) break;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const target = proxy(targetUrlWithCacheBuster);
        const response = await fetch(target, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
            const text = await response.text();
            if (text && text.length > 500) {
                htmlText = text;
                fetchSuccess = true;
            }
        }
    } catch (e) {
        // console.warn("Proxy failed", e);
        continue;
    }
  }

  if (!fetchSuccess || !htmlText) {
     console.warn("Volcano fetch failed from all proxies. Returning defaults.");
     return Array.from(resultsMap.values());
  }

  // Parsing Logic
  try {
    // We strip tags to make regex matching easier across HTML structures
    const bodyText = htmlText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

    for (const vName of majorVolcanoes) {
        // Regex strategy:
        // Find the volcano name (case insensitive)
        // Look ahead within 100-150 characters for "Alert Level" or "Level"
        // This accounts for the sidebar layout: "MAYON VOLCANO ... Alert Level 1"
        const regex = new RegExp(`${vName}[^a-zA-Z0-9]*(?:Volcano)?[^]*?Alert\\s*(?:Status|Level)\\s*(\\d)`, 'i');
        
        // We substring the text to avoid scanning the whole page for every volcano, 
        // but since the layout varies, we'll just scan the whole cleaned body text 
        // finding the index of the volcano name first.
        
        const nameIndex = bodyText.toLowerCase().indexOf(vName.toLowerCase());
        
        if (nameIndex !== -1) {
            // Create a window of text starting from the name
            const textWindow = bodyText.substring(nameIndex, nameIndex + 300);
            
            // Extract Level
            const levelMatch = textWindow.match(/(?:Alert|Status)\s*(?:Level)?\s*(\d)/i);
            
            // Extract Date (optional, looks for Day Month Year)
            // e.g. 14 Oct 2023 or 2023-10-14
            const dateMatch = textWindow.match(/(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i);
            
            if (levelMatch) {
                const level = levelMatch[1];
                let dateDisplay = "Recent";
                
                if (dateMatch) {
                   dateDisplay = dateMatch[1];
                   // Try to add time if close by
                   const timeMatch = textWindow.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i);
                   if (timeMatch) {
                       // Format: 14 Oct 8:00 AM
                       dateDisplay = dateDisplay.replace(/\d{4}/, '').trim() + ' ' + timeMatch[1];
                   }
                }

                resultsMap.set(vName, {
                    name: vName,
                    level: level,
                    date: dateDisplay,
                    url: DISPLAY_URL
                });
            }
        }
    }
  } catch (error) {
      console.error("Error parsing volcano data:", error);
  }

  return Array.from(resultsMap.values());
};
