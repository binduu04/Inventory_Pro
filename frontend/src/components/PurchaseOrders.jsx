import { useState, useEffect } from "react";
import { X, Package, Truck, CheckCircle, Eye, Calendar, User, Mail, Phone, ShoppingBag } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const PurchaseOrders = () => {
  const { session } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [receivingOrder, setReceivingOrder] = useState(null);

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:5000/api/orders/purchase-orders", {
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch purchase orders");
      }

      const data = await response.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (err) {
      console.error("Error fetching purchase orders:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReceived = async (orderId) => {
    if (!confirm("Mark this order as received? This will update product stock levels.")) {
      return;
    }

    setReceivingOrder(orderId);
    try {
      const response = await fetch(`http://localhost:5000/api/orders/purchase-order/${orderId}/receive`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to mark order as received");
      }

      const data = await response.json();
      
      alert(`✅ Order Received!\n\n${data.message}\nStock updated for ${data.items_updated} products.`);
      
      // Refresh the orders list
      await fetchPurchaseOrders();
      
      // Close modal if open
      if (showDetailsModal && selectedOrder?.id === orderId) {
        setShowDetailsModal(false);
        setSelectedOrder(null);
      }
    } catch (err) {
      console.error("Error marking order as received:", err);
      alert(`Failed to mark order as received: ${err.message}`);
    } finally {
      setReceivingOrder(null);
    }
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 font-semibold">Error: {error}</p>
        <button
          onClick={fetchPurchaseOrders}
          className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Purchase Orders</h1>
          <p className="text-gray-600">Manage orders placed with suppliers</p>
        </div>
        <button
          onClick={fetchPurchaseOrders}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Package size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Purchase Orders</h3>
          <p className="text-gray-600">
            Purchase orders will appear here when you place them from the Forecast tab.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className={`p-4 rounded-t-xl ${
                order.status === 'received' 
                  ? 'bg-green-50 border-b border-green-200' 
                  : 'bg-indigo-50 border-b border-indigo-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-lg text-gray-800">{order.order_number}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    order.status === 'received'
                      ? 'bg-green-200 text-green-800'
                      : 'bg-yellow-200 text-yellow-800'
                  }`}>
                    {order.status === 'received' ? '✓ Received' : 'Pending'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar size={14} />
                  <span>{new Date(order.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}</span>
                </div>
              </div>

              {/* Supplier Info */}
              <div className="p-4 border-b border-gray-200 bg-blue-50">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User size={20} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">
                      {order.suppliers?.full_name || 'Unknown Supplier'}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                      <Mail size={12} />
                      <span className="truncate">{order.suppliers?.email}</span>
                    </div>
                    {order.suppliers?.phone && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                        <Phone size={12} />
                        <span>{order.suppliers.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Items:</span>
                  <span className="font-semibold text-gray-800">
                    {order.items?.length || 0} products
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Amount:</span>
                  <span className="text-lg font-bold text-green-600">
                    ₹{parseFloat(order.total_amount).toFixed(2)}
                  </span>
                </div>
                {order.received_at && (
                  <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 p-2 rounded">
                    <CheckCircle size={14} />
                    <span>Received on {new Date(order.received_at).toLocaleDateString('en-IN')}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-4 bg-gray-50 rounded-b-xl flex gap-2">
                <button
                  onClick={() => viewOrderDetails(order)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Eye size={16} />
                  <span className="font-medium">View Details</span>
                </button>
                {order.status === 'placed' && (
                  <button
                    onClick={() => handleMarkReceived(order.id)}
                    disabled={receivingOrder === order.id}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      receivingOrder === order.id
                        ? 'bg-gray-400 cursor-not-allowed text-white'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {receivingOrder === order.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        <span className="font-medium">Processing...</span>
                      </>
                    ) : (
                      <>
                        <Truck size={16} />
                        <span className="font-medium">Received</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedOrder(null);
          }}
          onMarkReceived={handleMarkReceived}
          isReceiving={receivingOrder === selectedOrder.id}
        />
      )}
    </div>
  );
};

const OrderDetailsModal = ({ order, onClose, onMarkReceived, isReceiving }) => {
  return (
    <div className="fixed inset-0 backdrop-blur-xs bg-black/40 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`p-6 rounded-t-xl ${
          order.status === 'received' ? 'bg-green-600' : 'bg-indigo-600'
        } text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{order.order_number}</h2>
              <p className="text-sm opacity-90 mt-1">
                Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-600 rounded-lg "
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-center">
            <span className={`px-6 py-2 rounded-full text-sm font-bold ${
              order.status === 'received'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {order.status === 'received' ? '✓ Order Received' : 'Pending Delivery'}
            </span>
          </div>

          {/* Supplier Details */}
          <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <User size={18} className="text-blue-600" />
              Supplier Information
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-semibold text-gray-800">{order.suppliers?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium text-blue-600">{order.suppliers?.email}</span>
              </div>
              {order.suppliers?.phone && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium text-gray-700">{order.suppliers.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <ShoppingBag size={18} className="text-indigo-600" />
              Order Items ({order.items?.length || 0})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Product</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Quantity</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Unit Cost</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.items?.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-800">{item.product_name}</td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-700">
                        {item.quantity} units
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        ₹{parseFloat(item.unit_cost).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">
                        ₹{parseFloat(item.total_cost).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="3" className="px-4 py-3 text-right font-bold text-gray-800">
                      Grand Total:
                    </td>
                    <td className="px-4 py-3 text-right text-xl font-bold text-green-600">
                      ₹{parseFloat(order.total_amount).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">Notes:</h4>
              <p className="text-gray-700">{order.notes}</p>
            </div>
          )}

          {/* Received Info */}
          {order.received_at && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle size={20} />
                <span className="font-semibold">
                  Received on {new Date(order.received_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex items-center justify-end gap-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
          {order.status === 'placed' && (
            <button
              onClick={() => onMarkReceived(order.id)}
              disabled={isReceiving}
              className={`px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                isReceiving
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md'
              }`}
            >
              {isReceiving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  Processing...
                </>
              ) : (
                <>
                  <Truck size={18} />
                  Mark as Received
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrders;
