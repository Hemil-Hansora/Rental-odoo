import React from 'react'
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { daysBetweenInclusive, calculateCouponDiscount } from '@/lib/utils'
import { api } from '@/lib/api'
import CustomerNavbar from '@/components/customer/CustomerNavbar'

// Lightweight tax/delivery model for demo
const TAX_RATE = 0.1 // 10%
const DELIVERY_METHODS = [
  { key: 'pickup', label: 'Pickup (free)', fee: 0 },
  { key: 'home', label: 'Home delivery (+₹50)', fee: 50 },
] as const

type StateShape = {
  name?: string
  unitPrice?: number
  unit?: string // '/day' | '/week' | '/hour'
  qty?: number
  from?: string
  to?: string
  coupon?: string
}

export default function QuotationSummaryPage() {
  const { state } = useLocation()
  const { id: productId } = useParams()
  const navigate = useNavigate()
  const parsed = (state || {}) as StateShape

  const [billingAddress, setBillingAddress] = React.useState('')
  const [deliveryAddress, setDeliveryAddress] = React.useState('')
  const [deliveryMethod, setDeliveryMethod] = React.useState<(typeof DELIVERY_METHODS)[number]['key']>('pickup')
  const [coupon, setCoupon] = React.useState(parsed.coupon || '')

  const qty = Math.max(1, Number(parsed.qty || 1))
  const unitPrice = Number(parsed.unitPrice || 0)
  const unit = parsed.unit || ''

  const days = React.useMemo(() => daysBetweenInclusive(parsed.from || '', parsed.to || ''), [parsed.from, parsed.to])

  const subTotal = React.useMemo(() => {
    if (days === 0) return 0
    if (unit === '/day') return unitPrice * days * qty
    if (unit === '/week') return unitPrice * Math.ceil(days/7) * qty
    if (unit === '/hour') return unitPrice * 24 * days * qty
    return unitPrice * qty
  }, [unitPrice, unit, days, qty])
  const deliveryFee = DELIVERY_METHODS.find(m => m.key === deliveryMethod)?.fee || 0
  const couponDiscount = calculateCouponDiscount(subTotal, coupon)
  const taxable = Math.max(0, subTotal - couponDiscount)
  const taxes = taxable * TAX_RATE
  const total = taxable + taxes + deliveryFee

  // Prefill invoice address from user profile
  React.useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get('/api/v1/user/profile')
        const user = res?.data?.data || {}
        const a = user?.address || {}
        const pieces = [user?.name, a.street, a.city, a.postalCode, a.state, a.country].filter(Boolean)
        if (pieces.length) setBillingAddress(pieces.join(', '))
      } catch (e) {
        // ignore; keep manual entry
      }
    }
    loadProfile()
  }, [])

  const [submitting, setSubmitting] = React.useState(false)
  const handleRequestQuotation = async () => {
    if (!productId) {
      alert('Missing product. Please go back and try again.')
      return
    }
    if (!parsed.from || !parsed.to) {
      alert('Please select rental dates on the product page.')
      return
    }
    try {
      setSubmitting(true)
      const startISO = new Date(`${parsed.from}T00:00:00`).toISOString()
      const endISO = new Date(`${parsed.to}T23:59:59`).toISOString()
      await api.post('/api/v1/quotation/create', {
        items: [
          {
            product: productId,
            quantity: qty,
            start: startISO,
            end: endISO,
          },
        ],
        notes: `Delivery: ${deliveryMethod}${deliveryAddress ? ` | Address: ${deliveryAddress}` : ''}`,
      })
      alert('Quotation request sent to the vendor.')
      navigate('/dashboard/customer#shop')
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to create quotation'
      alert(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <CustomerNavbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-sm text-muted-foreground mb-4">
          <Link to="/dashboard/customer#shop" className="hover:underline">Back to products</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Quotation summary</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Item</CardTitle>
                <CardDescription>Check item and rental period</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{parsed.name || 'Product'}</div>
                    <div className="text-sm text-muted-foreground">Qty: {qty}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Unit price</div>
                    <div className="font-semibold">₹{unitPrice.toFixed(2)}{unit}</div>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm">From</label>
                    <Input type="date" defaultValue={parsed.from || ''} disabled/>
                  </div>
                  <div>
                    <label className="text-sm">To</label>
                    <Input type="date" defaultValue={parsed.to || ''} disabled/>
                  </div>
                </div>
                {days > 0 && (
                  <div className="text-sm text-muted-foreground">Duration: {days} {days===1?'day':'days'}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Addresses</CardTitle>
                <CardDescription>Invoice and delivery information</CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">Invoice address</label>
                  <textarea className="w-full h-28 rounded-md border px-3 py-2 text-sm" value={billingAddress} onChange={e => setBillingAddress(e.target.value)} placeholder="Name, Street, City, ZIP" disabled/>
                </div>
                <div>
                  <label className="text-sm">Delivery address</label>
                  <textarea className="w-full h-28 rounded-md border px-3 py-2 text-sm" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder="Name, Street, City, ZIP"  required/>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm">Delivery method</label>
                  <select className="h-9 w-full rounded-md border bg-white px-3 text-sm" value={deliveryMethod} onChange={e => setDeliveryMethod(e.target.value as any)}>
                    {DELIVERY_METHODS.map(m => (
                      <option key={m.key} value={m.key}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: totals */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Bill summary</CardTitle>
                <CardDescription>Review charges before request</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm"><span>Subtotal</span><span>₹{subTotal.toFixed(2)}</span></div>
                <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                  <Input placeholder="Coupon code" value={coupon} onChange={e => setCoupon(e.target.value)} />
                  <Button variant="outline" onClick={() => setCoupon(coupon.trim())}>Apply</Button>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex items-center justify-between text-sm text-green-700"><span>Coupon discount</span><span>-₹{couponDiscount.toFixed(2)}</span></div>
                )}
                <div className="flex items-center justify-between text-sm"><span>Taxes (10%)</span><span>₹{taxes.toFixed(2)}</span></div>
                <div className="flex items-center justify-between text-sm"><span>Delivery</span><span>{deliveryFee === 0 ? 'Free' : `₹${deliveryFee.toFixed(2)}`}</span></div>
                <div className="border-t pt-2 flex items-center justify-between font-semibold"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
                <Button className="w-full" disabled={submitting} onClick={handleRequestQuotation}>{submitting ? 'Sending…' : 'Request quotation'}</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
