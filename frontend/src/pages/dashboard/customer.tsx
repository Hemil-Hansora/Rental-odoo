import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
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
  Star,
  LogOut,
} from 'lucide-react'

type Product = {
  id: number
  name: string
  price: number
  category: string
  brand: string
  rating: number
  tags?: string[]
}

const ALL_CATEGORIES = ['Cameras', 'Tools', 'Furniture', 'Gaming', 'Outdoors'] as const
const ALL_BRANDS = ['Acme', 'Globex', 'Umbrella', 'Soylent', 'Initech'] as const

const HARD_PRODUCTS: Product[] = [
  { id: 1, name: '4K Action Cam', price: 22, category: 'Cameras', brand: 'Acme', rating: 5, tags: ['waterproof'] },
  { id: 2, name: 'DSLR Pro Kit', price: 35, category: 'Cameras', brand: 'Globex', rating: 4 },
  { id: 3, name: 'Power Drill 18V', price: 9, category: 'Tools', brand: 'Umbrella', rating: 4 },
  { id: 4, name: 'Circular Saw', price: 12, category: 'Tools', brand: 'Soylent', rating: 3 },
  { id: 5, name: 'Ergo Office Chair', price: 14, category: 'Furniture', brand: 'Initech', rating: 5 },
  { id: 6, name: 'Standing Desk', price: 18, category: 'Furniture', brand: 'Acme', rating: 4 },
  { id: 7, name: 'VR Headset', price: 20, category: 'Gaming', brand: 'Globex', rating: 5 },
  { id: 8, name: 'Portable Console', price: 11, category: 'Gaming', brand: 'Umbrella', rating: 4 },
  { id: 9, name: 'Camping Tent (4p)', price: 16, category: 'Outdoors', brand: 'Soylent', rating: 4 },
  { id: 10, name: 'Hiking Backpack 45L', price: 10, category: 'Outdoors', brand: 'Initech', rating: 3 },
]

export default function CustomerDashboard() {
  const navigate = useNavigate()
  const userJson = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null
  const user = userJson ? JSON.parse(userJson) : null

  useEffect(() => {
    if (!user) navigate('/login', { replace: true })
  }, [])

  // UI state
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [search, setSearch] = useState('')
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(40)
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [minRating, setMinRating] = useState<number>(0)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [wishlist, setWishlist] = useState<number[]>([])
  const [cart, setCart] = useState<number[]>([])

  const categories = ALL_CATEGORIES as unknown as string[]
  const brands = ALL_BRANDS as unknown as string[]

  const filtered = useMemo(() => {
    return HARD_PRODUCTS.filter(p => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
      if (p.price < minPrice || p.price > maxPrice) return false
      if (selectedCats.length && !selectedCats.includes(p.category)) return false
      if (selectedBrands.length && !selectedBrands.includes(p.brand)) return false
      if (minRating && p.rating < minRating) return false
      return true
    })
  }, [search, minPrice, maxPrice, selectedCats, selectedBrands, minRating])

  const toggleWishlist = (id: number) => {
    setWishlist(w => w.includes(id) ? w.filter(x => x !== id) : [...w, id])
  }
  const addToCart = (id: number) => {
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
                <div className="mt-2 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="size-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                    <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find products..." className="pl-8" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm">Price per day</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Input type="number" min={0} value={minPrice} onChange={e => setMinPrice(Number(e.target.value) || 0)} placeholder="Min" />
                  <Input type="number" min={0} value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value) || 0)} placeholder="Max" />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input type="range" min={0} max={40} value={minPrice} onChange={e => setMinPrice(Number(e.target.value))} className="flex-1"/>
                  <input type="range" min={0} max={40} value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} className="flex-1"/>
                </div>
              </div>

              <div>
                <label className="text-sm">Brands</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {brands.map(b => (
                    <button
                      key={b}
                      onClick={() => setSelectedBrands(s => s.includes(b) ? s.filter(x => x !== b) : [...s, b])}
                      className={`px-2.5 py-1.5 rounded-md border text-xs ${selectedBrands.includes(b) ? 'bg-secondary text-secondary-foreground border-secondary' : 'bg-white hover:bg-accent/40'}`}
                    >{b}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm">Minimum rating</label>
                <div className="mt-2 flex items-center gap-1">
                  {[0,1,2,3,4,5].map(r => (
                    <button key={r} onClick={() => setMinRating(r)} title={`${r}+`}
                      className={`p-1 rounded-md ${minRating === r ? 'bg-primary text-primary-foreground' : 'hover:bg-accent/40'}`}
                    >
                      <Star className={`size-4 ${r <= minRating ? 'fill-current' : ''}`}/>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <Button variant="outline" onClick={() => { setSearch(''); setSelectedBrands([]); setSelectedCats([]); setMinPrice(0); setMaxPrice(40); setMinRating(0); }}>Reset filters</Button>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Results */}
        <section>
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">{filtered.length} results</div>
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
            {filtered.map(p => (
              <Card key={p.id} className="overflow-hidden">
                <div className="h-40 bg-muted" />
                <CardContent className={view === 'grid' ? 'p-4' : 'p-4 flex items-center gap-4'}>
                  <div className={view === 'grid' ? '' : 'flex-1'}>
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-sm text-muted-foreground">{p.category} • {p.brand}</div>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground inline-flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`size-4 ${i < p.rating ? 'fill-current text-yellow-500' : 'text-muted-foreground'}`} />
                      ))}
                    </div>
                    <div className="mt-2 text-lg font-semibold">${p.price}/day</div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button size="sm" onClick={() => addToCart(p.id)} className="btn-gradient inline-flex items-center gap-1"><ShoppingCart className="size-4"/> Add</Button>
                    <button onClick={() => toggleWishlist(p.id)} className={`size-9 inline-flex items-center justify-center rounded-md border ${wishlist.includes(p.id) ? 'bg-primary text-primary-foreground border-primary' : 'bg-white hover:bg-accent/50'}`} title="Wishlist">
                      <Heart className={`size-4 ${wishlist.includes(p.id) ? 'fill-current' : ''}`}/>
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
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
