// curriculum-parser.utils.ts
export function toPrimitiveString(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return '';
}

export function getCellString(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') {
    const obj = val as Record<string, unknown>;
    if (obj.result !== undefined && obj.result !== null)
      return toPrimitiveString(obj.result);
    if (obj.text !== undefined && obj.text !== null)
      return toPrimitiveString(obj.text);
    if (Array.isArray(obj.richText)) {
      return obj.richText
        .map((t: unknown) => {
          if (t && typeof t === 'object') {
            const richObj = t as Record<string, unknown>;
            return richObj.text !== undefined && richObj.text !== null
              ? toPrimitiveString(richObj.text)
              : '';
          }
          return toPrimitiveString(t);
        })
        .join('');
    }
    return '';
  }
  return toPrimitiveString(val);
}

export function parseNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  const num = Number(val);
  return Number.isFinite(num) ? num : null;
}

export function parseSemester(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return val;
  const str = getCellString(val).trim();
  if (!str) return null;

  const digits = str.match(/\d+/g);
  if (!digits || digits.length === 0) return null;

  const nums = digits.map(Number);
  if (nums.length === 1) return nums[0];
  const semNum = nums.find((n) => n >= 1 && n <= 12);
  return semNum !== undefined ? semNum : nums[0];
}

export function parseTTValue(val: unknown): {
  organizingSem: string | null;
  expectedSem: number | null;
} {
  if (val === null || val === undefined)
    return { organizingSem: null, expectedSem: null };
  const str = getCellString(val).trim();
  if (!str) return { organizingSem: null, expectedSem: null };

  const parts = str
    .split(/[\s\n\r]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  let organizingSem: string | null = null;
  let expectedSem: number | null = null;

  for (const part of parts) {
    if (/HK\d+/i.test(part)) organizingSem = part.toUpperCase();
    else {
      const num = Number(part);
      if (Number.isFinite(num)) expectedSem = num;
    }
  }

  if (!organizingSem) {
    const hkMatch = str.match(/HK\d+/i);
    if (hkMatch) organizingSem = hkMatch[0].toUpperCase();
  }

  if (expectedSem === null) {
    const cleaned = str.replace(/HK\d+/i, '').trim();
    const numMatch = cleaned.match(/\d+/);
    if (numMatch) expectedSem = Number(numMatch[0]);
  }

  return { organizingSem, expectedSem };
}
