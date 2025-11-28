
import { VolcanoStatus } from '../types';

// Specific activity pages for the main monitored volcanoes.
// Using these direct endpoints ensures we get the latest text content for each.
const VOLCANO_SOURCES = [
  { name: 'Taal', url: 'https://wovodat.phivolcs.dost.gov.ph/bulletin/activity-tvo' },
  { name: 'Mayon', url: 'https://wovodat.phivolcs.dost.gov.ph/bulletin/activity-mvo' },
  { name: 'Kanlaon', url: 'https://wovodat.phivolcs.dost.gov.ph/bulletin/activity-kvo' },
  { name: 'Bulusan', url: 'https://wovodat.phivolcs.dost.gov.ph/bulletin/activity-bvo' },
];

const PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

export const fetchVolcanoStatus = async (): Promise<VolcanoStatus[]> => {
  const promises = VOLCANO_SOURCES.map(async (source) => {
    let htmlText = '';
    let fetchSuccess = false;
    // Add cache buster to ensure we don't get stale proxy data
    const targetUrl = `${source.url}?t=${Date.now()}`;

    for (const proxy of PROXIES) {
        if (fetchSuccess) break;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout
            
            const response = await fetch(proxy(targetUrl), { signal: controller.signal });
            clearTimeout(timeoutId);

            if (response.ok) {
                const text = await response.text();
                // Basic validation: Check for HTML tags
                if (text && (text.includes('<html') || text.includes('<!DOCTYPE'))) {
                    htmlText = text;
                    fetchSuccess = true;
                }
            }
        } catch (e) {
            continue;
        }
    }

    if (!fetchSuccess) {
        return { name: source.name, level: '?', date: 'Offline', url: source.url };
    }

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        
        let level = '?';
        let date = 'Unknown Date';
        
        // Strategy 1: TreeWalker to find specific text nodes
        // This is robust against nested tags like "Alert Level: <b>1</b>"
        const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);
        let currentNode = walker.nextNode();
        
        while (currentNode) {
            const text = currentNode.textContent?.trim() || "";
            
            // Check for Alert Level
            if (level === '?') {
                // Regex matches "Alert Level" followed optionally by colon/space, then a digit 0-5
                const levelMatch = text.match(/Alert\s+Level\s*:?\s*([0-5])/i);
                if (levelMatch) {
                    level = levelMatch[1];
                } else if (/Alert\s+Level/i.test(text)) {
                    // If "Alert Level" is found but no number, check the NEXT text node
                    // This handles cases like <span>Alert Level</span> <span>1</span>
                    const nextNode = walker.nextNode();
                    if (nextNode) {
                        const nextText = nextNode.textContent?.trim() || "";
                        const nextMatch = nextText.match(/^:?\s*([0-5])/);
                        if (nextMatch) {
                            level = nextMatch[1];
                            // Move back to current to continue searching for date if needed
                            currentNode = nextNode; 
                        }
                    }
                }
            }

            // Check for Date (e.g., "14 June 2024")
            if (date === 'Unknown Date') {
                 // Match: 1-2 digits, Space, Month Name, Space, 4 digits
                 const dateMatch = text.match(/(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i);
                 if (dateMatch) {
                     date = dateMatch[0];
                 }
            }

            if (level !== '?' && date !== 'Unknown Date') break;
            currentNode = walker.nextNode();
        }

        // Strategy 2: Fallback to full body text search if TreeWalker missed it
        // (Useful if the text is fragmented in a way TreeWalker skipped)
        if (level === '?') {
            const bodyText = (doc.body.textContent || "").replace(/\s+/g, ' ');
            const match = bodyText.match(/Alert\s+Level\s*:?\s*([0-5])/i);
            if (match) level = match[1];
        }

        // Strategy 3: Date Fallback
        if (date === 'Unknown Date') {
             const bodyText = (doc.body.textContent || "").replace(/\s+/g, ' ');
             const dateMatch = bodyText.match(/(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i);
             if (dateMatch) date = dateMatch[0];
        }

        return {
            name: source.name,
            level: level,
            date: date,
            url: source.url
        };
    } catch (e) {
        console.error(`Error parsing ${source.name}:`, e);
        return { name: source.name, level: '?', date: 'Parse Error', url: source.url };
    }
  });

  // Fetch all sources in parallel
  const results = await Promise.all(promises);
  return results;
};
