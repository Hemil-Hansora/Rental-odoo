import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomerNavbar from '@/components/customer/CustomerNavbar'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type DeliveryMethod = 'pickup' | 'delivery'

export default function QuotationsListPage() {
	const navigate = useNavigate()
	const userJson = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null
	const user = userJson ? JSON.parse(userJson) as { role?: string } : null
	const role = user?.role

	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [rows, setRows] = useState<any[]>([])
	// Delivery modal state (customer flow)
	const [showModal, setShowModal] = useState(false)
	const [selectedId, setSelectedId] = useState<string | null>(null)
	const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('pickup')
	const [deliveryAddress, setDeliveryAddress] = useState('')
	const [submitting, setSubmitting] = useState(false)

	const load = async () => {
		try {
			setLoading(true)
			setError(null)
			const res = await api.get('/api/v1/quotation/getAllUserQuotations')
			setRows(res.data?.data || [])
		} catch (e: any) {
			setError(e?.response?.data?.message || 'Failed to load quotations')
			setRows([])
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => { load() }, [])

	const approve = async (id: string) => {
		try {
			await api.patch(`/api/v1/quotation/status/${id}`, { status: 'approved' })
			await load()
		} catch (e: any) { alert(e?.response?.data?.message || 'Failed to approve') }
	}
	const reject = async (id: string) => {
		try {
			await api.patch(`/api/v1/quotation/status/${id}`, { status: 'rejected' })
			await load()
		} catch (e: any) { alert(e?.response?.data?.message || 'Failed to reject') }
	}
	const cancel = async (id: string) => {
		if (!confirm('Cancel this quotation?')) return
		try {
			await api.patch(`/api/v1/quotation/status/${id}`, { status: 'cancelled_by_customer' })
			await load()
		} catch (e: any) { alert(e?.response?.data?.message || 'Failed to cancel') }
	}
	const delDraft = async (id: string) => {
		if (!confirm('Delete this draft quotation?')) return
		try {
			await api.delete(`/api/v1/quotation/deleteQuotation/${id}`)
			await load()
		} catch (e: any) { alert(e?.response?.data?.message || 'Failed to delete') }
	}

	const openDeliveryModal = (id: string) => {
		setSelectedId(id)
		setDeliveryMethod('pickup')
		setDeliveryAddress('')
		setShowModal(true)
	}

	const submitOrder = async () => {
		if (!selectedId) return
		if (deliveryMethod === 'delivery' && !deliveryAddress.trim()) {
			alert('Delivery address is required')
			return
		}
		try {
			setSubmitting(true)
			await api.post('/api/v1/order/create-quotation', {
				quotationId: selectedId,
				deliveryMethod,
				deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress.trim() : undefined,
			})
			setShowModal(false)
			navigate('/orders/review')
		} catch (e: any) {
			alert(e?.response?.data?.message || 'Failed to convert')
		} finally {
			setSubmitting(false)
		}
	}

	const list = useMemo(() => rows, [rows])

	return (
		<div className="min-h-screen bg-background">
			<CustomerNavbar />
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="flex items-center justify-between mb-4">
					<h1 className="text-2xl font-semibold">Quotations</h1>
					<Button variant="outline" onClick={load} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</Button>
				</div>

				{error && <div className="text-sm text-destructive mb-3">{error}</div>}

				{loading ? (
					<div className="text-sm text-muted-foreground">Loading…</div>
				) : list.length === 0 ? (
					<div className="text-sm text-muted-foreground">No quotations found.</div>
				) : (
					<div className="space-y-3">
						{list.map((q: any) => (
							<div key={q._id} className="border rounded-md p-4 flex items-center justify-between gap-4">
								<div>
									<div className="font-medium">Quote #{String(q._id).slice(-6)}</div>
									<div className="text-xs text-muted-foreground">{role === 'end_user' ? (q.createdBy?.name || 'Customer') : (q.vendor?.name || 'Vendor')}</div>
								</div>
								<div className="text-right">
									<div className="font-semibold">₹{(q.total || 0).toFixed(0)}</div>
									<div className="text-xs uppercase tracking-wide text-muted-foreground">{q.status}</div>
								</div>
								<div className="flex gap-2">
									{role === 'end_user' ? (
										<>
											{q.status === 'draft' && (
												<Button size="sm" onClick={() => approve(q._id)}>Approve</Button>
											)}
											{q.status !== 'rejected' && (
												<Button size="sm" variant="destructive" onClick={() => reject(q._id)}>Reject</Button>
											)}
										</>
									) : (
										<>
											<Button size="sm" onClick={() => navigate(`/quotations/${q._id}`)}>View</Button>
											{q.status === 'approved' && (
												<Button size="sm" onClick={() => openDeliveryModal(q._id)}>Order</Button>
											)}
											{q.status !== 'converted' && q.status !== 'cancelled_by_customer' && (
												<>
													<Button size="sm" variant="destructive" onClick={() => cancel(q._id)}>Cancel</Button>
													{q.status === 'draft' && (
														<Button size="sm" variant="outline" onClick={() => delDraft(q._id)}>Delete</Button>
													)}
												</>
											)}
										</>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Delivery modal */}
			{showModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center">
					<div className="absolute inset-0 bg-black/40" onClick={() => !submitting && setShowModal(false)} />
					<div className="relative z-10 w-full max-w-md rounded-lg border bg-white p-4 shadow-lg">
						<h2 className="text-lg font-semibold mb-2">Select delivery</h2>
						<p className="text-sm text-muted-foreground mb-4">Choose how you want to receive your order.</p>
						<div className="space-y-3">
							<div>
								<Label className="text-sm">Method</Label>
								<select className="mt-1 h-9 w-full rounded-md border bg-white px-3 text-sm" value={deliveryMethod} onChange={e => setDeliveryMethod(e.target.value as DeliveryMethod)} disabled={submitting}>
									<option value="pickup">Pickup (free)</option>
									<option value="delivery">Delivery</option>
								</select>
							</div>
							{deliveryMethod === 'delivery' && (
								<div>
									<Label htmlFor="addr" className="text-sm">Delivery address</Label>
									<Input id="addr" placeholder="Name, Street, City, ZIP" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} disabled={submitting} />
								</div>
							)}
						</div>
						<div className="mt-4 flex items-center justify-end gap-2">
							<Button variant="outline" onClick={() => setShowModal(false)} disabled={submitting}>Cancel</Button>
							<Button onClick={submitOrder} disabled={submitting}>{submitting ? 'Submitting…' : 'Confirm'}</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
