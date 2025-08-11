import { useEffect, useMemo, useState } from 'react'
import RentalOrders from './RentalOrders'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Search, Package, ShoppingBag, User2, ChevronDown, LogOut, IndianRupee, Plus, Trash2, X } from 'lucide-react'
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
  const [activeSection, setActiveSection] = useState<'overview'|'products'|'rentals'>('overview')

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
      api.get('/api/v1/product/my-products', { params: { search: prodQuery, limit: 50 } }),
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
    if (p.pricePerDay) return `₹${p.pricePerDay}/day`
    if (p.pricePerWeek) return `₹${p.pricePerWeek}/wk`
    if (p.pricePerHour) return `₹${p.pricePerHour}/hr`
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
            <RentalOrders />
      </div>
    </div>
  )
}
