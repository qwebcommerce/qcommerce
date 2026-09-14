export const GULF_DIALS = [
  { country: "Qatar", code: "+974", digits: 8, label: "Qatar +974" },
  { country: "UAE", code: "+971", digits: 9, label: "UAE +971" },
  { country: "KSA", code: "+966", digits: 9, label: "KSA +966" },
  { country: "Kuwait", code: "+965", digits: 8, label: "Kuwait +965" },
  { country: "Bahrain", code: "+973", digits: 8, label: "Bahrain +973" },
  { country: "Oman", code: "+968", digits: 8, label: "Oman +968" },
] as const;

export type GulfDial = (typeof GULF_DIALS)[number];

export function isValidEmail(value: string): boolean {
  const email = value.trim();
  if (email.length < 6 || email.length > 254) return false;
  if (email.includes("..") || email.startsWith(".") || email.endsWith(".")) return false;
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function gulfDialForCountry(country: string): GulfDial {
  return GULF_DIALS.find((item) => item.country === country) ?? GULF_DIALS[0];
}

export function gulfDialForCode(code: string): GulfDial {
  return GULF_DIALS.find((item) => item.code === code) ?? GULF_DIALS[0];
}

export function normalizeLocalNumber(value: string): string {
  return digitsOnly(value).replace(/^0+/, "");
}

export function composeGulfPhone(code: string, local: string): string {
  const dial = gulfDialForCode(code);
  const digits = normalizeLocalNumber(local);
  if (digits.length !== dial.digits) return "";
  return `${dial.code}${digits}`;
}

export function parseGulfPhone(phone: string): { code: string; local: string; e164: string } | null {
  const digits = digitsOnly(phone);
  if (!digits) return null;
  const ranked = [...GULF_DIALS].sort((a, b) => b.code.length - a.code.length);
  for (const dial of ranked) {
    const cc = dial.code.slice(1);
    if (!digits.startsWith(cc)) continue;
    const local = digits.slice(cc.length).replace(/^0+/, "");
    if (local.length !== dial.digits) continue;
    return { code: dial.code, local, e164: `${dial.code}${local}` };
  }
  return null;
}

export function splitGulfPhone(phone: string, country = "Qatar"): { code: string; local: string } {
  const parsed = parseGulfPhone(phone);
  if (parsed) return { code: parsed.code, local: parsed.local };
  const dial = gulfDialForCountry(country);
  const cc = dial.code.slice(1);
  let local = normalizeLocalNumber(phone);
  if (local.startsWith(cc)) local = local.slice(cc.length);
  return { code: dial.code, local };
}

export function isValidGulfPhone(phone: string): boolean {
  return Boolean(parseGulfPhone(phone));
}
