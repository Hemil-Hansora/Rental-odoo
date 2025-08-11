import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import axios from 'axios'
import {
  Home,
  Store,
  Heart,
  ShoppingCart,
  User2,
  ChevronDown,
  Phone,
  Grid as GridIcon,
  List as ListIcon,
  Search,
  SlidersHorizontal,
  LogOut,
} from 'lucide-react'

type APIProduct = {
  _id: string
  name: string
  description?: string
  images?: string[]
  stock: number
  unit?: string
  pricing?: {
    pricePerHour?: number
    pricePerDay?: number
    pricePerWeek?: number
  }
  category?: { _id?: string; name?: string }
}

export default function CustomerDashboard() {
  const navigate = useNavigate()
  const userJson = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null
  const user = userJson ? JSON.parse(userJson) : null

  useEffect(() => {
    if (!user) navigate('/login', { replace: true })
  }, [])

  // Data state
  const [products, setProducts] = useState<APIProduct[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // UI state
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [search, setSearch] = useState('')
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(100)
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [wishlist, setWishlist] = useState<string[]>([])
  const [cart, setCart] = useState<string[]>([])

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await axios.get('http://localhost:3000/api/v1/product/all-product', { params: { limit: 48 } })
        const list: APIProduct[] = res?.data?.data?.products ?? []
        setProducts(list)
        const prices = list.map(p => p.pricing?.pricePerDay ?? 0)
        const max = Math.max(0, ...prices)
        setMaxPrice(max > 0 ? Math.ceil(max) : 100)
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load products')
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  // Derived categories and price bound
  const categories = useMemo(() => {
    const set = new Set<string>()
    products.forEach(p => { if (p.category?.name) set.add(p.category.name) })
    return Array.from(set)
  }, [products])
  const priceBound = useMemo(() => {
    const prices = products.map(p => p.pricing?.pricePerDay ?? 0)
    const max = Math.max(0, ...prices)
    return max > 0 ? Math.ceil(max) : 100
  }, [products])

  const filtered = useMemo(() => {
    return products.filter(p => {
      const price = p.pricing?.pricePerDay ?? 0
      const catName = p.category?.name ?? ''
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
      if (price < minPrice || price > maxPrice) return false
      if (selectedCats.length && !selectedCats.includes(catName)) return false
      return true
    })
  }, [products, search, minPrice, maxPrice, selectedCats])

  const toggleWishlist = (id: string) => {
    setWishlist(w => w.includes(id) ? w.filter(x => x !== id) : [...w, id])
  }
  const addToCart = (id: string) => {
    setCart(c => c.includes(id) ? c : [...c, id])
  }

  const CategoryPill = ({ label }: { label: string }) => (
    <button
      onClick={() => setSelectedCats(s => s.includes(label) ? s.filter(x => x !== label) : [...s, label])}
      className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${selectedCats.includes(label) ? 'bg-primary text-primary-foreground border-primary' : 'bg-white hover:bg-accent/40'}`}
    >
      {label}
    </button>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <a href="/" className="inline-flex items-center gap-2 font-semibold">
              <span className="inline-block size-6 rounded-md bg-primary" />
              RentalHub
            </a>
            <nav className="hidden md:flex items-center gap-5 text-sm ml-6">
              <a href="/" className="inline-flex items-center gap-1 hover:underline"><Home className="size-4"/> Home</a>
              <a href="#shop" className="inline-flex items-center gap-1 hover:underline"><Store className="size-4"/> Rental shop</a>
              <button className="inline-flex items-center gap-1 hover:underline" title="Wishlist"><Heart className="size-4"/> Wishlist ({wishlist.length})</button>
              <button className="inline-flex items-center gap-1 hover:underline" title="Cart"><ShoppingCart className="size-4"/> Cart ({cart.length})</button>
              <a href="#review" className="hover:underline">Review order</a>
              <a href="#contact" className="inline-flex items-center gap-1 hover:underline"><Phone className="size-4"/> Contact us</a>
            </nav>
          </div>
          <div className="relative">
            <button onClick={() => setShowProfileMenu(s => !s)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white hover:bg-accent/40">
              <User2 className="size-4"/>
              <span className="text-sm">{user?.name ?? 'Profile'}</span>
              <ChevronDown className="size-4"/>
            </button>
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-40 rounded-md border bg-white shadow-sm p-1 text-sm">
                <button onClick={() => navigate('/profile')} className="block w-full text-left px-3 py-2 hover:bg-accent/50">My profile</button>
                <button
                  onClick={() => { localStorage.clear(); navigate('/login'); }}
                  className="w-full text-left px-3 py-2 hover:bg-accent/50 inline-flex items-center gap-2"
                >
                  <LogOut className="size-4"/> Logout
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Categories bar */}
        <div className="border-t bg-white/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 overflow-x-auto">
            <span className="text-sm text-muted-foreground mr-1">Categories:</span>
            {categories.map(c => (
              <CategoryPill key={c} label={c} />
            ))}
            <button
              onClick={() => setSelectedCats([])}
              className="ml-auto text-xs text-muted-foreground hover:underline"
            >Clear</button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main id="shop" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-[280px_1fr] gap-6">
        {/* Filters */}
        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base inline-flex items-center gap-2"><SlidersHorizontal className="size-4"/> Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <label className="text-sm">Search</label>
                <div className="mt-2 relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search products..."
                    className="pl-8"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm">Price per day</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Input type="number" min={0} value={minPrice} onChange={e => setMinPrice(Number(e.target.value) || 0)} placeholder="Min" />
                  <Input type="number" min={0} value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value) || 0)} placeholder="Max" />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input type="range" min={0} max={priceBound || 100} value={minPrice} onChange={e => setMinPrice(Number(e.target.value))} className="flex-1"/>
                  <input type="range" min={0} max={priceBound || 100} value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} className="flex-1"/>
                </div>
              </div>

              <div className="pt-2">
                <Button variant="outline" onClick={() => { setSearch(''); setSelectedCats([]); setMinPrice(0); setMaxPrice(priceBound); }}>Reset filters</Button>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Results */}
        <section>
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">{loading ? 'Loading…' : `${filtered.length} results`}</div>
            <div className="inline-flex items-center gap-1 rounded-md border bg-white p-1">
              <Button variant={view === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => setView('grid')} className={view === 'grid' ? 'btn-gradient' : ''}>
                <GridIcon className="size-4"/>
              </Button>
              <Button variant={view === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setView('list')} className={view === 'list' ? 'btn-gradient' : ''}>
                <ListIcon className="size-4"/>
              </Button>
            </div>
          </div>

          <div className={view === 'grid' ? 'mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'mt-6 space-y-4'}>
            {error && (<div className="text-sm text-destructive">{error}</div>)}
            {!loading && !error && filtered.map(p => {
              const price = p.pricing?.pricePerDay ?? p.pricing?.pricePerWeek ?? p.pricing?.pricePerHour ?? 0
              const unit = p.pricing?.pricePerDay ? '/day' : p.pricing?.pricePerWeek ? '/week' : p.pricing?.pricePerHour ? '/hour' : ''
              const catName = p.category?.name ?? '—'
              const img = p.images?.[0]
              return (
                <Card key={p._id} className="overflow-hidden">
                  <a href={`/product/${p._id}`} aria-label={p.name}>
                    {img ? <img src={img} alt={p.name} className="h-40 w-full object-cover"/> : <div className="h-40 bg-muted" />}
                  </a>
                  <CardContent className={view === 'grid' ? 'p-4' : 'p-4 flex items-center gap-4'}>
                    <div className={view === 'grid' ? '' : 'flex-1'}>
                      <div className="flex items-center justify-between">
                        <a href={`/product/${p._id}`} className="font-medium truncate hover:underline" title={p.name}>{p.name}</a>
                        <div className="text-sm text-muted-foreground">{catName}</div>
                      </div>
                      <div className="mt-2 text-lg font-semibold">${price}{unit}</div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Button size="sm" onClick={() => addToCart(p._id)} className="btn-gradient inline-flex items-center gap-1"><ShoppingCart className="size-4"/> Add</Button>
                      <button onClick={() => toggleWishlist(p._id)} className={`size-9 inline-flex items-center justify-center rounded-md border ${wishlist.includes(p._id) ? 'bg-primary text-primary-foreground border-primary' : 'bg-white hover:bg-accent/50'}`} title="Wishlist">
                        <Heart className={`size-4 ${wishlist.includes(p._id) ? 'fill-current' : ''}`}/>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      </main>

      {/* Review + contact anchors for menu links */}
      <section id="review" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Review order</CardTitle>
            <CardDescription>Preview your cart and proceed to checkout (coming soon)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Items in cart: {cart.length}. We’ll integrate backend later.</div>
          </CardContent>
        </Card>
      </section>

      <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <Card>
          <CardHeader>
            <CardTitle>Contact us</CardTitle>
            <CardDescription>Have a question? We’re here to help.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Email: support@rentalhub.example • Phone: +1 (555) 123-4567
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
