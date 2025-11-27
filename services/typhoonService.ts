
import { TyphoonData, TyphoonSignal } from '../types';

const PAGASA_URL = "https://www.pagasa.dost.gov.ph/tropical-cyclone/severe-weather-bulletin";

export const fetchTyphoonData = async (): Promise<TyphoonData> => {
  let htmlText = '';
  
  // Reuse proxy strategy from earthquake service
  const proxies = [
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  ];

  let fetchSuccess = false;
  const targetUrlWithCacheBuster = `${PAGASA_URL}?t=${Date.now()}`;

  for (const proxy of proxies) {
    if (fetchSuccess) break;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

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
        continue;
    }
  }

  if (!fetchSuccess || !htmlText) {
     throw new Error("Failed to fetch PAGASA bulletin");
  }

  // --- Parsing Logic ---
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');

  // 1. Check for No Active Cyclone
  // PAGASA usually puts a specific message when there's no cyclone
  const bodyText = doc.body.textContent || "";
  if (bodyText.includes("There is no active tropical cyclone") || bodyText.includes("No Active Tropical Cyclone")) {
      return {
          hasCyclone: false,
          name: "",
          issuedAt: new Date().toISOString(),
          url: PAGASA_URL,
          signals: [],
          summary: "No active tropical cyclone within the Philippine Area of Responsibility."
      };
  }

  // 2. Extract Name
  // Usually in a header like "Tropical Cyclone Bulletin #15 Super Typhoon 'EGAY'"
  let name = "Unknown Cyclone";
  const headers = Array.from(doc.querySelectorAll('h3, h2, h4, .page-header'));
  for (const h of headers) {
      const text = h.textContent?.trim() || "";
      if (text.toLowerCase().includes("tropical cyclone") || text.toLowerCase().includes("typhoon")) {
          name = text;
          break;
      }
  }

  // 3. Extract Signals
  // This is tricky as structure varies. We look for patterns like "TCWS No. 1" and grab text until next signal.
  const signals: TyphoonSignal[] = [];
  const contentNode = doc.querySelector('.article-content') || doc.body; // Adjust selector based on typical PAGASA structure
  const contentText = contentNode.textContent || "";

  // Helper to extract text between signal headers
  // We use regex to find positions of "TCWS No. X"
  for (let level = 5; level >= 1; level--) {
      // Regex to match "TCWS No. 5" or "Signal No. 5"
      const regex = new RegExp(`(?:TCWS|Signal)\\s*(?:#|No\\.?)\\s*${level}`, 'i');
      const match = contentText.match(regex);
      
      if (match) {
          // Found a signal header.
          // In a real scrape, we'd need sophisticated DOM traversal. 
          // For this robust fallback, we'll try to find the text block.
          // A simplified approach: Look for list items <li> closest to the header in DOM
          
          // Let's try DOM traversal approach which is better than raw text regex
          // Find elements containing the signal text
          const allElements = Array.from(contentNode.querySelectorAll('*'));
          const signalHeader = allElements.find(el => regex.test(el.textContent || "") && el.children.length === 0); // Leaf node or close to it
          
          if (signalHeader) {
              // Look for the next list (ul/ol) or paragraph siblings
              let areas: string[] = [];
              let sibling = signalHeader.parentElement?.nextElementSibling;
              
              // Traverse siblings to find area descriptions
              // Limit traversal to avoid grabbing footer text
              let count = 0;
              while (sibling && count < 5) {
                  const text = sibling.textContent?.trim();
                  if (text) {
                      // Stop if we hit another signal header
                      if (/(?:TCWS|Signal)\s*(?:#|No\\.?)\s*\d/i.test(text)) break;
                      
                      // If it's a list, grab items
                      if (sibling.tagName === 'UL' || sibling.tagName === 'OL') {
                          const items = Array.from(sibling.querySelectorAll('li')).map(li => li.textContent?.trim() || "").filter(Boolean);
                          areas.push(...items);
                      } else if (text.length > 10 && text.length < 500) {
                          // Likely a paragraph listing areas
                          areas.push(text);
                      }
                  }
                  sibling = sibling.nextElementSibling;
                  count++;
              }
              
              if (areas.length > 0) {
                  signals.push({ level, areas });
              }
          }
      }
  }

  // Fallback: If "hasCyclone" is true (didn't match "No active...") but we couldn't parse name/signals, 
  // we still return active state so the user checks the link.
  if (signals.length === 0 && name === "Unknown Cyclone") {
       // Double check active status based on keyword "Location of Eye" or "Center"
       if (!bodyText.includes("Location of Eye") && !bodyText.includes("Center")) {
           // Probably actually no cyclone and our first check failed
           return {
            hasCyclone: false,
            name: "",
            issuedAt: new Date().toISOString(),
            url: PAGASA_URL,
            signals: [],
            summary: "No active tropical cyclone detected."
            };
       }
  }

  return {
      hasCyclone: true,
      name: name,
      issuedAt: new Date().toISOString(), // We could parse "Issued at..." but using fetch time is safer fallback
      url: PAGASA_URL,
      signals: signals,
      summary: signals.length > 0 
        ? `Active Signals: ${signals.map(s => `Signal #${s.level}`).join(', ')}` 
        : "Active Cyclone detected. View full bulletin for details."
  };
};
