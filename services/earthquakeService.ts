
import { EarthquakeResponse, EarthquakeFeature } from '../types';

const PHIVOLCS_URL = "https://earthquake.phivolcs.dost.gov.ph/";

export const fetchEarthquakes = async (minMagnitude: number = 1.0, startTimeISO?: string): Promise<EarthquakeResponse> => {
  let htmlText = '';
  
  // List of proxies to try in order. 
  // 1. AllOrigins (Stable)
  // 2. CorsProxy.io (Fast)
  // 3. CodeTabs (Fallback)
  const proxies = [
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  ];

  let fetchError;
  let fetchSuccess = false;

  // Add cache buster to ensure proxies don't return stale data
  const targetUrlWithCacheBuster = `${PHIVOLCS_URL}?t=${Date.now()}`;

  for (const proxy of proxies) {
    if (fetchSuccess) break;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

        const target = proxy(targetUrlWithCacheBuster);
        // console.log(`[Sentinel] Fetching via: ${target}`);
        
        const response = await fetch(target, {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (response.ok) {
            const text = await response.text();
            // Basic validation: Check if it looks like HTML and contains the table header we need
            if (text && (text.includes('Date/Time') || text.includes('Latitude'))) {
                htmlText = text;
                fetchSuccess = true;
            } else {
                throw new Error("Response invalid or missing data table");
            }
        } else {
             throw new Error(`HTTP Status ${response.status}`);
        }
    } catch (e) {
        fetchError = e;
        // console.warn(`[Sentinel] Proxy failed, trying next...`, e);
        continue;
    }
  }

  if (!fetchSuccess || !htmlText) {
    console.error("Failed to fetch data from all proxies", fetchError);
     return {
        type: "FeatureCollection",
        metadata: {
            generated: Date.now(),
            url: PHIVOLCS_URL,
            title: "Connection Error",
            status: 500,
            api: "scrape_failed",
            count: 0
        },
        features: []
    };
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    // Find all rows in the document
    const allRows = Array.from(doc.querySelectorAll('tr'));
    
    // Dynamically find the header row to know where data starts
    let headerIndex = -1;
    for (let i = 0; i < allRows.length; i++) {
        const text = allRows[i].textContent?.toLowerCase() || "";
        // PHIVOLCS header usually contains these keywords
        if (text.includes('date/time') && text.includes('latitude') && text.includes('magnitude')) {
            headerIndex = i;
            break;
        }
    }

    // If header found, slice after it. If not, try to use all rows and rely on parsing validation.
    const rows = headerIndex !== -1 ? allRows.slice(headerIndex + 1) : allRows;
    
    const features: EarthquakeFeature[] = [];
    
    // Calculate "Start of Today" in PH Time for filtering
    const now = new Date();
    const phNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const startOfDay = new Date(phNow.getFullYear(), phNow.getMonth(), phNow.getDate());

    for (const row of rows) {
        const cells = row.querySelectorAll('td');
        // We need at least 5 columns for valid data
        if (cells.length < 5) continue;

        // Extract text content
        // Typical Layout: 0:Date/Time, 1:Lat, 2:Lon, 3:Depth, 4:Mag, 5:Location
        const dateStrRaw = cells[0].textContent?.trim() || "";
        const latStr = cells[1].textContent?.trim() || "0";
        const lonStr = cells[2].textContent?.trim() || "0";
        const depthStr = cells[3].textContent?.trim() || "0";
        const magStr = cells[4].textContent?.trim() || "0";
        const location = cells[5].textContent?.trim() || "Unknown Location";

        // Parse Magnitude
        const mag = parseFloat(magStr);
        if (isNaN(mag) || mag < minMagnitude) continue;

        // Parse Date
        // Format example: "09 Oct 2023 - 02:30 PM"
        // Cleanup: remove dash, extra spaces
        const cleanDateStr = dateStrRaw.replace(/-/g, '').replace(/\s+/g, ' ').trim();
        const time = Date.parse(cleanDateStr);
        
        if (isNaN(time)) continue;

        // Filter for "Today" if requested
        if (startTimeISO === "true") {
            if (time < startOfDay.getTime()) continue;
        }

        const lat = parseFloat(latStr);
        const lon = parseFloat(lonStr);
        const depth = parseFloat(depthStr);

        // Extract Link if available
        const linkTag = cells[0].querySelector('a');
        let detailUrl = PHIVOLCS_URL;
        if (linkTag) {
            const href = linkTag.getAttribute('href');
            if (href) {
                // Handle relative URLs
                detailUrl = href.startsWith('http') ? href : PHIVOLCS_URL + href;
            }
        }

        features.push({
            type: "Feature",
            properties: {
                mag: mag,
                place: location,
                time: time,
                updated: time,
                url: detailUrl,
                detail: detailUrl,
                status: "reviewed",
                tsunami: 0,
                sig: 0,
                net: "ph",
                code: `ph${time}`,
                ids: `ph${time}`,
                sources: "phivolcs",
                types: "earthquake",
                nst: null,
                dmin: null,
                rms: 0,
                gap: null,
                magType: "m",
                type: "earthquake",
                title: `M ${mag} - ${location}`
            },
            geometry: {
                type: "Point",
                coordinates: [lon, lat, depth]
            },
            id: `ph${time}`
        });
    }

    return {
        type: "FeatureCollection",
        metadata: {
            generated: Date.now(),
            url: PHIVOLCS_URL,
            title: "PHIVOLCS Data",
            status: 200,
            api: "scrape",
            count: features.length
        },
        features: features
    };

  } catch (error) {
    console.error("Error parsing PHIVOLCS data:", error);
    return {
        type: "FeatureCollection",
        metadata: {
            generated: Date.now(),
            url: PHIVOLCS_URL,
            title: "Error parsing data",
            status: 500,
            api: "error",
            count: 0
        },
        features: []
    };
  }
};
