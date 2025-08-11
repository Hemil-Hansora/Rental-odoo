import { useEffect, useMemo, useState } from 'react'
import RentalOrders from './RentalOrders'
import { useNavigate } from 'react-router-dom'
import { Package, ShoppingBag, User2, ChevronDown, LogOut } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'

function OverviewSection({ name, role }: { name?: string; role?: 'customer' | 'end_user' | string }) {
  const [loading, setLoading] = useState({ quotes: false, orders: false })
  const [quotes, setQuotes] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const formatINR = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0)

  useEffect(() => {
    let mounted = true
    const loadQuotes = async () => {
      try {
        setLoading(prev => ({ ...prev, quotes: true }))
        const res = await api.get('/api/v1/quotation/getAllUserQuotations')
        const list = res.data?.data || []
        if (mounted) setQuotes(Array.isArray(list) ? list : [])
      } catch (e: any) {
        if (mounted) setError(e?.response?.data?.message || 'Failed to load quotations')
      } finally {
        if (mounted) setLoading(prev => ({ ...prev, quotes: false }))
      }
    }
    const loadOrdersIfCustomer = async () => {
      if (role !== 'customer') return
      try {
        setLoading(prev => ({ ...prev, orders: true }))
        const res = await api.get('/api/v1/order/myOrder')
        const list = res.data?.data || []
        if (mounted) setOrders(Array.isArray(list) ? list : [])
      } catch (e: any) {
        if (mounted) setError(e?.response?.data?.message || 'Failed to load orders')
      } finally {
        if (mounted) setLoading(prev => ({ ...prev, orders: false }))
      }
    }
    if (role === 'end_user') loadQuotes()
    loadOrdersIfCustomer()
    return () => { mounted = false }
  }, [role])

  const activeStatuses = useMemo(() => new Set(['reserved','ready_for_pickup','out_for_delivery','in_use']), [])

  const metrics = useMemo(() => {
    const quotationsCount = quotes.length

    let activeRentalsCount = 0
    let revenue = 0

    if (role === 'customer') {
      const activeOrders = orders.filter(o => activeStatuses.has(o.status))
      activeRentalsCount = activeOrders.length
      // Revenue here is total spent (sum totals of all orders)
      revenue = orders.reduce((sum, o) => sum + (o.paidAmount || o.total || 0), 0)
    } else {
      // For end_user (vendor), we use converted quotations as active rentals proxy
      const convertedQuotes = quotes.filter(q => q.status === 'converted')
      activeRentalsCount = convertedQuotes.length
      revenue = convertedQuotes.reduce((sum, q) => sum + (q.total || 0), 0)
    }

    return { quotationsCount, activeRentalsCount, revenue }
  }, [quotes, orders, role, activeStatuses])

  const recentQuotes = useMemo(() => quotes.slice(0, 5), [quotes])
  const recentActive = useMemo(() => {
    if (role === 'customer') return orders.filter(o => activeStatuses.has(o.status)).slice(0, 5)
    return quotes.filter(q => q.status === 'converted').slice(0, 5)
  }, [orders, quotes, role, activeStatuses])

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Overview</h2>
      <p className="text-sm text-muted-foreground">Welcome{name ? `, ${name}` : ''}. Here’s your latest activity.</p>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border rounded-md p-4">
          <div className="text-sm text-muted-foreground">Quotations</div>
          <div className="text-2xl font-bold">{loading.quotes ? '…' : metrics.quotationsCount}</div>
        </div>
        <div className="border rounded-md p-4">
          <div className="text-sm text-muted-foreground">Active Rentals</div>
          <div className="text-2xl font-bold">{(role==='customer' && loading.orders) || loading.quotes ? '…' : metrics.activeRentalsCount}</div>
        </div>
        <div className="border rounded-md p-4">
          <div className="text-sm text-muted-foreground">{role==='customer' ? 'Total Spent' : 'Revenue'}</div>
          <div className="text-2xl font-bold">{(role==='customer' && loading.orders) || loading.quotes ? '…' : formatINR(metrics.revenue)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border rounded-md p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Recent Quotations</h3>
            <span className="text-xs text-muted-foreground">showing {recentQuotes.length} of {quotes.length}</span>
          </div>
          <div className="divide-y">
            {recentQuotes.length === 0 && (
              <div className="text-sm text-muted-foreground py-4">No quotations</div>
            )}
            {recentQuotes.map((q) => (
              <div key={q._id} className="py-3 text-sm flex items-center justify-between">
                <div>
                  <div className="font-medium">Quote #{String(q._id).slice(-6)}</div>
                  <div className="text-xs text-muted-foreground">{role==='customer' ? (q.vendor?.name || 'Vendor') : (q.createdBy?.name || 'Customer')}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatINR(q.total || 0)}</div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">{q.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border rounded-md p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Active Rentals</h3>
            <span className="text-xs text-muted-foreground">showing {recentActive.length}</span>
          </div>
          <div className="divide-y">
            {recentActive.length === 0 && (
              <div className="text-sm text-muted-foreground py-4">No active rentals</div>
            )}
            {role === 'customer' ? (
              recentActive.map((o: any) => (
                <div key={o._id} className="py-3 text-sm flex items-center justify-between">
                  <div>
                    <div className="font-medium">Order #{String(o._id).slice(-6)}</div>
                    <div className="text-xs text-muted-foreground">Items: {o.items?.length || 0}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatINR(o.total || 0)}</div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">{o.status}</div>
                  </div>
                </div>
              ))
            ) : (
              recentActive.map((q: any) => (
                <div key={q._id} className="py-3 text-sm flex items-center justify-between">
                  <div>
                    <div className="font-medium">Quote #{String(q._id).slice(-6)}</div>
                    <div className="text-xs text-muted-foreground">{q.createdBy?.name || 'Customer'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatINR(q.total || 0)}</div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">converted</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductsSection() {
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [editing, setEditing] = useState<null | any>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    sku: '',
    description: '',
    stock: 0,
    unit: 'piece',
    pricePerHour: '',
    pricePerDay: '',
    pricePerWeek: '',
  })
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    sku: '',
    description: '',
    stock: 0,
    unit: 'piece',
    pricePerHour: '',
    pricePerDay: '',
    pricePerWeek: '',
    image: null as File | null,
  })
  const [createPreview, setCreatePreview] = useState<string | null>(null)

  const loadProducts = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/v1/product/my-products', { params: { limit: 50 } })
      const list = res.data?.data?.products || []
      setProducts(list)
    } catch (e) {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProducts() }, [])

  const openEdit = (p: any) => {
    setEditing(p)
    setForm({
      name: p.name || '',
      sku: p.sku || '',
      description: p.description || '',
      stock: p.stock || 0,
      unit: p.unit || 'piece',
      pricePerHour: p?.pricing?.pricePerHour ? String(p.pricing.pricePerHour) : '',
      pricePerDay: p?.pricing?.pricePerDay ? String(p.pricing.pricePerDay) : '',
      pricePerWeek: p?.pricing?.pricePerWeek ? String(p.pricing.pricePerWeek) : '',
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return
    try {
      await api.delete(`/api/v1/product/delete/${id}`)
      setProducts(prev => prev.filter(p => p._id !== id))
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to delete product'
      alert(msg)
    }
  }

  const handleSave = async () => {
    if (!editing) return
    try {
      setSaving(true)
      const payload: any = {
        name: form.name,
        sku: form.sku || undefined,
        description: form.description || undefined,
        stock: Number(form.stock),
        unit: form.unit,
        pricing: {
          pricePerHour: form.pricePerHour ? Number(form.pricePerHour) : undefined,
          pricePerDay: form.pricePerDay ? Number(form.pricePerDay) : undefined,
          pricePerWeek: form.pricePerWeek ? Number(form.pricePerWeek) : undefined,
        },
      }
      await api.patch(`/api/v1/product/update/${editing._id}`, payload)
      setEditing(null)
      await loadProducts()
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to update product'
      alert(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
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
      if (createForm.description) fd.append('description', createForm.description)
      fd.append('stock', String(createForm.stock))
      if (createForm.unit) fd.append('unit', createForm.unit)
      if (createForm.pricePerHour) fd.append('pricing.pricePerHour', createForm.pricePerHour)
      if (createForm.pricePerDay) fd.append('pricing.pricePerDay', createForm.pricePerDay)
      if (createForm.pricePerWeek) fd.append('pricing.pricePerWeek', createForm.pricePerWeek)
      if (createForm.image) fd.append('images', createForm.image)

      await api.post('/api/v1/product/create-product', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setShowCreate(false)
      setCreateForm({ name: '', sku: '', description: '', stock: 0, unit: 'piece', pricePerHour: '', pricePerDay: '', pricePerWeek: '', image: null })
      setCreatePreview(null)
      await loadProducts()
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to create product'
      alert(msg)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">My Products</h2>
        <Button onClick={() => setShowCreate(true)}>Add Product</Button>
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : products.length === 0 ? (
        <div className="text-sm text-muted-foreground">No products found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <div key={p._id} className="border rounded-md p-4 space-y-2">
              {p?.images?.[0] && (
                <img src={p.images[0]} alt={p.name} className="w-full h-32 object-cover rounded" />
              )}
              <div className="font-medium truncate" title={p.name}>{p.name}</div>
              <div className="text-xs text-muted-foreground">Stock: {p.stock}</div>
              <div className="text-xs text-muted-foreground">Unit: {p.unit || 'piece'}</div>
              <div className="text-sm font-semibold">
                {p?.pricing?.pricePerDay ? `₹${p.pricing.pricePerDay}/day` : p?.pricing?.pricePerWeek ? `₹${p.pricing.pricePerWeek}/wk` : p?.pricing?.pricePerHour ? `₹${p.pricing.pricePerHour}/hr` : '—'}
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={() => openEdit(p)}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(p._id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditing(null)} />
          <div className="relative z-50 bg-white w-full max-w-lg rounded-md shadow p-6 space-y-4">
            <h3 className="text-lg font-semibold">Edit Product</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="stock">Stock</Label>
                <Input id="stock" type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))} />
              </div>
              <div>
                <Label htmlFor="unit">Unit</Label>
                <Input id="unit" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="pph">Price / Hour</Label>
                <Input id="pph" type="number" value={form.pricePerHour} onChange={e => setForm(f => ({ ...f, pricePerHour: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="ppd">Price / Day</Label>
                <Input id="ppd" type="number" value={form.pricePerDay} onChange={e => setForm(f => ({ ...f, pricePerDay: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="ppw">Price / Week</Label>
                <Input id="ppw" type="number" value={form.pricePerWeek} onChange={e => setForm(f => ({ ...f, pricePerWeek: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCreate(false)} />
          <div className="relative z-50 bg-white w-full max-w-lg rounded-md shadow p-6 space-y-4">
            <h3 className="text-lg font-semibold">Add Product</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="c-name">Name</Label>
                  <Input id="c-name" value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div>
                  <Label htmlFor="c-sku">SKU</Label>
                  <Input id="c-sku" value={createForm.sku} onChange={e => setCreateForm(f => ({ ...f, sku: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="c-desc">Description</Label>
                  <Input id="c-desc" value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="c-stock">Stock</Label>
                  <Input id="c-stock" type="number" value={createForm.stock} onChange={e => setCreateForm(f => ({ ...f, stock: Number(e.target.value) }))} required />
                </div>
                <div>
                  <Label htmlFor="c-unit">Unit</Label>
                  <Input id="c-unit" value={createForm.unit} onChange={e => setCreateForm(f => ({ ...f, unit: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="c-pph">Price / Hour</Label>
                  <Input id="c-pph" type="number" value={createForm.pricePerHour} onChange={e => setCreateForm(f => ({ ...f, pricePerHour: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="c-ppd">Price / Day</Label>
                  <Input id="c-ppd" type="number" value={createForm.pricePerDay} onChange={e => setCreateForm(f => ({ ...f, pricePerDay: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="c-ppw">Price / Week</Label>
                  <Input id="c-ppw" type="number" value={createForm.pricePerWeek} onChange={e => setCreateForm(f => ({ ...f, pricePerWeek: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="c-image">Image</Label>
                  <Input id="c-image" type="file" accept="image/*" onChange={e => {
                    const file = e.target.files?.[0] || null
                    setCreateForm(f => ({ ...f, image: file || null }))
                    if (file) setCreatePreview(URL.createObjectURL(file)); else setCreatePreview(null)
                  }} />
                  {createPreview && (
                    <img src={createPreview} alt="Preview" className="mt-2 w-full h-32 object-cover rounded" />
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button type="submit" disabled={creating}>{creating ? 'Creating…' : 'Create'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function UserDashboard() {
  const navigate = useNavigate()
  const userJson = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null
  const user = userJson ? JSON.parse(userJson) : null

  useEffect(() => {
    if (!user) navigate('/login', { replace: true })
  }, [])

  // Page state
  const [showMenu, setShowMenu] = useState(false)
  const [activeSection, setActiveSection] = useState<'overview'|'products'|'rentals'>('overview')
  // Note: Overview/Products sections are temporarily hidden; only Rental Orders is shown.

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
            <button onClick={() => setActiveSection('rentals')} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md ${activeSection==='rentals' ? 'bg-accent/60' : 'hover:bg-accent/40'}`}>
              <Package className="size-4"/> Rental Orders
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
  {activeSection === 'overview' && <OverviewSection name={user?.name} role={user?.role} />}
        {activeSection === 'products' && <ProductsSection />}
        {activeSection === 'rentals' && <RentalOrders />}
      </div>
    </div>
  )
}
