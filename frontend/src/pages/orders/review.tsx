import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerNavbar from '@/components/customer/CustomerNavbar';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

function inr(n: number | undefined | null) {
  const v = typeof n === 'number' ? n : 0;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
}

const fmtDate = (d?: string | number | Date) => {
  if (!d) return '-'
  try { return new Date(d).toLocaleString() } catch { return '-' }
}

export default function ReviewOrderPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- NEW: State to hold the list of quotations and the selected one ---
  const [approvedQuotations, setApprovedQuotations] = useState<any[]>([]);
  const [selectedQuotation, setSelectedQuotation] = useState<any | null>(null);
  
  const [invoice, setInvoice] = useState<any | null>(null);
  const [paying, setPaying] = useState(false);
  const [productNames, setProductNames] = useState<Record<string, string>>({})

  const loadQuotations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // --- MODIFIED: Fetch the entire list of approved quotations ---
      const res = await api.get(`/api/v1/quotation/my-approved`);
      const quotations = res.data?.data || [];
      setApprovedQuotations(quotations);

    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load quotations');
      setApprovedQuotations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadQuotations() }, []);

  // When a quotation is selected, try to find its invoice (best-effort; may be null until you pay)
  useEffect(() => {
    if (!selectedQuotation) return;
    const findInvoice = async () => {
        // This logic can be improved by creating a dedicated endpoint
        // to find an invoice by order/quotation ID.
        try {
            const res = await api.get('/api/v1/invoice');
            const inv = (res.data?.data || []).find((x: any) => x.quotation === selectedQuotation._id);
            setInvoice(inv || null);
        } catch {}
    };
    findInvoice();
  }, [selectedQuotation]);

  // Enrich selected quotation items with product names if only IDs are present
  useEffect(() => {
    const enrichNames = async () => {
      if (!selectedQuotation?.items) return
      const missingIds = Array.from(new Set(
        (selectedQuotation.items as any[])
          .map(it => (typeof it.product === 'string' ? it.product : it.product?._id))
          .filter((id: any) => typeof id === 'string' && !productNames[id])
      )) as string[]
      if (missingIds.length === 0) return
  try {
        const results = await Promise.allSettled(
          missingIds.map(id => api.get(`/api/v1/product/get-product/${id}`))
        )
        const updates: Record<string, string> = {}
        results.forEach((res, idx) => {
          if (res.status === 'fulfilled') {
            const data = (res.value.data?.data) as any
            if (data?._id) updates[missingIds[idx]] = data.name || 'Product'
          }
        })
        if (Object.keys(updates).length) setProductNames(prev => ({ ...prev, ...updates }))
  } finally {}
    }
    enrichNames()
  }, [selectedQuotation, productNames])


  const handleConvertToOrderAndPay = async () => {
      if (!selectedQuotation) return;
      try {
          setPaying(true);
          // 1. Convert Quotation to Order
          const orderRes = await api.post('/api/v1/order/create-quotation', {
              quotationId: selectedQuotation._id,
              deliveryMethod: 'pickup', // Or get this from the user
          });
          const order = orderRes.data.data;
          
          // 2. Create Invoice from the new Order
          const invoiceRes = await api.post('/api/v1/invoice/from-order', { orderId: order._id });
          const inv = invoiceRes.data.data;

          // 3. Payment via Razorpay using quotation total as amount
          const amountINR = Number(selectedQuotation.total) || 0;
          if (amountINR <= 0) {
            alert('Invalid amount to pay');
            return;
          }
          const Razorpay = (window as any).Razorpay;
          const key = (import.meta as any)?.env?.VITE_RAZORPAY_KEY_ID || (window as any).__RAZORPAY_KEY_ID__ || 'rzp_test_R5dGGMQfCUs4Rf';
          if (!Razorpay) {
            // Fallback: record payment directly if SDK isn't available
            const txId = `rzp_test_${Date.now()}`;
            await api.post('/api/v1/payment', {
              invoiceId: inv._id,
              amount: amountINR,
              method: 'razorPay',
              transactionId: txId,
              currency: 'INR',
            });
            alert('Payment recorded.');
            navigate('/customer-dashboard');
            return;
          }

          const userJson = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null
          const user = userJson ? JSON.parse(userJson) as { name?: string; email?: string; phone?: string } : {}

          const rzp = new Razorpay({
            key,
            amount: Math.round(amountINR * 100), // paise
            currency: 'INR',
            name: 'RentalHub',
            description: `Payment for quotation #${String(selectedQuotation._id).slice(-6)}`,
            prefill: {
              name: user?.name || '',
              email: (user as any)?.email || '',
              contact: (user as any)?.phone || '',
            },
            handler: async (resp: any) => {
              try {
                const transactionId = resp?.razorpay_payment_id || `rzp_test_${Date.now()}`;
                await api.post('/api/v1/payment', {
                  invoiceId: inv._id,
                  amount: amountINR,
                  method: 'razorPay',
                  transactionId,
                  currency: 'INR',
                });
                alert('Payment successful! Your order is confirmed.');
                navigate('/customer-dashboard');
              } catch (e: any) {
                alert(e?.response?.data?.message || 'Payment succeeded but recording failed');
              } finally {
                setPaying(false);
              }
            },
            modal: { ondismiss: () => setPaying(false) },
            theme: { color: '#7c3aed' },
          });
          rzp.on('payment.failed', () => setPaying(false));
          rzp.open();

      } catch (e: any) {
          alert(e?.response?.data?.message || 'Failed to process payment');
      } finally {
          setPaying(false);
      }
  };
  
  return (
    <div className="min-h-screen bg-background">
      <CustomerNavbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold">Review Your Approved Quotations</h1>
          <p className="text-sm text-muted-foreground mt-1">Select a quotation to see details and complete payment.</p>
        </div>

        {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {error && <div className="text-sm text-destructive">{error}</div>}

        {/* --- NEW: UI to display the list of selectable quotations --- */}
        {!loading && !selectedQuotation && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {approvedQuotations.length > 0 ? (
              approvedQuotations.map((q) => (
                <Card key={q._id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{q.vendor?.name || 'Vendor'}</div>
                      <div className="text-xs text-muted-foreground">Created: {new Date(q.createdAt).toLocaleDateString()}</div>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 text-[11px] px-2 py-0.5 border border-emerald-200">Approved</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-lg font-semibold">{inr(q.total)}</div>
                    <Button size="sm" onClick={() => setSelectedQuotation(q)}>Review & Pay</Button>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-6 col-span-full text-center text-sm text-muted-foreground">You have no approved quotations to review. <Button variant="link" onClick={() => navigate('/dashboard/customer#shop')}>Go shop</Button></Card>
            )}
          </div>
        )}

        {/* --- MODIFIED: The detailed view now uses the `selectedQuotation` state --- */}
        {selectedQuotation && (
          <div className="space-y-6">
            <Button variant="outline" size="sm" onClick={() => setSelectedQuotation(null)}>← Back to List</Button>
            <Card className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="font-medium">Vendor: {selectedQuotation.vendor?.name}</div>
                  <div className="text-xs text-muted-foreground">Quotation #{String(selectedQuotation._id).slice(-6)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    Pickup: {fmtDate(selectedQuotation.items?.[0]?.start)} • Return: {fmtDate(selectedQuotation.items?.[0]?.end)}
                  </div>
                  <div className="text-base font-semibold">Total: {inr(selectedQuotation.total)}</div>
                </div>
              </div>
            </Card>

            <div className="border rounded-md overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
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
                  {(selectedQuotation.items || []).map((it: any, idx: number) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2">{
                        typeof it.product === 'string'
                          ? (productNames[it.product] || 'Product')
                          : (it.product?.name || 'Product')
                      }</td>
                      <td className="p-2">{it.quantity}</td>
                      <td className="p-2">{it.unit}</td>
                      <td className="p-2">{inr(it.unitPrice)}</td>
                      <td className="p-2">{inr(it.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Invoice: {invoice?.invoiceNumber ? `#${invoice.invoiceNumber}` : 'To be generated'}</div>
                <div className="inline-flex gap-2">
                  <Button variant="outline" onClick={() => navigate('/dashboard/customer#shop')}>Continue Shopping</Button>
                  <Button onClick={handleConvertToOrderAndPay} disabled={paying}>{paying ? 'Processing…' : `Pay ${inr(selectedQuotation.total)} Now`}</Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
// import { useEffect, useMemo, useState } from 'react'
// import { useNavigate, useSearchParams } from 'react-router-dom'
// import CustomerNavbar from '@/components/customer/CustomerNavbar'
// import { api } from '@/lib/api'
// import { Button } from '@/components/ui/button'
// import { Card } from '@/components/ui/card'

// function inr(n: number | undefined | null) {
//   const v = typeof n === 'number' ? n : 0
//   return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v)
// }

// export default function ReviewOrderPage() {
//   const navigate = useNavigate()
//   const [sp] = useSearchParams()
//   const orderId = sp.get('orderId') || undefined

//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)
//   const [order, setOrder] = useState<any | null>(null)
//   const [invoice, setInvoice] = useState<any | null>(null)
//   const [paying, setPaying] = useState(false)

//   // ✅ CORRECTED load function
//   const load = async () => {
//     try {
//       setLoading(true)
//       setError(null)
//       setOrder(null) // Reset state on new load
//       setInvoice(null)

//       let ord = null;
      
//       if (orderId) {
//         // --- 1. If an orderId is in the URL, fetch that specific order ---
//         // Note: Adjust the endpoint '/api/v1/order/${orderId}' if yours is different
//         const res = await api.get(`/api/v1/quotation/my-approved`);
//         ord = res.data?.data || null;
//       } else {
//         // --- 2. Fallback: if no orderId, pick the most recent order ---
//         const r = await api.get('/api/v1/order/myOrder');
//         const list = (r.data?.data ?? []) as any[];
//         ord = list?.[0] || null;
//       }
      
//       setOrder(ord);

//       if (ord) {
//         // Try to find an invoice for this order
//         try {
//           const ir = await api.get('/api/v1/invoice');
//           const all = (ir.data?.data ?? []) as any[];
//           const inv = all.find(x => (x.order?._id || x.order) === ord._id);
//           setInvoice(inv || null);
//         } catch { /* ignore */ }
//       }
//     } catch (e: any) {
//       setError(e?.response?.data?.message || 'Failed to load order');
//       setOrder(null);
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => { load() }, [orderId]);

//   const totals = useMemo(() => {
//     if (!order) return { subtotal: 0, tax: 0, total: 0 };
//     const subtotal = (order.items || []).reduce((s: number, it: any) => s + (it.totalPrice || 0), 0);
//     const tax = order.tax ?? Math.round(subtotal * 0.18);
//     const total = order.total ?? subtotal + tax;
//     return { subtotal, tax, total };
//   }, [order]);

//   const ensureInvoice = async () => {
//     if (invoice && invoice._id) return invoice
//     if (!order?._id) throw new Error('Missing order id')
//     try {
//       const r = await api.post('/api/v1/invoice/from-order', { orderId: order._id })
//       const inv = r.data?.data
//       setInvoice(inv)
//       return inv
//     } catch (e: any) {
//       const status = e?.response?.status
//       if (status === 409) {
//         const ir = await api.get('/api/v1/invoice')
//         const all = (ir.data?.data ?? []) as any[]
//         const inv = all.find(x => (x.order?._id || x.order) === order._id)
//         if (!inv) throw e
//         setInvoice(inv)
//         return inv
//       }
//       throw e
//     }
//   }

//   const onPayNow = async () => {
//     try {
//       setPaying(true)
//       const inv = await ensureInvoice()
//       const due = inv?.dueAmount ?? (inv?.amount - (inv?.paid || 0))
//       if (!due || due <= 0) {
//         alert('Invoice is already paid')
//         return
//       }
//       const txId = `rzp_test_${Date.now()}`
//       await api.post('/api/v1/payment', {
//         invoiceId: inv._id,
//         amount: due,
//         method: 'razorPay',
//         transactionId: txId,
//         currency: 'INR',
//       })
//       await load()
//       alert('Payment recorded successfully')
//     } catch (e: any) {
//       alert(e?.response?.data?.message || 'Failed to process payment')
//     } finally {
//       setPaying(false)
//     }
//   }

//   return (
//     <div className="min-h-screen bg-background">
//       <CustomerNavbar />
//       <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         <div className="flex items-center justify-between mb-4">
//           <h1 className="text-2xl font-semibold">Review order</h1>
//           {order?._id && (
//             <div className="text-sm text-muted-foreground">Order #{String(order._id).slice(-6)}</div>
//           )}
//         </div>

//         {loading ? (
//           <div className="text-sm text-muted-foreground">Loading…</div>
//         ) : error ? (
//           <div className="text-sm text-destructive">{error}</div>
//         ) : !order ? (
//           <div className="text-sm text-muted-foreground">No order found.</div>
//         ) : (
//           <div className="space-y-6">
//             <Card className="p-4">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <div className="font-medium">Status: <span className="uppercase">{order.status}</span></div>
//                   <div className="text-sm text-muted-foreground">Pickup: {new Date(order.pickup?.scheduledAt).toLocaleString()} • Return: {new Date(order.return?.scheduledAt).toLocaleString()}</div>
//                 </div>
//                 <div className="text-right">
//                   <div className="text-sm">Subtotal: {inr(totals.subtotal)}</div>
//                   <div className="text-sm">Tax: {inr(totals.tax)}</div>
//                   <div className="text-base font-semibold">Total: {inr(totals.total)}</div>
//                 </div>
//               </div>
//             </Card>

//             <div className="border rounded-md overflow-x-auto">
//               <table className="w-full min-w-[640px] text-sm">
//                 <thead>
//                   <tr className="border-b bg-accent/30">
//                     <th className="text-left p-2">Item</th>
//                     <th className="text-left p-2">Qty</th>
//                     <th className="text-left p-2">Unit</th>
//                     <th className="text-left p-2">Unit Price</th>
//                     <th className="text-left p-2">Total</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {(order.items || []).map((it: any, idx: number) => (
//                     <tr key={idx} className="border-b">
//                       <td className="p-2">{it.product?.name || 'Product'}</td>
//                       <td className="p-2">{it.quantity}</td>
//                       <td className="p-2">{it.unit}</td>
//                       <td className="p-2">{inr(it.unitPrice)}</td>
//                       <td className="p-2">{inr(it.totalPrice)}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             <div className="flex items-center justify-between gap-3">
//               <div className="text-sm text-muted-foreground">
//                 {invoice ? (
//                   <>Invoice #{invoice.invoiceNumber} • Due: {inr(invoice.dueAmount)}</>
//                 ) : (
//                   <>No invoice yet.</>
//                 )}
//               </div>
//               <div className="inline-flex gap-2">
//                 <Button variant="outline" onClick={() => navigate('/customer-dashboard#shop')}>Continue shopping</Button>
//                 <Button onClick={onPayNow} disabled={paying || !order}>{paying ? 'Processing…' : 'Pay now'}</Button>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }