import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '../../components/ui/button';
import { ChevronDown } from 'lucide-react';

export default function RentalOrderForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [allIds, setAllIds] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(-1);
  const [updating, setUpdating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        // Fetch all quotations to get ids for navigation
        const res = await api.get('/api/v1/quotation/getAllUserQuotations');
        const list = res.data?.data || [];
        setAllIds(list.map((q: any) => q._id));
        const idx = list.findIndex((q: any) => q._id === id);
        setCurrentIdx(idx);
        // Fetch details for current quotation
        const orderRes = await api.get(`/api/v1/quotation/getQuotation/${id}`);
        setOrder(orderRes.data?.data);
      } catch (e) {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchOrder();
  }, [id]);

  const goPrev = () => {
    if (currentIdx > 0) navigate(`/dashboard/rental-order/${allIds[currentIdx - 1]}`);
  };
  const goNext = () => {
    if (currentIdx < allIds.length - 1) navigate(`/dashboard/rental-order/${allIds[currentIdx + 1]}`);
  };

  const handleStatusChange = async (newStatus: 'approved' | 'rejected' | 'sent' | 'cancelled_by_customer') => {
    if (!id) return;
    try {
      setUpdating(true);
      const res = await api.patch(`/api/v1/quotation/status/${id}`, { status: newStatus });
      const updated = res.data?.data;
      if (updated) setOrder(updated);
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to update status';
      alert(msg);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading…</div>;
  if (!order) return <div className="p-8 text-center text-red-600">Order not found</div>;

  // Extract details
  const formatAddress = (addr: any) => {
    if (!addr) return '';
    if (typeof addr === 'string') return addr;
    const { street, city, state, postalCode, country } = addr || {};
    return [street, city, state, postalCode, country].filter(Boolean).join(', ');
  };
  const code = `R${String(currentIdx + 1).padStart(4, '0')}`;
  const customer = order.createdBy?.name || '';
  const address = formatAddress(order.createdBy?.address);
  const rentalTemplate = order.rentalTemplate || '';
  const expiration = order.expiresAt ? new Date(order.expiresAt).toLocaleDateString() : '';
  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '';
  const priceList = order.priceList || '';
  const rentalPeriod =
    order.items?.[0]?.start && order.items?.[0]?.end
      ? `${new Date(order.items[0].start).toLocaleDateString()} - ${new Date(order.items[0].end).toLocaleDateString()}`
      : '';
  const rentalDuration =
    order.items?.[0]?.start && order.items?.[0]?.end
      ? Math.ceil((new Date(order.items[0].end).getTime() - new Date(order.items[0].start).getTime()) / (1000 * 60 * 60 * 24)) +
        ' days'
      : '';
  const status = order.status;

  return (
    <>
      {/* Print stylesheet: hide everything except the printable container during printing */}
      <style>{`
        @media print {
          /* hide everything first */
          body * { visibility: hidden !important; }
          /* show only printable container and its children */
          #rental-order-printable, #rental-order-printable * { visibility: visible !important; }
          /* place printable container at the top-left */
          #rental-order-printable { position: absolute !important; left: 0; top: 0; width: 100% !important; }
          /* hide interactive elements that shouldn't appear in print */
          .no-print { display: none !important; }
        }
      `}</style>

      <div id="rental-order-printable" ref={containerRef} className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8 mt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <Button onClick={goPrev} disabled={currentIdx <= 0}>{'<'}</Button>
            <Button onClick={goNext} disabled={currentIdx >= allIds.length - 1}>{'>'}</Button>
          </div>
          <div className="flex gap-2 items-center no-print">
            <div className="relative">
              <Button onClick={() => setMenuOpen(o => !o)} disabled={updating} className="bg-green-500 text-white inline-flex items-center gap-2">
                Update Status <ChevronDown className="w-4 h-4" />
              </Button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border rounded shadow-md z-20">
                  {(['approved','rejected','sent'] as const).map(s => (
                    <button
                      key={s}
                      disabled={updating || order?.status === s}
                      onClick={() => { setMenuOpen(false); handleStatusChange(s); }}
                      className="block w-full text-left px-3 py-2 hover:bg-gray-100 disabled:opacity-50 capitalize"
                    >
                      {s.replaceAll('_',' ')}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button className="bg-purple-300 text-purple-900">Invoice</Button>
            <Button className="bg-pink-200 text-pink-900">Pickup</Button>

            {/* Print button now calls window.print() in same tab — reliable and popup-free */}
            <Button onClick={() => window.print()} className="bg-pink-200 text-pink-900">
              Print
            </Button>

            <Button className="bg-pink-200 text-pink-900">2 Delivery</Button>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <span className="text-2xl font-bold">{code}</span>
          <span className="inline-block px-3 py-1 rounded bg-green-100 text-green-700 text-sm font-semibold">{status}</span>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <div className="mb-2">Customer: <span className="font-semibold">{customer}</span></div>
            <div className="mb-2">Address: <span className="font-semibold">{address}</span></div> 
            <div className="mb-2">Rental Template: <span className="font-semibold">{rentalTemplate}</span></div>
          </div>
          <div>
            <div className="mb-2">Expiration: <span className="font-semibold">{expiration}</span></div>
            <div className="mb-2">Rental Order Date: <span className="font-semibold">{orderDate}</span></div>
            <div className="mb-2">PriceList: <span className="font-semibold">{priceList}</span></div>
            <div className="mb-2">Rental Period: <span className="font-semibold">{rentalPeriod}</span></div>
            <div className="mb-2">Rental Duration: <span className="font-semibold">{rentalDuration}</span></div>
          </div>
        </div>
        <div className="border-t pt-4 mb-4">
          <div className="font-bold mb-2">Order lines</div>
          <table className="w-full text-sm mb-2">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Product</th>
                <th className="text-left py-2">Quantity</th>
                <th className="text-left py-2">Unit Price</th>
                <th className="text-left py-2">Tax</th>
                <th className="text-left py-2">Sub Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item: any, i: number) => (
                <tr key={i} className="border-b">
                  <td className="py-2">{item.product?.name || 'Product'}</td>
                  <td className="py-2">{item.quantity}</td>
                  <td className="py-2">₹{item.unitPrice}</td>
                  <td className="py-2">₹{order.tax}</td>
                  <td className="py-2">₹{item.totalPrice}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mb-2">terms &amp; condition</div>
          <div className="flex gap-8 mt-4">
            <div>Untaxed Total: ₹{order.subtotal}</div>
            <div>Tax: ₹{order.tax}</div>
            <div>Total: ₹{order.total}</div>
          </div>
        </div>
      </div>
    </>
  );
}
