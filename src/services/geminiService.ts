import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface DetectedEntity {
  text: string;
  type: "NAME" | "EMAIL" | "PHONE" | "ADDRESS" | "IP_ADDRESS" | "CREDIT_CARD" | "OTHER";
  reason?: string;
  source: "REGEX" | "AI";
}

// Robust Regex Patterns
const PATTERNS = {
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  PHONE: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  IP_ADDRESS: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
  CREDIT_CARD: /\b(?:\d[ -]*?){13,16}\b/g,
  // Basic pattern for potential addresses (very simplified)
  ADDRESS: /\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way)\b/g,
};

export function detectSensitiveInfoRegex(text: string): DetectedEntity[] {
  const entities: DetectedEntity[] = [];
  
  // Check each pattern
  (Object.keys(PATTERNS) as Array<keyof typeof PATTERNS>).forEach(type => {
    const regex = PATTERNS[type];
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (!match[0]) {
        if (regex.lastIndex === match.index) regex.lastIndex++;
        continue;
      }
      // Avoid duplicates
      if (!entities.some(e => e.text === match![0])) {
        entities.push({
          text: match[0],
          type: type as any,
          reason: `Matched ${type.toLowerCase()} pattern`,
          source: "REGEX"
        });
      }
    }
  });

  return entities;
}

export async function detectSensitiveInfoAI(text: string): Promise<DetectedEntity[]> {
  if (!text.trim()) return [];

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Identify all sensitive information in the following text that should be redacted for privacy. 
      You MUST return a JSON array of objects. Each object must have "text" (the exact string from the source) and "type" (one of the allowed categories).
      
      Look for:
      - Full Names (NAME)
      - Email Addresses (EMAIL)
      - Phone Numbers (PHONE)
      - Physical Addresses (ADDRESS)
      - IP Addresses (IP_ADDRESS)
      - Credit Card Numbers or Financial IDs (CREDIT_CARD)
      - Any other personally identifiable information (OTHER)

      Text to analyze:
      """
      ${text}
      """`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: {
                type: Type.STRING,
                description: "The exact text found in the source that is sensitive.",
              },
              type: {
                type: Type.STRING,
                enum: ["NAME", "EMAIL", "PHONE", "ADDRESS", "IP_ADDRESS", "CREDIT_CARD", "OTHER"],
                description: "The category of the sensitive information.",
              },
              reason: {
                type: Type.STRING,
                description: "Brief reason why this was flagged.",
              },
            },
            required: ["text", "type"],
          },
        },
      },
    });

    const result = JSON.parse(response.text || "[]");
    return result.map((item: any) => ({ ...item, source: "AI" }));
  } catch (error) {
    console.error("Error detecting sensitive info with AI:", error);
    return [];
  }
}
