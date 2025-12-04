
import { TyphoonData, TyphoonSignal } from '../types';

const PAGASA_URL = "https://www.pagasa.dost.gov.ph/tropical-cyclone/severe-weather-bulletin";

export const fetchTyphoonData = async (): Promise<TyphoonData> => {
  let htmlText = '';
  
  // Reuse proxy strategy from earthquake service
  const proxies = [
    (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`
  ];

  let fetchSuccess = false;
  const targetUrlWithCacheBuster = `${PAGASA_URL}?t=${Date.now()}`;

  for (const proxy of proxies) {
    if (fetchSuccess) break;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const target = proxy(targetUrlWithCacheBuster);
        const response = await fetch(target, { 
            signal: controller.signal,
            headers: { 'Accept': 'text/html' }
        });
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
  const bodyText = doc.body.textContent || "";
  // Check for common "No Active" phrases
  if (
      bodyText.includes("There is no active tropical cyclone") || 
      bodyText.includes("No Active Tropical Cyclone") ||
      bodyText.includes("No Tropical Cyclone is currently monitoring")
  ) {
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
  // Strategies: 
  // A. Look for "Tropical Cyclone Bulletin" header and extract text in quotes or after "FOR:"
  // B. Look for elements with class 'cyclone-name' (sometimes used)
  let name = "Unknown Cyclone";
  
  // Try finding the specific header structure often used by PAGASA
  // Example: "TROPICAL CYCLONE BULLETIN NO. 15" ... "Super Typhoon 'EGAY'"
  const possibleHeaders = Array.from(doc.querySelectorAll('h3, h2, h4, .page-header, strong, b'));
  
  for (const h of possibleHeaders) {
      const text = h.textContent?.trim() || "";
      
      // Pattern: "FOR: TROPICAL STORM 'NAME'"
      if (text.includes("FOR:")) {
          const parts = text.split("FOR:");
          if (parts[1]) {
              name = parts[1].trim();
              break;
          }
      }
      
      // Pattern: "Typhoon 'NAME'" inside a header
      const match = text.match(/(?:Typhoon|Storm|Depression)\s+['"]([^'"]+)['"]/i);
      if (match) {
          name = match[0]; // Capture full "Typhoon 'NAME'"
          break;
      }
  }

  // Cleanup name
  name = name.replace(/['"]/g, ''); // Remove quotes


  // 3. Extract Signals using TreeWalker focused on "Wind Signal" section
  const signals: TyphoonSignal[] = [];
  const signalMap = new Map<number, Set<string>>();
  
  const contentRoot = doc.querySelector('.article-content') || doc.querySelector('.view-content') || doc.body;

  const walker = doc.createTreeWalker(contentRoot, NodeFilter.SHOW_TEXT);
  let currentNode = walker.nextNode();
  let currentLevel = 0;
  let inWindSignalSection = false;

  while (currentNode) {
      const text = currentNode.textContent?.trim();
      
      if (text) {
          // Detect Start of Section
          // PAGASA usually labels it "WIND SIGNAL" or "Areas with TCWS"
          if (text.match(/WIND\s*SIGNAL|Areas\s*with\s*TCWS/i)) {
              inWindSignalSection = true;
          }

          // Detect End of Section
          // Usually followed by "Heavy Rainfall", "Severe Winds", "Track"
          if (inWindSignalSection && text.match(/HEAVY\s*RAINFALL|SEVERE\s*WINDS|TRACK\s*AND\s*INTENSITY|HAZARDS/i)) {
              inWindSignalSection = false;
              currentLevel = 0;
          }

          if (inWindSignalSection) {
               // Detect Signal Header (e.g., "TCWS No. 1", "Signal No. 2")
              const signalMatch = text.match(/(?:TCWS|Signal)\s*(?:#|No\.?)\s*(\d)/i);
              
              if (signalMatch) {
                  currentLevel = parseInt(signalMatch[1], 10);
              } else if (currentLevel > 0) {
                  // We are inside a signal block
                  
                  // Filter out headers or noise
                  const isRegionHeader = /^(Luzon|Visayas|Mindanao)$/i.test(text.replace(/[:]/g, '').trim());
                  const isLabel = /^(Prov|Area|Location)/i.test(text);

                  if (!isLabel && text.length > 3) {
                       if (!signalMap.has(currentLevel)) {
                           signalMap.set(currentLevel, new Set());
                       }
                       // Clean up leading dashes/bullets
                       const cleanArea = text.replace(/^[-•*]\s*/, '').trim();
                       signalMap.get(currentLevel)?.add(cleanArea);
                  }
              }
          }
      }
      currentNode = walker.nextNode();
  }

  // Convert Map to Interface
  signalMap.forEach((areaSet, level) => {
      const areas = Array.from(areaSet);
      if (areas.length > 0) {
        signals.push({ level, areas });
      }
  });

  // Sort signals highest to lowest
  signals.sort((a, b) => b.level - a.level);

  // Fallback for Name if still generic
  if (name === "Unknown Cyclone" && signals.length > 0) {
      name = "Active Tropical Cyclone"; 
  }

  return {
      hasCyclone: true,
      name: name,
      issuedAt: new Date().toISOString(),
      url: PAGASA_URL,
      signals: signals,
      summary: signals.length > 0 
        ? `Signals Raised: ${signals.map(s => `#${s.level}`).join(', ')}` 
        : "Active Cyclone detected. See details."
  };
};
