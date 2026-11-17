// Prices are decimals in euros and JavaScript floats cannot store most cents exactly
// (24.9 * 3 = 74.69999999999999): every computed amount goes through this before being shown or exported.
export function roundToCents(amount: number): number {
  return Math.round(amount * 100) / 100
}
