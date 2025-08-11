import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CustomerNavbar from '@/components/customer/CustomerNavbar'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'

type DeliveryMethod = 'pickup' | 'delivery'

export default function QuotationsListPage() {
	const navigate = useNavigate()
	const userJson = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null
	const user = userJson ? JSON.parse(userJson) as { role?: string } : null
	const role = user?.role

	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [rows, setRows] = useState<any[]>([])

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

	const convertToOrder = async (id: string) => {
		const method = (prompt('Delivery method? Type pickup or delivery', 'pickup') || '').toLowerCase() as DeliveryMethod
		if (method !== 'pickup' && method !== 'delivery') return
		let address: string | undefined
		if (method === 'delivery') {
			address = prompt('Enter delivery address') || undefined
			if (!address) { alert('Delivery address is required'); return }
		}
		try {
			await api.post('/api/v1/order/create-quotation', { quotationId: id, deliveryMethod: method, deliveryAddress: address })
			navigate('/orders/review')
		} catch (e: any) { alert(e?.response?.data?.message || 'Failed to convert') }
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
												<Button size="sm" onClick={() => convertToOrder(q._id)}>Order</Button>
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
		</div>
	)
}
