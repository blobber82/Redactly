export interface DetectedEntity {
  text: string;
  type: "NAME" | "EMAIL" | "PHONE" | "ADDRESS" | "IP_ADDRESS" | "CREDIT_CARD" | "DATE" | "GOVT_ID" | "FINANCIAL" | "AUTH" | "EMPLOYMENT" | "HEALTH" | "OTHER";
  reason?: string;
  source: "RULE_BASED";
}

// Luhn Algorithm for Credit Card Validation
function luhnCheck(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  
  let sum = 0;
  let shouldDouble = false;
  
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i));
    
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  
  return sum % 10 === 0;
}

const PATTERNS = {
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  PHONE: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  IP_ADDRESS: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
  // Credit card pattern (will be validated with Luhn)
  CREDIT_CARD: /\b(?:\d[ -]*?){13,19}\b/g,
  // Dates (MM/DD/YYYY, YYYY-MM-DD, etc.)
  DATE: /\b(?:\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{4}[-/.]\d{1,2}[-/.]\d{1,2})\b/g,
  // Government IDs (SSN, Passport-like, etc.)
  GOVT_ID: /\b(?:\d{3}-\d{2}-\d{4}|[A-Z]{1,2}\d{6,9}|[A-Z0-9]{10,12})\b/g,
  // Financial (Routing numbers, potential bank accounts)
  FINANCIAL: /\b(?:\d{9}|\d{10,12})\b/g,
  // Addresses
  ADDRESS: /\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Square|Sq|Terrace|Ter)\b/g,
  // Names (Capitalized sequences, often following titles)
  NAME: /\b(?:Mr\.|Ms\.|Mrs\.|Dr\.|Prof\.)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b|\b[A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g,
};

// Structural cues for context-based detection
const CONTEXT_RULES = [
  {
    type: "AUTH" as const,
    regex: /\b(?:user|username|login|pass|password|pwd|secret|key)\s*[:=]\s*([^\s,;]+)/gi,
  },
  {
    type: "EMPLOYMENT" as const,
    regex: /\b(?:emp|employee)\s*(?:id|#|number)\s*[:=]?\s*([A-Z0-9-]+)/gi,
  },
  {
    type: "HEALTH" as const,
    regex: /\b(?:policy|insurance|medical|provider)\s*(?:#|id|number)\s*[:=]?\s*([A-Z0-9-]+)/gi,
  },
  {
    type: "DATE" as const,
    regex: /\b(?:dob|birth|born|date)\s*[:=]?\s*(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|\d{4}[-/.]\d{1,2}[-/.]\d{1,2})/gi,
  },
  {
    type: "OTHER" as const,
    regex: /\b(?:age|aged|years old)\s*[:=]?\s*(\d{1,3})/gi,
  }
];

export function detectSensitiveInfoRegex(text: string): DetectedEntity[] {
  const entities: DetectedEntity[] = [];
  
  // 1. Pattern matching
  (Object.keys(PATTERNS) as Array<keyof typeof PATTERNS>).forEach(type => {
    const regex = PATTERNS[type];
    let match;
    while ((match = regex.exec(text)) !== null) {
      const matchText = match[0].trim();
      if (!matchText) {
        if (regex.lastIndex === match.index) regex.lastIndex++;
        continue;
      }

      // Special validation for Credit Cards
      if (type === 'CREDIT_CARD' && !luhnCheck(matchText)) {
        continue;
      }

      // Avoid duplicates or overlapping with better matches
      if (!entities.some(e => e.text === matchText)) {
        entities.push({
          text: matchText,
          type: type as any,
          reason: `Matched ${type.toLowerCase()} pattern`,
          source: "RULE_BASED"
        });
      }
    }
  });

  // 2. Context-based structural cues
  CONTEXT_RULES.forEach(rule => {
    let match;
    while ((match = rule.regex.exec(text)) !== null) {
      const captured = match[1]?.trim();
      if (captured && captured.length > 1) {
        if (!entities.some(e => e.text === captured)) {
          entities.push({
            text: captured,
            type: rule.type,
            reason: `Detected via structural cue: ${match[0].split(captured)[0].trim()}`,
            source: "RULE_BASED"
          });
        }
      }
    }
  });

  return entities;
}

// Mock AI function to maintain compatibility but it now just calls the regex one
export async function detectSensitiveInfoAI(text: string): Promise<DetectedEntity[]> {
  return detectSensitiveInfoRegex(text);
}
