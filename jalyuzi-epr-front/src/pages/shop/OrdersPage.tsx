import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { shopOrderApi, type ShopOrderResponse } from '../../api/shop.api';
import { useShopStore } from '../../store/shopStore';
import { formatCurrency, formatDateTime } from '../../config/constants';

export function ShopOrdersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useShopStore();

  const [orders, setOrders] = useState<ShopOrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/shop/login', { state: { from: '/shop/orders' } });
      return;
    }

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const result = await shopOrderApi.getOrders(page, 10);
        setOrders(result.content);
        setTotalPages(result.totalPages);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [isAuthenticated, navigate, page]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'badge-warning';
      case 'COMPLETED':
        return 'badge-success';
      case 'CANCELLED':
        return 'badge-error';
      default:
        return 'badge-ghost';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">{t('shop.orders.title')}</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 mx-auto text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-xl text-gray-500 mb-4">{t('shop.orders.noOrders')}</p>
          <Link to="/shop/catalog" className="btn btn-primary">
            {t('shop.catalog')}
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                to={`/shop/orders/${order.id}`}
                className="card bg-base-200 hover:bg-base-300 transition-colors"
              >
                <div className="card-body">
                  <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div>
                      <h3 className="font-bold">#{order.orderNumber}</h3>
                      <p className="text-sm text-gray-500">{formatDateTime(order.orderDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrency(order.totalAmount)}</p>
                      <span className={`badge ${getStatusBadge(order.status)}`}>
                        {order.statusName}
                      </span>
                    </div>
                  </div>

                  <div className="divider my-2"></div>

                  <div className="flex gap-2 overflow-x-auto">
                    {order.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex-shrink-0 text-sm">
                        <p className="font-semibold">{item.productName}</p>
                        <p className="text-gray-500">
                          {item.width}x{item.height}mm × {item.quantity}
                        </p>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="flex-shrink-0 text-sm text-gray-500 self-center">
                        +{order.items.length - 3} yana...
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="join">
                <button
                  className="join-item btn"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  «
                </button>
                <button className="join-item btn">
                  {page + 1} / {totalPages}
                </button>
                <button
                  className="join-item btn"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(page + 1)}
                >
                  »
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
