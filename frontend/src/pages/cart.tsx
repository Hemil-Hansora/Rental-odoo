import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import type { CartItem } from '@/lib/utils'
import { getCart, updateCartQty, removeFromCart, clearCart } from '@/lib/utils'
import CustomerNavbar from '@/components/customer/CustomerNavbar'

// Minimal product data for display
type APIProduct = {
	_id: string;
	name: string;
	images?: string[];
	pricing?: { pricePerHour?: number; pricePerDay?: number; pricePerWeek?: number };
}

type Enriched = CartItem & { product?: APIProduct }

export default function CartPage() {
	const navigate = useNavigate()
	const [items, setItems] = useState<Enriched[]>([])
	const [loading, setLoading] = useState(false)
	const [submitting, setSubmitting] = useState(false)

	const refresh = async () => {
		const base = getCart()
		if (base.length === 0) { setItems([]); return }
		try {
			setLoading(true)
			const prods = await Promise.all(base.map(i => api.get(`/api/v1/product/get-product/${i.id}`).then(r => r.data?.data)))
			const merged: Enriched[] = base.map((i, idx) => ({ ...i, product: prods[idx] }))
			setItems(merged)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		refresh()
		const handler = () => refresh()
		window.addEventListener('cart:updated', handler)
		return () => window.removeEventListener('cart:updated', handler)
	}, [])

	const estTotal = useMemo(() => {
		return items.reduce((sum, i) => {
			const p = i.product
			const base = p?.pricing?.pricePerDay ?? p?.pricing?.pricePerWeek ?? p?.pricing?.pricePerHour ?? 0
			return sum + base * (i.qty || 1)
		}, 0)
	}, [items])

	const checkout = async () => {
		// Convert cart to quotation request per vendor on product detail page uses start/end; here we use a 1-day placeholder
		// For a minimal flow, navigate users to each product page to choose dates; or use a default date range now.
		const now = new Date()
		const end = new Date(now.getTime() + 24*60*60*1000)
		const payload = {
			items: items.map(i => ({ product: i.id, quantity: i.qty, start: now.toISOString(), end: end.toISOString() }))
		}
		try {
			setSubmitting(true)
			await api.post('/api/v1/quotation/create', payload)
			// API responds with array of quotations (one per vendor). Clear cart and send to Rentals.
			clearCart()
			navigate('/dashboard/customer?tab=rentals')
		} catch (e: any) {
			alert(e?.response?.data?.message || 'Failed to create quotation')
		} finally {
			setSubmitting(false)
		}
	}

		return (
			<div className="min-h-screen bg-background">
				<CustomerNavbar />
				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<h1 className="text-2xl font-semibold mb-6">My Cart</h1>
			{loading ? (
				<div className="text-sm text-muted-foreground">Loading…</div>
			) : items.length === 0 ? (
				<div className="text-sm text-muted-foreground">Your cart is empty.</div>
			) : (
				<>
					<div className="space-y-4">
						{items.map(it => {
							const p = it.product
							if (!p) return null
							const img = p.images?.[0]
							const price = p.pricing?.pricePerDay ?? p.pricing?.pricePerWeek ?? p.pricing?.pricePerHour ?? 0
							const unit = p.pricing?.pricePerDay ? '/day' : p.pricing?.pricePerWeek ? '/week' : p.pricing?.pricePerHour ? '/hour' : ''
							return (
								<div key={it.id} className="border rounded-md p-4 flex gap-4 items-center">
									{img ? <img src={img} className="w-24 h-20 object-cover rounded" /> : <div className="w-24 h-20 bg-muted rounded" />}
									<div className="flex-1">
										<div className="font-medium">{p.name}</div>
										<div className="text-sm text-muted-foreground">₹{price}{unit}</div>
									</div>
									<div className="flex items-center gap-2">
										<input type="number" min={1} value={it.qty} onChange={e => updateCartQty(it.id, Number(e.target.value))} className="w-20 border rounded px-2 py-1" />
										<Button variant="destructive" size="sm" onClick={() => removeFromCart(it.id)}>Remove</Button>
									</div>
								</div>
							)
						})}
					</div>
					<div className="mt-6 flex items-center justify-between border-t pt-4">
						<div className="text-lg font-semibold">Estimated total: ₹{estTotal.toFixed(0)}</div>
						<div className="flex gap-2">
							<Button variant="outline" onClick={() => clearCart()}>Clear cart</Button>
							<Button onClick={checkout} disabled={submitting}>{submitting ? 'Submitting…' : 'Request quotation'}</Button>
						</div>
					</div>
						</>
					)}
					</div>
				</div>
	)
}
