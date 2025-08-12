import React from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Share2, Minus, Plus, Calendar as CalendarIcon } from 'lucide-react'
import { daysBetweenInclusive, calculateCouponDiscount } from '@/lib/utils'
import CustomerNavbar from '@/components/customer/CustomerNavbar'

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

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = React.useState<APIProduct | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [qty, setQty] = React.useState(1)
  const [coupon, setCoupon] = React.useState('')
  const [couponApplied, setCouponApplied] = React.useState(false)
  const [dateFrom, setDateFrom] = React.useState<string>('')
  const [dateTo, setDateTo] = React.useState<string>('')

  React.useEffect(() => {
    const userJson = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null
    if (!userJson) {
      navigate('/login', { replace: true })
      return
    }
  }, [])

  React.useEffect(() => {
    if (!id) return
    const run = async () => {
      try {
        setLoading(true)
        setError(null)
  const res = await api.get(`/api/v1/product/get-product/${id}`)
        setProduct(res?.data?.data ?? null)
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load product')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [id])

  const showPrice = React.useMemo(() => {
    if (!product?.pricing) return { amount: 0, unit: '' }
    if (product.pricing.pricePerDay) return { amount: product.pricing.pricePerDay, unit: '/day' }
    if (product.pricing.pricePerWeek) return { amount: product.pricing.pricePerWeek, unit: '/week' }
    if (product.pricing.pricePerHour) return { amount: product.pricing.pricePerHour, unit: '/hour' }
    return { amount: 0, unit: '' }
  }, [product])

  const rentalDays = React.useMemo(() => daysBetweenInclusive(dateFrom, dateTo), [dateFrom, dateTo])

  const estimateCost = React.useMemo(() => {
    const p = product?.pricing
    if (!p) return 0
    const d = rentalDays
    if (d === 0) return 0
    let base = 0
    if (p.pricePerDay) {
      base = p.pricePerDay * d
    } else if (p.pricePerWeek) {
      const weeks = Math.ceil(d / 7)
      base = p.pricePerWeek * weeks
    } else if (p.pricePerHour) {
      base = p.pricePerHour * 24 * d
    }
    return base * qty
  }, [product, rentalDays, qty])

  const couponDiscount = React.useMemo(() => (!couponApplied ? 0 : calculateCouponDiscount(estimateCost, coupon)), [coupon, couponApplied, estimateCost])

  const totalEstimate = Math.max(0, estimateCost - couponDiscount)

  const formatINR = (n: number) => `₹${n.toFixed(2)}`

  const canProceed = Boolean(dateFrom && dateTo && rentalDays > 0)

  const onShare = async () => {
    const url = window.location.href
    try {
      // Prefer Web Share if available
      // @ts-ignore
      if (navigator.share) {
        // @ts-ignore
        await navigator.share({ title: product?.name || 'Product', url })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        alert('Link copied to clipboard')
      }
    } catch {}
  }

  return (
    <div className="min-h-screen bg-background">
      <CustomerNavbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumbs */}
        <div className="text-sm text-muted-foreground mb-4">
          <Link to="/dashboard/customer#shop" className="hover:underline">All products</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product?.name || (loading ? 'Loading…' : 'Product')}</span>
        </div>

        {/* Content */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            {product?.images?.[0] ? (
              <img src={product.images[0]} alt={product.name} className="w-full h-80 object-cover" />
            ) : (
              <div className="w-full h-80 bg-muted" />
            )}
          </Card>

          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-semibold">{product?.name || '—'}</h1>
              <div className="mt-1 text-sm text-muted-foreground">{product?.category?.name || ''}</div>
            </div>

            <div className="rounded-xl border bg-white p-4">
              <div className="text-2xl font-semibold">{formatINR(showPrice.amount)}{showPrice.unit}</div>
              <div className="mt-1 text-sm text-muted-foreground">For {qty} {qty === 1 ? 'item' : 'items'}: {formatINR((showPrice.amount || 0) * qty)}{showPrice.unit}</div>
              {rentalDays > 0 && (
                <div className="mt-1 text-sm text-muted-foreground">Estimated total for {rentalDays} {rentalDays===1?'day':'days'} × {qty}: {formatINR(totalEstimate)}</div>
              )}
              <div className="mt-3 grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm inline-flex items-center gap-1"><CalendarIcon className="size-4"/> From</label>
                  <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} required/>
                </div>
                <div>
                  <label className="text-sm inline-flex items-center gap-1"><CalendarIcon className="size-4"/> To</label>
                  <Input type="date" value={dateTo} min={dateFrom || undefined} onChange={e => setDateTo(e.target.value)} required/>
                </div>
              </div>
              {!canProceed && (
                <div className="mt-2 text-xs text-destructive">Please select valid From and To dates to continue.</div>
              )}

              <div className="mt-3 flex items-center gap-3">
                <div className="inline-flex items-center border rounded-md overflow-hidden">
                  <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))} className="px-2 py-1 hover:bg-accent/40" aria-label="Decrease">
                    <Minus className="size-4" />
                  </button>
                  <div className="px-3 py-1 text-sm min-w-10 text-center">{qty}</div>
                  <button type="button" onClick={() => setQty(q => Math.min(product?.stock || 99, q + 1))} className="px-2 py-1 hover:bg-accent/40" aria-label="Increase">
                    <Plus className="size-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3 grid sm:grid-cols-[1fr_auto] gap-2 items-center">
                <Input placeholder="Coupon code" value={coupon} onChange={e => { setCoupon(e.target.value); setCouponApplied(false); }} />
                <Button variant="outline" onClick={() => setCouponApplied(!!coupon.trim())}>{couponApplied ? 'Applied' : 'Apply coupon'}</Button>
              </div>

              {rentalDays > 0 && (
                <div className="mt-3 text-sm">
                  <div className="flex items-center justify-between"><span>Duration</span><span>{rentalDays} {rentalDays === 1 ? 'day' : 'days'}</span></div>
                  <div className="flex items-center justify-between"><span>Qty</span><span>{qty}</span></div>
                  <div className="flex items-center justify-between"><span>Estimated cost</span><span>{formatINR(estimateCost)}</span></div>
                  {couponApplied && couponDiscount > 0 && (
                    <div className="flex items-center justify-between text-green-700"><span>Coupon discount</span><span>-{formatINR(couponDiscount)}</span></div>
                  )}
                  <div className="border-t mt-2 pt-2 flex items-center justify-between font-semibold"><span>Total</span><span>{formatINR(totalEstimate)}</span></div>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2">
                <Button variant="outline" onClick={onShare} className="inline-flex items-center gap-2"><Share2 className="size-4"/> Share</Button>
                <Button
                  variant="outline"
                  disabled={!canProceed}
                  onClick={() => {
                    if (!canProceed) {
                      alert('Please select valid From and To dates');
                      return;
                    }
                    const unit = showPrice.amount || 0
                    const payload = {
                      name: product?.name,
                      unitPrice: unit,
                      unit: showPrice.unit,
                      qty,
                      from: dateFrom,
                      to: dateTo,
                      coupon,
                    }
                    navigate(`/quotation/${product?._id || 'item'}`,{ state: payload })
                  }}
                >
                  Quotation request
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
                <CardDescription>Details about this product</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{product?.description || 'No description provided.'}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Terms & conditions</CardTitle>
                <CardDescription>Please review before booking</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <p>• Valid ID may be required at pickup.</p>
                <p>• Late returns may incur extra charges.</p>
                <p>• Damage fees apply as per policy.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {loading && <div className="mt-6 text-sm text-muted-foreground">Loading product…</div>}
        {error && <div className="mt-6 text-sm text-destructive">{error}</div>}
      </div>
    </div>
  )
}
