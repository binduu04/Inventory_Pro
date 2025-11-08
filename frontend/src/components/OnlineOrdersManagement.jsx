import { useState, useEffect } from 'react';
import { Package, CheckCircle, Clock, User, Phone, Calendar, ShoppingBag, X } from 'lucide-react';

const OnlineOrdersManagement = ({ session, onOrdersChange }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [processingOrderId, setProcessingOrderId] = useState(null);

  useEffect(() => {
    fetchPendingOrders();
  }, [session]);

  const fetchPendingOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/orders/pending-orders', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setOrders(data.orders || []);
        // Notify parent component about order count change
        if (onOrdersChange) {
          onOrdersChange(data.orders?.length || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsPacked = async (saleId) => {
    setProcessingOrderId(saleId);
    try {
      const response = await fetch(`http://localhost:5000/api/orders/mark-packed/${saleId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        // Refresh orders
        await fetchPendingOrders();
        alert('Order marked as packed and ready for pickup!');
      } else {
        alert(data.error || 'Failed to mark order as packed');
      }
    } catch (error) {
      console.error('Error marking order as packed:', error);
      alert('Failed to mark order as packed');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const markAsCompleted = async (saleId) => {
    setProcessingOrderId(saleId);
    try {
      const response = await fetch(`http://localhost:5000/api/orders/mark-completed/${saleId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        // Refresh orders (completed orders will be removed from this list)
        await fetchPendingOrders();
        alert('Order marked as completed!');
        setSelectedOrder(null);
      } else {
        alert(data.error || 'Failed to mark order as completed');
      }
    } catch (error) {
      console.error('Error marking order as completed:', error);
      alert('Failed to mark order as completed');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'paid': {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        label: 'Payment Recieved'
      },
      'packed_and_ready_for_pickup': {
        bg: 'bg-green-100',
        text: 'text-green-700',
        label: 'Ready for Pickup'
      }
    };

    const config = statusConfig[status] || statusConfig['paid'];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Package size={80} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 mb-2">No Pending Orders</h2>
          <p className="text-gray-500">All online orders have been processed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Online Orders to Process</h2>
          <p className="text-gray-600 text-sm">Pack orders and mark them ready for customer pickup</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {orders.map((order) => (
            <div 
              key={order.sale_id} 
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
            >
              {/* Order Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{order.order_number}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <Calendar size={14} />
                    {formatDate(order.date)}
                  </p>
                </div>
                {getStatusBadge(order.status)}
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Customer</p>
                      <p className="text-sm font-semibold text-gray-900">{order.customer_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-sm font-semibold text-gray-900">{order.customer_phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2 text-gray-600">
                  <ShoppingBag size={18} />
                  <span className="text-sm">{order.items} items</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Total Amount</p>
                  <p className="text-xl font-bold text-orange-600">₹{order.total.toFixed(2)}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
                >
                  View Details
                </button>
                
                {order.status === 'paid' && (
                  <button
                    onClick={() => markAsPacked(order.sale_id)}
                    disabled={processingOrderId === order.sale_id}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    {processingOrderId === order.sale_id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        Mark as Packed
                      </>
                    )}
                  </button>
                )}

                {order.status === 'packed_and_ready_for_pickup' && (
                  <button
                    onClick={() => markAsCompleted(order.sale_id)}
                    disabled={processingOrderId === order.sale_id}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    {processingOrderId === order.sale_id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        Mark as Completed
                      </>
                    )}
                  </button>
                )}
              </div>

              {order.packed_at && (
                <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                  <Clock size={12} />
                  Packed at: {formatDate(order.packed_at)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" 
            onClick={() => setSelectedOrder(null)}
          ></div>
          
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-2xl shadow-2xl z-50 max-h-[85vh] overflow-hidden flex flex-col mx-4">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">{selectedOrder.order_number}</h2>
                <p className="text-sm opacity-90">{formatDate(selectedOrder.date)}</p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Name</p>
                    <p className="font-medium text-gray-900">{selectedOrder.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Phone</p>
                    <p className="font-medium text-gray-900">{selectedOrder.customer_phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                    <p className="font-medium text-gray-900">{selectedOrder.payment_method}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.sale_items.map((item, index) => (
                    <div key={index} className="flex gap-4 bg-white border border-gray-200 rounded-lg p-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {item.products?.image_url ? (
                          <img 
                            src={item.products.image_url} 
                            alt={item.products.product_name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Package size={24} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{item.products?.product_name}</h4>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                          <span className="text-sm text-gray-600">₹{parseFloat(item.unit_price).toFixed(2)} each</span>
                          <span className="font-semibold text-gray-900">₹{parseFloat(item.subtotal).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-bold text-gray-900">Total Amount</span>
                  <span className="text-2xl font-bold text-orange-600">₹{selectedOrder.total.toFixed(2)}</span>
                </div>

                {/* Action Buttons in Modal */}
                <div className="flex gap-3">
                  {selectedOrder.status === 'paid' && (
                    <button
                      onClick={() => {
                        markAsPacked(selectedOrder.sale_id);
                        setSelectedOrder(null);
                      }}
                      disabled={processingOrderId === selectedOrder.sale_id}
                      className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      {processingOrderId === selectedOrder.sale_id ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={20} />
                          Mark as Packed
                        </>
                      )}
                    </button>
                  )}

                  {selectedOrder.status === 'packed_and_ready_for_pickup' && (
                    <button
                      onClick={() => markAsCompleted(selectedOrder.sale_id)}
                      disabled={processingOrderId === selectedOrder.sale_id}
                      className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      {processingOrderId === selectedOrder.sale_id ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={20} />
                          Mark as Completed
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OnlineOrdersManagement;
