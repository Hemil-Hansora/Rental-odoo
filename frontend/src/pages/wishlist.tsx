import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { addToCart, getWishlist, removeFromWishlist, totalCartQty } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import CustomerNavbar from '@/components/customer/CustomerNavbar'

type APIProduct = {
  _id: string;
  name: string;
  images?: string[];
  pricing?: { pricePerDay?: number; pricePerWeek?: number; pricePerHour?: number };
}

export default function WishlistPage() {
  const navigate = useNavigate()
  const [ids, setIds] = useState<string[]>(getWishlist())
  const [items, setItems] = useState<APIProduct[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handler = () => setIds(getWishlist())
    window.addEventListener('wishlist:updated', handler)
    return () => window.removeEventListener('wishlist:updated', handler)
  }, [])

  useEffect(() => {
    const load = async () => {
      if (ids.length === 0) { setItems([]); return }
      try {
        setLoading(true)
        // Fetch each product by id in parallel
        const results = await Promise.all(ids.map(id => api.get(`/api/v1/product/get-product/${id}`).then(r => r.data?.data)))
        setItems(results.filter(Boolean))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [ids])

  const cartCount = useMemo(() => totalCartQty(), [])

  const moveToCart = (id: string) => {
    addToCart(id, 1)
    removeFromWishlist(id)
  }

  return (
    <div className="min-h-screen bg-background">
      <CustomerNavbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">My Wishlist</h1>
        <Button variant="outline" onClick={() => navigate('/cart')}>Cart ({cartCount})</Button>
      </div>
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-muted-foreground">Your wishlist is empty.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(p => {
            const img = p.images?.[0]
            const price = p.pricing?.pricePerDay ?? p.pricing?.pricePerWeek ?? p.pricing?.pricePerHour ?? 0
            const unit = p.pricing?.pricePerDay ? '/day' : p.pricing?.pricePerWeek ? '/week' : p.pricing?.pricePerHour ? '/hour' : ''
            return (
              <div key={p._id} className="border rounded-md p-4 space-y-2">
                {img ? <img src={img} className="w-full h-32 object-cover rounded" /> : <div className="w-full h-32 bg-muted rounded" />}
                <div className="font-medium truncate" title={p.name}>{p.name}</div>
                <div className="text-sm font-semibold">₹{price}{unit}</div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={() => moveToCart(p._id)}>Move to cart</Button>
                  <Button size="sm" variant="outline" onClick={() => navigate(`/product/${p._id}`)}>View</Button>
                  <Button size="sm" variant="destructive" onClick={() => removeFromWishlist(p._id)}>Remove</Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      </div>
    </div>
  )
}
