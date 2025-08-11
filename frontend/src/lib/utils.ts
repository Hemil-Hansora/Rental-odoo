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

// ----- Simple cart using localStorage -----
export type CartItem = { id: string; qty: number }

const CART_KEY = 'cart'
const WISHLIST_KEY = 'wishlist'

function safeLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function getCart(): CartItem[] {
  const ls = safeLocalStorage()
  if (!ls) return []
  try {
    const raw = ls.getItem(CART_KEY)
    const arr = raw ? JSON.parse(raw) : []
    if (Array.isArray(arr)) return arr.filter(x => x && typeof x.id === 'string' && typeof x.qty === 'number')
    return []
  } catch {
    return []
  }
}

function setCart(items: CartItem[]) {
  const ls = safeLocalStorage()
  if (!ls) return
  ls.setItem(CART_KEY, JSON.stringify(items))
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cart:updated'))
  }
}

export function addToCart(productId: string, qty: number = 1) {
  if (!productId || qty <= 0) return
  const items = getCart()
  const idx = items.findIndex(i => i.id === productId)
  if (idx >= 0) items[idx].qty += qty
  else items.push({ id: productId, qty })
  setCart(items)
}

export function updateCartQty(productId: string, qty: number) {
  const items = getCart()
  const next = items
    .map(i => (i.id === productId ? { ...i, qty } : i))
    .filter(i => i.qty > 0)
  setCart(next)
}

export function removeFromCart(productId: string) {
  const items = getCart().filter(i => i.id !== productId)
  setCart(items)
}

export function clearCart() {
  setCart([])
}

export function totalCartQty(): number {
  return getCart().reduce((sum, i) => sum + (i.qty || 0), 0)
}

// ----- Simple wishlist using localStorage -----
export function getWishlist(): string[] {
  const ls = safeLocalStorage()
  if (!ls) return []
  try {
    const raw = ls.getItem(WISHLIST_KEY)
    const arr = raw ? JSON.parse(raw) : []
    if (Array.isArray(arr)) return arr.filter(id => typeof id === 'string')
    return []
  } catch {
    return []
  }
}

function setWishlist(ids: string[]) {
  const ls = safeLocalStorage()
  if (!ls) return
  ls.setItem(WISHLIST_KEY, JSON.stringify(Array.from(new Set(ids))))
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('wishlist:updated'))
  }
}

export function addToWishlist(productId: string) {
  if (!productId) return
  const ids = getWishlist()
  if (!ids.includes(productId)) {
    setWishlist([...ids, productId])
  }
}

export function removeFromWishlist(productId: string) {
  setWishlist(getWishlist().filter(id => id !== productId))
}

export function toggleWishlist(productId: string) {
  const ids = getWishlist()
  if (ids.includes(productId)) setWishlist(ids.filter(id => id !== productId))
  else setWishlist([...ids, productId])
}

export function isInWishlist(productId: string): boolean {
  return getWishlist().includes(productId)
}

export function totalWishlist(): number {
  return getWishlist().length
}
