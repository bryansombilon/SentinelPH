
import { GoogleGenAI } from "@google/genai";
import { EarthquakeFeature } from "../types";

// Initialize Gemini Client
const getClient = () => {
  // Safe access to environment variables that works in both Node (process) and Vite (import.meta)
  // This prevents the "process is not defined" crash in browser environments like Vercel
  let apiKey: string | undefined;
  
  try {
    // @ts-ignore
    if (import.meta.env?.VITE_API_KEY) {
        // @ts-ignore
        apiKey = import.meta.env.VITE_API_KEY;
    }
  } catch (e) {
      // Ignore
  }

  if (!apiKey) {
      try {
        if (typeof process !== 'undefined' && process.env) {
            apiKey = process.env.API_KEY;
        }
      } catch (e) {
          // Ignore
      }
  }

  if (!apiKey) {
    console.warn("API_KEY is missing. Please set VITE_API_KEY in your environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateSituationReport = async (
  earthquakes: EarthquakeFeature[],
  currentTime: string
): Promise<string> => {
  const ai = getClient();
  if (!ai) return "AI System Standby (Missing Key)";

  // Summarize the latest earthquake data for the prompt
  const recentQuakes = earthquakes.slice(0, 5).map(q => 
    `- Mag ${q.properties.mag} at ${q.properties.place} (${new Date(q.properties.time).toLocaleTimeString()})`
  ).join('\n');

  const prompt = `
    Current Time (PST): ${currentTime}
    
    Recent Significant Seismic Activity in the Philippines (Top 5):
    ${recentQuakes || "No significant recent earthquakes reported."}
    
    Task: Provide a very brief, professional "Situation Report" styled like a military or scientific monitoring dashboard. 
    1. Acknowledge the time.
    2. Summarize the seismic status (Calm, Active, or Alert).
    3. Give a 1-sentence interesting fact or safety tip related to current weather or geology in the region.
    
    Keep it under 60 words. No markdown formatting like bolding. Plain text only.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Status Normal. Monitoring active.";
  } catch (error: any) {
    // Handle Quota Exceeded / Rate Limit errors gracefully
    const isRateLimit = 
        error?.status === 429 || 
        error?.code === 429 || 
        (error?.message && (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED')));

    if (isRateLimit) {
        console.warn("Gemini API Rate Limit hit (429). Using fallback report.");
        return "Status Normal. Monitoring active. (AI Standby)";
    }

    console.error("Gemini API Error:", error);
    return "System Offline: Unable to generate AI report.";
  }
};

export interface TrafficHotspot {
    name: string;
    status: 'Light' | 'Moderate' | 'Heavy' | 'Congested';
    trend: 'Improving' | 'Worsening' | 'Stable';
    details: string;
}

export const getBaguioTrafficAnalysis = async (): Promise<TrafficHotspot[]> => {
    const ai = getClient();
    const fallbackData: TrafficHotspot[] = [
        { name: "Session Road", status: "Moderate", trend: "Stable", details: "Steady flow" },
        { name: "Magsaysay Ave", status: "Heavy", trend: "Worsening", details: "Market traffic" },
        { name: "City Hall Loop", status: "Moderate", trend: "Stable", details: "Intersection busy" },
        { name: "Naguilian Rd", status: "Light", trend: "Stable", details: "Moving well" },
        { name: "BGH Rotunda", status: "Congested", trend: "Worsening", details: "Merge heavy" },
        { name: "Marcos Hwy", status: "Light", trend: "Stable", details: "Free flowing" },
        { name: "Pacdal Circle", status: "Moderate", trend: "Stable", details: "Tourist traffic" },
        { name: "Camp John Hay", status: "Light", trend: "Stable", details: "Flowing freely" },
        { name: "Kisad Road", status: "Heavy", trend: "Worsening", details: "Volume buildup" }
    ];

    if (!ai) return fallbackData;

    const now = new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' });

    const prompt = `
        Current Time in Baguio City: ${now}

        Task: Estimate the current traffic conditions for these specific Baguio locations based on the time of day, day of week, and typical historical patterns:
        1. Session Road
        2. Magsaysay Avenue (Public Market area)
        3. City Hall Loop / Abanao
        4. Naguilian Road
        5. BGH Rotunda (Baguio General Hospital)
        6. Marcos Highway
        7. Pacdal Circle
        8. Camp John Hay
        9. Kisad Road

        Return ONLY a raw JSON array of objects. Do not use markdown blocks.
        Format:
        [
          {
            "name": "Location Name (Short)",
            "status": "Light" | "Moderate" | "Heavy" | "Congested",
            "trend": "Stable" | "Worsening" | "Improving",
            "details": "Very short 3-4 word reason"
          }
        ]
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });
        
        const text = response.text;
        if (!text) return fallbackData;

        // Clean any potential markdown remnants just in case
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanText) as TrafficHotspot[];

    } catch (error) {
        console.error("Traffic Analysis Error:", error);
        return fallbackData;
    }
}
