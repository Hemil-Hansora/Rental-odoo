import { useEffect, useState } from 'react'
import RentalOrders from './RentalOrders'
import { useNavigate } from 'react-router-dom'
import { Package, ShoppingBag, User2, ChevronDown, LogOut } from 'lucide-react'

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
            <RentalOrders />
      </div>
    </div>
  )
}
