import { GoogleGenAI } from "@google/genai";
import { EarthquakeFeature } from "../types";

// Initialize Gemini Client
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is missing from environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateSituationReport = async (
  earthquakes: EarthquakeFeature[],
  currentTime: string
): Promise<string> => {
  const ai = getClient();
  if (!ai) return "AI Configuration Error: Missing API Key.";

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