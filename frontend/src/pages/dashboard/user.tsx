import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Search, Package, ShoppingBag, User2, ChevronDown, LogOut, DollarSign, Plus, Trash2, X } from 'lucide-react'
import { api } from '@/lib/api'

type Row = { name: string; orders: number; revenue: number }
type Category = { _id: string; name: string }
type Product = {
  _id: string
  name: string
  sku?: string
  images?: string[]
  stock: number
  unit?: string
  pricing?: { pricePerHour?: number; pricePerDay?: number; pricePerWeek?: number }
  category?: { _id: string; name: string } | null
  createdAt?: string
}

export default function UserDashboard() {
  const navigate = useNavigate()
  const userJson = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null
  const user = userJson ? JSON.parse(userJson) : null

  useEffect(() => {
    if (!user) navigate('/login', { replace: true })
  }, [])

  // Hardcoded data for demo
  const [period, setPeriod] = useState<'7d'|'30d'|'90d'>('7d')
  const [query, setQuery] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [activeSection, setActiveSection] = useState<'overview'|'products'>('overview')

  // Products state
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [prodQuery, setProdQuery] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    sku: '',
    category: '',
    stock: 0,
    unit: 'piece',
    description: '',
    pricePerHour: '',
    pricePerDay: '',
    pricePerWeek: '',
    image: null as File | null,
  })

  const stats = useMemo(() => {
    // simple scaling by period
    const mult = period === '7d' ? 1 : period === '30d' ? 3.8 : 8.5
    return {
      quotations: Math.round(12 * mult),
      rentals: Math.round(8 * mult),
      revenue: Math.round(1240 * mult),
    }
  }, [period])

  const topCategories: Row[] = useMemo(() => ([
    { name: 'Cameras', orders: 42, revenue: 5200 },
    { name: 'Tools', orders: 31, revenue: 3100 },
    { name: 'Gaming', orders: 24, revenue: 2800 },
  ]), [])
  const topProducts: Row[] = useMemo(() => ([
    { name: '4K Action Cam', orders: 18, revenue: 1980 },
    { name: 'VR Headset', orders: 15, revenue: 1750 },
    { name: 'Power Drill 18V', orders: 12, revenue: 980 },
  ]), [])
  const topCustomers: Row[] = useMemo(() => ([
    { name: 'Alicia R.', orders: 9, revenue: 890 },
    { name: 'Jordan P.', orders: 7, revenue: 730 },
    { name: 'Sam K.', orders: 6, revenue: 640 },
  ]), [])

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    const f = (rows: Row[]) => rows.filter(r => r.name.toLowerCase().includes(q))
    return { cats: f(topCategories), prods: f(topProducts), custs: f(topCustomers) }
  }, [query, topCategories, topProducts, topCustomers])

  // Fetch products and categories
  useEffect(() => {
    if (activeSection !== 'products') return
    const fetchAll = async () => {
      try {
        setLoadingProducts(true)
        const [prodRes, catRes] = await Promise.all([
          api.get('/api/v1/product/all-product', { params: { search: prodQuery, limit: 50 } }),
          api.get('/api/v1/category/all-categories'),
        ])
        const list: Product[] = prodRes.data?.data?.products ?? []
        setProducts(list)
        setCategories(catRes.data?.data ?? [])
      } catch (e) {
        console.error('Failed to fetch products/categories', e)
      } finally {
        setLoadingProducts(false)
      }
    }
    fetchAll()
  }, [activeSection, prodQuery])

  const displayPrice = (p?: Product['pricing']) => {
    if (!p) return '-'
    if (p.pricePerDay) return `$${p.pricePerDay}/day`
    if (p.pricePerWeek) return `$${p.pricePerWeek}/wk`
    if (p.pricePerHour) return `$${p.pricePerHour}/hr`
    return '-'
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.name || !createForm.image || (!createForm.pricePerDay && !createForm.pricePerHour && !createForm.pricePerWeek)) {
      alert('Name, at least one price, and one image are required.')
      return
    }
    try {
      setCreating(true)
      const fd = new FormData()
      fd.append('name', createForm.name)
      if (createForm.sku) fd.append('sku', createForm.sku)
      if (createForm.category) fd.append('category', createForm.category)
      fd.append('stock', String(createForm.stock))
      if (createForm.unit) fd.append('unit', createForm.unit)
      if (createForm.description) fd.append('description', createForm.description)
      if (createForm.pricePerHour) fd.append('pricing.pricePerHour', createForm.pricePerHour)
      if (createForm.pricePerDay) fd.append('pricing.pricePerDay', createForm.pricePerDay)
      if (createForm.pricePerWeek) fd.append('pricing.pricePerWeek', createForm.pricePerWeek)
      fd.append('images', createForm.image)

  await api.post('/api/v1/product/create-product', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setShowCreate(false)
      setCreateForm({ name: '', sku: '', category: '', stock: 0, unit: 'piece', description: '', pricePerHour: '', pricePerDay: '', pricePerWeek: '', image: null })
      // refresh list
      setProdQuery(q => q) // trigger effect
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to create product'
      alert(msg)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return
    try {
  await api.delete(`/api/v1/product/delete/${id}`)
      setProducts(prev => prev.filter(p => p._id !== id))
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to delete product'
      alert(msg)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <nav className="flex items-center gap-2 text-sm">
            <button onClick={() => setActiveSection('overview')} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md ${activeSection==='overview' ? 'bg-accent/60' : 'hover:bg-accent/40'}`}>
              <ShoppingBag className="size-4"/> Overview
            </button>
            <button onClick={() => setActiveSection('products')} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md ${activeSection==='products' ? 'bg-accent/60' : 'hover:bg-accent/40'}`}>
              <Package className="size-4"/> Products
            </button>
          </nav>
          <div className="relative">
            <button onClick={() => setShowMenu(s => !s)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border bg-white hover:bg-accent/40">
              <User2 className="size-4"/>
              <span className="text-sm">{user?.name ?? 'User'}</span>
              <ChevronDown className="size-4"/>
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-40 rounded-md border bg-white shadow-sm p-1 text-sm">
                <button onClick={() => navigate('/profile')} className="block w-full text-left px-3 py-2 hover:bg-accent/50">My profile</button>
                <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="w-full text-left px-3 py-2 hover:bg-accent/50 inline-flex items-center gap-2"><LogOut className="size-4"/> Logout</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {activeSection === 'overview' ? (
          <>
            {/* Search + period */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
              <div className="relative max-w-md">
                <Search className="size-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search categories, products, customers..." className="pl-8" />
              </div>
              <div className="inline-flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Period</label>
                <select value={period} onChange={e => setPeriod(e.target.value as any)} className="h-9 rounded-md border bg-white px-3 text-sm">
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="card-accent">
                <CardHeader>
                  <CardTitle>Quotations</CardTitle>
                  <CardDescription>Requests in the selected period</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold">{stats.quotations}</div>
                </CardContent>
              </Card>
              <Card className="card-accent">
                <CardHeader>
                  <CardTitle>Rentals</CardTitle>
                  <CardDescription>Confirmed bookings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold">{stats.rentals}</div>
                </CardContent>
              </Card>
              <Card className="card-accent">
                <CardHeader>
                  <CardTitle>Total revenue</CardTitle>
                  <CardDescription>Gross in the selected period</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold inline-flex items-center gap-2"><DollarSign className="size-6"/>{stats.revenue}</div>
                </CardContent>
              </Card>
            </div>

            {/* Tables */}
            <div className="grid lg:grid-cols-3 gap-6" id="orders">
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle>Top categories</CardTitle>
                  <CardDescription>By orders and revenue</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-t border-b bg-muted/40">
                        <th className="text-left px-4 py-2">Category</th>
                        <th className="text-right px-4 py-2">Orders</th>
                        <th className="text-right px-4 py-2">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.cats.map((r, i) => (
                        <tr key={i} className="border-b">
                          <td className="px-4 py-2">{r.name}</td>
                          <td className="px-4 py-2 text-right">{r.orders}</td>
                          <td className="px-4 py-2 text-right">${r.revenue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle>Top products</CardTitle>
                  <CardDescription>Most rented items</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-t border-b bg-muted/40">
                        <th className="text-left px-4 py-2">Product</th>
                        <th className="text-right px-4 py-2">Orders</th>
                        <th className="text-right px-4 py-2">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.prods.map((r, i) => (
                        <tr key={i} className="border-b">
                          <td className="px-4 py-2">{r.name}</td>
                          <td className="px-4 py-2 text-right">{r.orders}</td>
                          <td className="px-4 py-2 text-right">${r.revenue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle>Top customers</CardTitle>
                  <CardDescription>By orders and revenue</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-t border-b bg-muted/40">
                        <th className="text-left px-4 py-2">Customer</th>
                        <th className="text-right px-4 py-2">Orders</th>
                        <th className="text-right px-4 py-2">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.custs.map((r, i) => (
                        <tr key={i} className="border-b">
                          <td className="px-4 py-2">{r.name}</td>
                          <td className="px-4 py-2 text-right">{r.orders}</td>
                          <td className="px-4 py-2 text-right">${r.revenue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <>
            {/* Products management */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
              <div className="relative max-w-md">
                <Search className="size-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={prodQuery} onChange={e => setProdQuery(e.target.value)} placeholder="Search your products..." className="pl-8" />
              </div>
              <Button onClick={() => setShowCreate(true)} className="btn-gradient inline-flex items-center gap-2"><Plus className="size-4"/> New product</Button>
            </div>

            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Products</CardTitle>
                <CardDescription>Manage your catalog</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loadingProducts ? (
                  <div className="p-6 text-sm text-muted-foreground">Loading products…</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-t border-b bg-muted/40">
                          <th className="text-left px-4 py-2">Item</th>
                          <th className="text-left px-4 py-2">Category</th>
                          <th className="text-right px-4 py-2">Stock</th>
                          <th className="text-right px-4 py-2">Price</th>
                          <th className="text-right px-4 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">No products found</td>
                          </tr>
                        )}
                        {products.map(p => (
                          <tr key={p._id} className="border-b">
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-3">
                                {p.images?.[0] ? (
                                  <img src={p.images[0]} alt={p.name} className="size-10 rounded object-cover border" />
                                ) : (
                                  <div className="size-10 rounded border bg-muted" />
                                )}
                                <div>
                                  <div className="font-medium">{p.name}</div>
                                  <div className="text-xs text-muted-foreground">{p.sku || '—'} • {p.unit || 'piece'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2">{p.category?.name || '—'}</td>
                            <td className="px-4 py-2 text-right">{p.stock}</td>
                            <td className="px-4 py-2 text-right">{displayPrice(p.pricing)}</td>
                            <td className="px-4 py-2 text-right">
                              <button onClick={() => handleDelete(p._id)} className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 px-2 py-1 rounded-md hover:bg-red-50">
                                <Trash2 className="size-4"/> Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Create modal */}
            {showCreate && (
              <div className="fixed inset-0 z-40 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/40" onClick={() => setShowCreate(false)} />
                <div className="relative z-50 w-full max-w-2xl rounded-lg border bg-white shadow-lg">
                  <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h3 className="font-semibold">Create product</h3>
                    <button onClick={() => setShowCreate(false)} className="p-1 rounded hover:bg-accent/60"><X className="size-4"/></button>
                  </div>
                  <form onSubmit={handleCreateProduct} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm">Name</label>
                      <Input required value={createForm.name} onChange={e => setCreateForm(f => ({...f, name: e.target.value}))} />
                    </div>
                    <div>
                      <label className="text-sm">SKU</label>
                      <Input value={createForm.sku} onChange={e => setCreateForm(f => ({...f, sku: e.target.value}))} />
                    </div>
                    <div>
                      <label className="text-sm">Category</label>
                      <select value={createForm.category} onChange={e => setCreateForm(f => ({...f, category: e.target.value}))} className="h-9 w-full rounded-md border bg-white px-3 text-sm">
                        <option value="">— Select —</option>
                        {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm">Stock</label>
                      <Input type="number" min={0} value={createForm.stock} onChange={e => setCreateForm(f => ({...f, stock: Number(e.target.value)}))} />
                    </div>
                    <div>
                      <label className="text-sm">Unit</label>
                      <Input value={createForm.unit} onChange={e => setCreateForm(f => ({...f, unit: e.target.value}))} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm">Description</label>
                      <textarea value={createForm.description} onChange={e => setCreateForm(f => ({...f, description: e.target.value}))} className="w-full h-24 rounded-md border px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-sm">Price per hour</label>
                      <Input type="number" min={0} step="0.01" value={createForm.pricePerHour} onChange={e => setCreateForm(f => ({...f, pricePerHour: e.target.value}))} />
                    </div>
                    <div>
                      <label className="text-sm">Price per day</label>
                      <Input type="number" min={0} step="0.01" value={createForm.pricePerDay} onChange={e => setCreateForm(f => ({...f, pricePerDay: e.target.value}))} />
                    </div>
                    <div>
                      <label className="text-sm">Price per week</label>
                      <Input type="number" min={0} step="0.01" value={createForm.pricePerWeek} onChange={e => setCreateForm(f => ({...f, pricePerWeek: e.target.value}))} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm">Image (required)</label>
                      <input type="file" accept="image/*" onChange={e => setCreateForm(f => ({...f, image: e.target.files?.[0] || null}))} className="block text-sm" />
                    </div>
                    <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setShowCreate(false)} className="px-3 py-2 rounded-md border">Cancel</button>
                      <Button disabled={creating} type="submit" className="btn-gradient">{creating ? 'Creating…' : 'Create product'}</Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
