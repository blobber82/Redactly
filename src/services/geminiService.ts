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
      contents: `Identify all sensitive information in the following text. 
      
      CRITICAL: You MUST detect all personal names (first, last, or full names), even if they appear in casual context, greetings, or signatures.
      
      Categories:
      - NAME: Any person's name, username, or handle.
      - EMAIL: Email addresses.
      - PHONE: Phone numbers.
      - ADDRESS: Physical addresses or specific locations.
      - IP_ADDRESS: IP addresses.
      - CREDIT_CARD: Credit card numbers.
      - OTHER: SSNs, IDs, etc.

      Return a JSON array of objects with "text" (the exact substring) and "type" (the category).
      
      Text to scan:
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
                description: "The exact substring from the text.",
              },
              type: {
                type: Type.STRING,
                enum: ["NAME", "EMAIL", "PHONE", "ADDRESS", "IP_ADDRESS", "CREDIT_CARD", "OTHER"],
              },
              reason: {
                type: Type.STRING,
              },
            },
            required: ["text", "type"],
          },
        },
      },
    });

    let cleanText = response.text?.trim() || "[]";
    // Strip markdown code blocks if present
    if (cleanText.includes("```json")) {
      cleanText = cleanText.split("```json")[1].split("```")[0];
    } else if (cleanText.includes("```")) {
      cleanText = cleanText.split("```")[1].split("```")[0];
    }
    
    const result = JSON.parse(cleanText.trim());
    return result.map((item: any) => ({ ...item, source: "AI" }));
  } catch (error) {
    console.error("Error detecting sensitive info with AI:", error);
    return [];
  }
}
