import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '@/lib/api'

export default function ApprovedQuotationsProductsPage() {
  const [sp, setSp] = useSearchParams()
  const initialCustomerId = sp.get('customerId') || ''
  const userJson = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null
  const user = userJson ? JSON.parse(userJson) as { role?: string; name?: string } : null
  const role = user?.role

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quotes, setQuotes] = useState<any[]>([])
  const [customerId, setCustomerId] = useState<string>(initialCustomerId)

  const load = async () => {
    if (role !== 'end_user') return
    try {
      setLoading(true)
      setError(null)
      const res = await api.get('/api/v1/quotation/getAllUserQuotations')
      setQuotes(res.data?.data || [])
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load quotations')
      setQuotes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [role])

  const items = useMemo(() => {
    const approved = quotes.filter((q: any) => q.status === 'approved')
    const flat: Array<any> = []
    approved.forEach((q: any) => {
      (q.items || []).forEach((it: any) => flat.push({ q, it }))
    })
    return customerId ? flat.filter(row => (row.q.createdBy?._id || row.q.createdBy) === customerId) : flat
  }, [quotes])

  const customers = useMemo(() => {
    const set = new Map<string, string>()
    quotes.filter((q: any) => q.status === 'approved').forEach((q: any) => {
      const id = q.createdBy?._id || q.createdBy
      const name = q.createdBy?.name || 'Customer'
      if (id) set.set(id, name)
    })
    return Array.from(set.entries()).map(([id, name]) => ({ id, name }))
  }, [quotes])

  const onSelectCustomer = (id: string) => {
    setCustomerId(id)
    const next = new URLSearchParams(sp)
    if (id) {
      next.set('customerId', id)
    } else {
      next.delete('customerId')
    }
    setSp(next, { replace: true })
  }

  if (role !== 'end_user') {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-xl font-semibold mb-2">Approved quotations - products</h1>
        <div className="text-sm text-muted-foreground">This page is available to vendors only.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Approved quotation products</h1>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Customer</label>
            <select value={customerId} onChange={(e) => onSelectCustomer(e.target.value)} className="text-sm border rounded px-2 py-1 bg-white">
              <option value="">All</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={load} disabled={loading} className="text-sm border rounded px-3 py-1.5 bg-white hover:bg-accent/50">{loading ? 'Refreshing…' : 'Refresh'}</button>
          </div>
        </div>

        {error && <div className="text-sm text-destructive mb-3">{error}</div>}

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground">No approved quotation items.</div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-accent/30">
                  <th className="text-left p-2">Quotation</th>
                  <th className="text-left p-2">Customer</th>
                  <th className="text-left p-2">Product</th>
                  <th className="text-left p-2">Qty</th>
                  <th className="text-left p-2">Unit</th>
                  <th className="text-left p-2">Unit Price</th>
                  <th className="text-left p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map(({ q, it }, idx) => (
                  <tr key={`${q._id}-${idx}`} className="border-b">
                    <td className="p-2">#{String(q._id).slice(-6)}</td>
                    <td className="p-2">{q.createdBy?.name || 'Customer'}</td>
                    <td className="p-2">{it.product?.name || 'Product'}</td>
                    <td className="p-2">{it.quantity}</td>
                    <td className="p-2">{it.unit}</td>
                    <td className="p-2">₹{it.unitPrice}</td>
                    <td className="p-2">₹{it.totalPrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
