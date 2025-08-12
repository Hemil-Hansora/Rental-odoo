import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '../../components/ui/button';
import { Grid as GridIcon, List as ListIcon } from 'lucide-react'; // Import icons

// Rental order status colors
const STATUS_COLORS: Record<string, string> = {
  Quotation: 'bg-blue-100 text-blue-700',
  'Quotation sent': 'bg-purple-100 text-purple-700',
  Reserved: 'bg-green-100 text-green-700',
  Pickedup: 'bg-yellow-100 text-yellow-700',
  Returned: 'bg-red-100 text-red-700',
};

// ✅ 2. Create a new, improved RentalOrderCard that adapts its layout based on the 'view' prop
function RentalOrderCard({ order, view }: { order: any; view: 'grid' | 'list' }) {
  // LIST VIEW LAYOUT
  if (view === 'list') {
    return (
      <div className="border rounded-lg p-3 flex items-center justify-between gap-4 cursor-pointer hover:shadow-md transition-shadow" onClick={order.onClick}>
        <div className="flex flex-col">
          <div className="font-semibold text-base">{order.customer}</div>
          <div className="text-xs text-muted-foreground mt-1">{order.code}</div>
        </div>
        <div className="flex-1 text-xs text-muted-foreground">
            {order.pickup && `Pickup: ${order.pickup}`}
            {order.latePickup && <span className="text-red-600 ml-2">Late Pickup: {order.latePickup}</span>}
        </div>
        <div className="text-lg font-bold text-right whitespace-nowrap">₹ {order.amount}</div>
        <div className={`text-center w-28 flex-shrink-0 px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>
          {order.status}
        </div>
      </div>
    );
  }

  // GRID VIEW LAYOUT (Original)
  return (
    <div className="border rounded-lg p-4 flex flex-col gap-2 min-w-[220px] cursor-pointer hover:shadow-lg" onClick={order.onClick}>
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
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const navigate = useNavigate();

  // ✅ 1. Add state to manage the current view ('grid' or 'list')
  const [view, setView] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/v1/quotation/getAllUserQuotations');
        const mapped = (res.data?.data || []).map((q: any, i: number) => ({
          id: q._id,
          customer: q.createdBy?.name || `Customer${i+1}`,
          amount: q.total,
          code: `R${String(i+1).padStart(4, '0')}`,
          status: q.status === 'draft' ? 'Quotation' : q.status.charAt(0).toUpperCase() + q.status.slice(1),
          pickup: q.pickupDate ? new Date(q.pickupDate).toLocaleDateString() : '',
          latePickup: q.latePickupDate ? new Date(q.latePickupDate).toLocaleDateString() : '',
          onClick: () => navigate(`/dashboard/rental-order/${q._id}`),
        }));
        setOrders(mapped);
      } catch (e) {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [navigate]);

  const pagedOrders = orders.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(orders.length / pageSize);

  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    acc.ALL = (acc.ALL || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 border-r p-4 flex flex-col gap-6">
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
            <span className="font-bold text-lg">Rental Orders</span>
          </div>
          <div className="flex items-center gap-2">
            <input type="text" placeholder="Search" className="border rounded px-2 py-1" />
            <span>{(page - 1) * pageSize + 1}-{Math.min(page * pageSize, orders.length)}/{orders.length}</span>
            <Button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-2">{'<'}</Button>
            <Button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-2">{'>'}</Button>
            
            {/* ✅ 3. Update the button group to toggle the view state */}
            <div className="inline-flex items-center gap-1 rounded-md border bg-white p-1">
              <Button variant={view === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => setView('grid')} title="Grid View">
                <GridIcon className="size-4"/>
              </Button>
              <Button variant={view === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setView('list')} title="List View">
                <ListIcon className="size-4"/>
              </Button>
            </div>
          </div>
        </div>
        
        {/* ✅ 4. Make the main container's classes conditional based on the 'view' state */}
        <div className={view === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" : "space-y-3"}>
          {loading ? (
            <div className="col-span-full text-center text-muted-foreground">Loading…</div>
          ) : pagedOrders.length === 0 ? (
            <div className="col-span-full text-center text-muted-foreground">No rental orders found</div>
          ) : (
            pagedOrders.map((order, i) => (
              // ✅ 5. Pass the 'view' prop to the card component
              <RentalOrderCard key={i} order={order} view={view} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}