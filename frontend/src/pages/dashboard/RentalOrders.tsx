import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';

// Rental order status colors
const STATUS_COLORS: Record<string, string> = {
  Quotation: 'bg-blue-100 text-blue-700',
  'Quotation sent': 'bg-purple-100 text-purple-700',
  Reserved: 'bg-green-100 text-green-700',
  Pickedup: 'bg-yellow-100 text-yellow-700',
  Returned: 'bg-red-100 text-red-700',
};

// Rental order card component
function RentalOrderCard({ order }: { order: any }) {
  return (
    <div className="border rounded-lg p-4 flex flex-col gap-2 min-w-[220px]">
      <div className="font-semibold">{order.customer}</div>
      <div className="text-lg font-bold">₹ {order.amount}</div>
      <div className="text-xs text-muted-foreground">{order.code}</div>
      {order.pickup && (
        <div className="text-xs text-muted-foreground">Pickup: {order.pickup}</div>
      )}
      {order.latePickup && (
        <div className="text-xs text-red-600">Late Pickup: {order.latePickup}</div>
      )}
      <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>{order.status}</div>
    </div>
  );
}

export default function RentalOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        // Replace with actual API call
        const res = await api.get('/api/v1/quotation/getAllUserQuotations');
        // Transform backend data to match card layout
        const mapped = (res.data?.data || []).map((q: any, i: number) => ({
          customer: q.createdBy?.name || `Customer${i+1}`,
          amount: q.total,
          code: `R${String(i+1).padStart(4, '0')}`,
          status: q.status === 'draft' ? 'Quotation' : q.status.charAt(0).toUpperCase() + q.status.slice(1),
          pickup: q.pickupDate || '',
          latePickup: q.latePickupDate || '',
        }));
        setOrders(mapped);
      } catch (e) {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Pagination logic
  const pagedOrders = orders.slice((page-1)*pageSize, page*pageSize);
  const totalPages = Math.ceil(orders.length / pageSize);

  // Status counts (for sidebar)
  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    acc.ALL = (acc.ALL || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 border-r p-4 flex flex-col gap-6">
        <Button className="mb-4 bg-purple-300 text-purple-900">Create</Button>
        <div>
          <div className="font-bold mb-2">RENTAL STATUS</div>
          {['ALL','Quotation','Quotation sent','Reserved','Pickedup','Returned'].map(s => (
            <div key={s} className="flex justify-between py-1 text-sm">
              <span>{s}</span>
              <span className="font-semibold">{statusCounts[s] || 0}</span>
            </div>
          ))}
        </div>
        <div>
          <div className="font-bold mb-2">INVOICE STATUS</div>
          {['Fully Invoiced','Nothing to invoice','To invoice'].map(s => (
            <div key={s} className="flex justify-between py-1 text-sm">
              <span>{s}</span>
              <span className="font-semibold">5</span>
            </div>
          ))}
        </div>
      </div>
      {/* Main content */}
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button className="bg-purple-300 text-purple-900">Create</Button>
            <span className="font-bold text-lg">Rental Orders</span>
          </div>
          <div className="flex items-center gap-2">
            <input type="text" placeholder="Search" className="border rounded px-2 py-1" />
            <span>{(page-1)*pageSize+1}-{Math.min(page*pageSize, orders.length)}/{orders.length}</span>
            <Button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="px-2">{'<'}</Button>
            <Button disabled={page===totalPages} onClick={()=>setPage(p=>p+1)} className="px-2">{'>'}</Button>
            <Button className="px-2">Cart</Button>
            <Button className="px-2">List</Button>
          </div>
        </div>
        {/* Grid of rental orders */}
        <div className="grid grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-4 text-center text-muted-foreground">Loading…</div>
          ) : pagedOrders.length === 0 ? (
            <div className="col-span-4 text-center text-muted-foreground">No rental orders found</div>
          ) : (
            pagedOrders.map((order, i) => <RentalOrderCard key={i} order={order} />)
          )}
        </div>
      </div>
    </div>
  );
}
