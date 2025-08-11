import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Parse date strings from <input type="date"> (yyyy-mm-dd) and dd-mm-yyyy safely
export function parseInputDate(value: string): Date | null {
  if (!value) return null
  const parts = value.split('-')
  if (parts.length === 3) {
    // yyyy-mm-dd
    if (parts[0].length === 4) {
      const [y, m, d] = parts.map(Number)
      if (!y || !m || !d) return null
      return new Date(y, m - 1, d)
    }
    // dd-mm-yyyy
    if (parts[0].length === 2) {
      const [d, m, y] = parts.map(Number)
      if (!y || !m || !d) return null
      return new Date(y, m - 1, d)
    }
  }
  const t = Date.parse(value)
  return isNaN(t) ? null : new Date(t)
}

export function daysBetweenInclusive(from: string, to: string): number {
  const a = parseInputDate(from)
  const b = parseInputDate(to)
  if (!a || !b || b < a) return 0
  // Normalize to UTC midnight to avoid DST issues
  const start = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const end = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  const MS_PER_DAY = 24 * 60 * 60 * 1000
  const diff = Math.floor((end - start) / MS_PER_DAY) + 1
  return Math.max(1, diff)
}

// Unified coupon logic used by product and quotation pages
export function calculateCouponDiscount(amount: number, code: string): number {
  const trimmed = (code || '').trim().toUpperCase()
  if (!trimmed) return 0
  if (trimmed === 'SAVE10') return amount * 0.10
  if (trimmed === 'FLAT50') return 50
  // default small incentive
  return amount * 0.05
}
