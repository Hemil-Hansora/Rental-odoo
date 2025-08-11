import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import CustomerNavbar from '@/components/customer/CustomerNavbar'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

function inr(n: number | undefined | null) {
  const v = typeof n === 'number' ? n : 0
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v)
}

export default function ReviewOrderPage() {
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const orderId = sp.get('orderId') || undefined

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [order, setOrder] = useState<any | null>(null)
  const [invoice, setInvoice] = useState<any | null>(null)
  const [paying, setPaying] = useState(false)

  // ✅ CORRECTED load function
  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      setOrder(null) // Reset state on new load
      setInvoice(null)

      let ord = null;
      
      if (orderId) {
        // --- 1. If an orderId is in the URL, fetch that specific order ---
        // Note: Adjust the endpoint '/api/v1/order/${orderId}' if yours is different
        const res = await api.get(`/api/v1/order/${orderId}`);
        ord = res.data?.data || null;
      } else {
        // --- 2. Fallback: if no orderId, pick the most recent order ---
        const r = await api.get('/api/v1/order/myOrder');
        const list = (r.data?.data ?? []) as any[];
        ord = list?.[0] || null;
      }
      
      setOrder(ord);

      if (ord) {
        // Try to find an invoice for this order
        try {
          const ir = await api.get('/api/v1/invoice');
          const all = (ir.data?.data ?? []) as any[];
          const inv = all.find(x => (x.order?._id || x.order) === ord._id);
          setInvoice(inv || null);
        } catch { /* ignore */ }
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load order');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load() }, [orderId]);

  const totals = useMemo(() => {
    if (!order) return { subtotal: 0, tax: 0, total: 0 };
    const subtotal = (order.items || []).reduce((s: number, it: any) => s + (it.totalPrice || 0), 0);
    const tax = order.tax ?? Math.round(subtotal * 0.18);
    const total = order.total ?? subtotal + tax;
    return { subtotal, tax, total };
  }, [order]);

  const ensureInvoice = async () => {
    if (invoice && invoice._id) return invoice
    if (!order?._id) throw new Error('Missing order id')
    try {
      const r = await api.post('/api/v1/invoice/from-order', { orderId: order._id })
      const inv = r.data?.data
      setInvoice(inv)
      return inv
    } catch (e: any) {
      const status = e?.response?.status
      if (status === 409) {
        const ir = await api.get('/api/v1/invoice')
        const all = (ir.data?.data ?? []) as any[]
        const inv = all.find(x => (x.order?._id || x.order) === order._id)
        if (!inv) throw e
        setInvoice(inv)
        return inv
      }
      throw e
    }
  }

  const onPayNow = async () => {
    try {
      setPaying(true)
      const inv = await ensureInvoice()
      const due = inv?.dueAmount ?? (inv?.amount - (inv?.paid || 0))
      if (!due || due <= 0) {
        alert('Invoice is already paid')
        return
      }
      const txId = `rzp_test_${Date.now()}`
      await api.post('/api/v1/payment', {
        invoiceId: inv._id,
        amount: due,
        method: 'razorPay',
        transactionId: txId,
        currency: 'INR',
      })
      await load()
      alert('Payment recorded successfully')
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to process payment')
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <CustomerNavbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Review order</h1>
          {order?._id && (
            <div className="text-sm text-muted-foreground">Order #{String(order._id).slice(-6)}</div>
          )}
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : error ? (
          <div className="text-sm text-destructive">{error}</div>
        ) : !order ? (
          <div className="text-sm text-muted-foreground">No order found.</div>
        ) : (
          <div className="space-y-6">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Status: <span className="uppercase">{order.status}</span></div>
                  <div className="text-sm text-muted-foreground">Pickup: {new Date(order.pickup?.scheduledAt).toLocaleString()} • Return: {new Date(order.return?.scheduledAt).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm">Subtotal: {inr(totals.subtotal)}</div>
                  <div className="text-sm">Tax: {inr(totals.tax)}</div>
                  <div className="text-base font-semibold">Total: {inr(totals.total)}</div>
                </div>
              </div>
            </Card>

            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-accent/30">
                    <th className="text-left p-2">Item</th>
                    <th className="text-left p-2">Qty</th>
                    <th className="text-left p-2">Unit</th>
                    <th className="text-left p-2">Unit Price</th>
                    <th className="text-left p-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((it: any, idx: number) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2">{it.product?.name || 'Product'}</td>
                      <td className="p-2">{it.quantity}</td>
                      <td className="p-2">{it.unit}</td>
                      <td className="p-2">{inr(it.unitPrice)}</td>
                      <td className="p-2">{inr(it.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                {invoice ? (
                  <>Invoice #{invoice.invoiceNumber} • Due: {inr(invoice.dueAmount)}</>
                ) : (
                  <>No invoice yet.</>
                )}
              </div>
              <div className="inline-flex gap-2">
                <Button variant="outline" onClick={() => navigate('/customer-dashboard#shop')}>Continue shopping</Button>
                <Button onClick={onPayNow} disabled={paying || !order}>{paying ? 'Processing…' : 'Pay now'}</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}