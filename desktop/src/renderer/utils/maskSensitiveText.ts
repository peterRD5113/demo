/**
 * maskSensitiveText.ts
 * Mask sensitive personal information in text for preview purposes.
 * Rules are applied in order from most specific to least specific
 * to avoid shorter patterns interfering with longer ones.
 */

interface MaskRule {
  name: string;
  regex: RegExp;
  replacer: (match: string) => string;
}

/** Replace middle characters with '*', keeping head and tail. */
function maskMiddle(str: string, keepHead: number, keepTail: number): string {
  if (str.length <= keepHead + keepTail) {
    return '*'.repeat(str.length);
  }
  const head = str.slice(0, keepHead);
  const tail = str.slice(str.length - keepTail);
  const masked = '*'.repeat(str.length - keepHead - keepTail);
  return head + masked + tail;
}

const MASK_RULES: MaskRule[] = [
  {
    // Rule 1: China Unified Social Credit Code (18 chars, alphanumeric)
    name: 'social-credit-code',
    regex: /\b[0-9A-HJ-NP-RT-Y]{2}\d{6}[0-9A-HJ-NP-RT-Y]{10}\b/g,
    replacer: (match) => maskMiddle(match, 4, 2),
  },
  {
    // Rule 2: China Resident ID Card (18 digits, last char may be X)
    name: 'id-card',
    regex: /\b[1-9]\d{5}(?:18|19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]\b/g,
    replacer: (match) => maskMiddle(match, 4, 4),
  },
  {
    // Rule 3: Bank card number (16-19 digits)
    // Must come AFTER id-card rule to avoid partial overlap
    name: 'bank-card',
    regex: /\b\d{16,19}\b/g,
    replacer: (match) => maskMiddle(match, 4, 4),
  },
  {
    // Rule 4: China mobile phone (11 digits, starts with 1[3-9])
    name: 'mobile-phone',
    regex: /\b1[3-9]\d{9}\b/g,
    replacer: (match) => maskMiddle(match, 3, 4),
  },
  {
    // Rule 5: China landline (area code + number)
    name: 'landline',
    regex: /\b0\d{2,3}[- ]\d{7,8}\b/g,
    replacer: (match) => {
      // Keep area code and last 4 digits, mask the middle
      const dashIdx = match.search(/[- ]/);
      const areaCode = match.slice(0, dashIdx + 1);
      const number = match.slice(dashIdx + 1);
      const maskedNumber = maskMiddle(number, 0, 4);
      return areaCode + maskedNumber;
    },
  },
  {
    // Rule 6: Email address
    name: 'email',
    regex: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
    replacer: (match) => {
      const atIdx = match.indexOf('@');
      const local = match.slice(0, atIdx);
      const domain = match.slice(atIdx);
      const maskedLocal = local.length <= 1 ? '*' : local[0] + '*'.repeat(local.length - 1);
      return maskedLocal + domain;
    },
  },
  {
    // Rule 7: China passport number (E/G prefix + 8 digits)
    name: 'passport',
    regex: /\b[EeGg]\d{8}\b/g,
    replacer: (match) => maskMiddle(match, 1, 1),
  },
];

/**
 * Apply all masking rules to the input text and return the masked result.
 * The original data is never modified.
 */
export function maskSensitiveText(text: string): string {
  if (!text) return text;
  let result = text;
  for (const rule of MASK_RULES) {
    // Reset lastIndex before each application to avoid stateful regex issues
    rule.regex.lastIndex = 0;
    result = result.replace(rule.regex, rule.replacer);
  }
  return result;
}

/**
 * Count how many sensitive matches exist in the text across all rules.
 */
export function countSensitiveMatches(text: string): number {
  if (!text) return 0;
  let count = 0;
  for (const rule of MASK_RULES) {
    rule.regex.lastIndex = 0;
    const matches = text.match(rule.regex);
    if (matches) count += matches.length;
  }
  return count;
}

