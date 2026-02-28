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
      model: "gemini-3.1-pro-preview",
      contents: `You are a world-class data privacy and redaction expert. Your task is to identify ALL sensitive, personal, or identifying information in the provided text.
      
      CRITICAL: You MUST be extremely thorough and even "paranoid". Names are the most critical sensitive data. Look for them in greetings (Hi...), signatures (Best...), as subjects of sentences, and even in casual mentions.
      
      Categories to identify:
      - NAME: Full names, first names, last names, usernames, social media handles, nicknames, or initials.
      - EMAIL: Any email addresses.
      - PHONE: Phone numbers.
      - ADDRESS: Street addresses, city names, zip codes, or specific location names.
      - IP_ADDRESS: IPv4 or IPv6 addresses.
      - CREDIT_CARD: Credit card or bank account numbers.
      - OTHER: Social security numbers, passport numbers, or any other unique IDs.

      EXAMPLES:
      Input: "Hi John, I'll be at 123 Main St. Call me at 555-0199."
      Output: [{"text": "John", "type": "NAME"}, {"text": "123 Main St", "type": "ADDRESS"}, {"text": "555-0199", "type": "PHONE"}]

      Input: "Best regards, Sarah Miller"
      Output: [{"text": "Sarah Miller", "type": "NAME"}]

      Input: "I was talking to @alex_dev about the project."
      Output: [{"text": "@alex_dev", "type": "NAME"}]

      Input: "The package for Mr. Robert Chen is ready."
      Output: [{"text": "Robert Chen", "type": "NAME"}]

      Input: "Hey, it's me, Dave."
      Output: [{"text": "Dave", "type": "NAME"}]

      RULES:
      1. The "text" field MUST match the EXACT substring from the source text.
      2. Do not include punctuation at the end of a name unless it's part of the name.
      3. If you find multiple instances of the same name, list it once.
      
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
                description: "The category of the sensitive information. Use NAME for any personal identifiers like names, usernames, or handles.",
              },
              reason: {
                type: Type.STRING,
                description: "Briefly explain why this was flagged.",
              },
            },
            required: ["text", "type"],
          },
        },
      },
    });

    console.log("AI Raw Response:", response.text);
    let cleanText = response.text || "[]";
    // Strip markdown code blocks if present
    if (cleanText.includes("```json")) {
      const parts = cleanText.split("```json");
      if (parts.length > 1) {
        cleanText = parts[1].split("```")[0];
      }
    } else if (cleanText.includes("```")) {
      const parts = cleanText.split("```");
      if (parts.length > 1) {
        cleanText = parts[1].split("```")[0];
      }
    }
    
    const result = JSON.parse(cleanText.trim());
    return result.map((item: any) => ({ ...item, source: "AI" }));
  } catch (error) {
    console.error("Error detecting sensitive info with AI:", error);
    return [];
  }
}
