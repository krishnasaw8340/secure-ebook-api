/** Convert a decimal string ("4.99", "5") to integer minor units, or null. */
export function toMinorUnits(value: string): number | null {
  const match = /^\d+(\.\d{1,2})?$/.exec(value.trim());
  if (!match) return null;
  const [whole, fraction = ''] = value.trim().split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

/** Exact decimal comparison without floating-point error. */
export function amountsEqual(a: string, b: string): boolean {
  const left = toMinorUnits(a);
  const right = toMinorUnits(b);
  return left !== null && right !== null && left === right;
}
