import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, Home, Phone, ShoppingCart, Store, ChevronDown, LogOut } from 'lucide-react'
import { api } from '@/lib/api'
import { totalCartQty, getWishlist } from '@/lib/utils'

type APICategory = { _id: string; name: string }

export default function CustomerNavbar() {
  const navigate = useNavigate()
  const userJson = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null
  const user = userJson ? JSON.parse(userJson) : null

  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [cartCount, setCartCount] = useState<number>(totalCartQty())
  const [wishlistCount, setWishlistCount] = useState<number>(getWishlist().length)
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    const onCart = () => setCartCount(totalCartQty())
    const onWish = () => setWishlistCount(getWishlist().length)
    window.addEventListener('cart:updated', onCart)
    window.addEventListener('wishlist:updated', onWish)
    return () => {
      window.removeEventListener('cart:updated', onCart)
      window.removeEventListener('wishlist:updated', onWish)
    }
  }, [])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/api/v1/category/all-categories')
        const names = (res.data?.data ?? []).map((c: APICategory) => c.name)
        setCategories(names)
      } catch {}
    }
    fetchCategories()
  }, [])

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b">
      <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="inline-flex items-center gap-2 font-semibold">
            <span className="inline-block size-6 rounded-md bg-primary" />
            RentalHub
          </Link>
          <nav className="hidden md:flex items-center gap-5 text-sm ml-6">
            <Link to="/dashboard/customer" className="inline-flex items-center gap-1 hover:underline"><Home className="size-4"/> Home</Link>
            <a href="#shop" onClick={(e) => { e.preventDefault(); navigate('/dashboard/customer#shop') }} className="inline-flex items-center gap-1 hover:underline"><Store className="size-4"/> Rental shop</a>
            <button onClick={() => navigate('/wishlist')} className="inline-flex items-center gap-1 hover:underline" title="Wishlist">
              <Heart className="size-4"/> Wishlist ({wishlistCount})
            </button>
            <button onClick={() => navigate('/cart')} className="inline-flex items-center gap-1 hover:underline" title="Cart">
              <ShoppingCart className="size-4"/> Cart ({cartCount})
            </button>
            <a href="#contact" onClick={(e) => { e.preventDefault(); navigate('/dashboard/customer#contact') }} className="inline-flex items-center gap-1 hover:underline"><Phone className="size-4"/> Contact us</a>
          </nav>
        </div>
        <div className="relative">
          <button onClick={() => setShowProfileMenu(s => !s)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white hover:bg-accent/40">
            <span className="text-sm">{user?.name ?? 'Profile'}</span>
            <ChevronDown className="size-4"/>
          </button>
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-40 rounded-md border bg-white shadow-sm p-1 text-sm">
              <button onClick={() => navigate('/profile')} className="block w-full text-left px-3 py-2 hover:bg-accent/50">My profile</button>
              <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="w-full text-left px-3 py-2 hover:bg-accent/50 inline-flex items-center gap-2"><LogOut className="size-4"/> Logout</button>
            </div>
          )}
        </div>
      </div>
      {/* Categories bar */}
      <div className="border-t bg-white/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 overflow-x-auto">
          <span className="text-sm text-muted-foreground mr-1">Categories:</span>
          {categories.map((c) => (
            <button key={c} onClick={() => navigate('/dashboard/customer#shop')} className="px-3 py-1.5 rounded-full border text-sm bg-white hover:bg-accent/40">{c}</button>
          ))}
          <button onClick={() => navigate('/dashboard/customer#shop')} className="ml-auto text-xs text-muted-foreground hover:underline">Clear</button>
        </div>
      </div>
    </header>
  )
}
