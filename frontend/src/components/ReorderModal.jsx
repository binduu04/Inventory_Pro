import { useState, useEffect } from "react";
import { X, Package, DollarSign, User, Mail, Phone, ShoppingCart, AlertCircle,Send } from "lucide-react";
import { supabase } from "../config/supabase";
import { useAuth } from "../context/AuthContext";

const ReorderModal = ({ isOpen, onClose, product, onOrderPlaced }) => {
  const { session } = useAuth();
  const [quantity, setQuantity] = useState(product?.recommended_order_qty || 0);
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState("");

  const minQuantity = product?.recommended_order_qty || 0;
  const costPrice = product?.cost_price || 0;
  const totalCost = quantity * costPrice;

  useEffect(() => {
    if (isOpen && product) {
      console.log("🎯 ReorderModal opened with product:", product);
      setQuantity(product.recommended_order_qty || 0);
      setNotes("");
      setError(null);
      
      // Use supplier passed from Forecast instead of fetching
      if (product.supplier) {
        console.log("✅ Using supplier from product:", product.supplier);
        setSupplier(product.supplier);
      } else {
        console.log("⚠️ No supplier data in product, will fetch");
        setSupplier(null);
        fetchSupplier();
      }
    }
  }, [isOpen, product]);

  const fetchSupplier = async () => {
    console.log("🔍 fetchSupplier called with product:", product);
    console.log("🔍 Supplier ID:", product?.supplier_id);
    
    if (!product?.supplier_id) {
      setError("No supplier assigned to this product");
      console.error("❌ No supplier_id found on product");
      return;
    }

    try {
      // Refresh session to ensure fresh auth state (same pattern as Forecast)
      const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !freshSession) {
        console.error('❌ Session error:', sessionError);
        setError('Session expired. Please refresh the page.');
        return;
      }

      console.log('🔑 Using fresh session for supplier fetch');
      console.log("📡 Querying suppliers table for ID:", product.supplier_id);
      
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', product.supplier_id)
        .single();

      console.log("📦 Query result:", { data, error });
      
      if (error) {
        console.error("❌ Supabase error:", error);
        if (error.code === 'PGRST116') {
          setError("Supplier not found. Please assign a supplier to this product.");
        } else if (error.message.includes('RLS') || error.message.includes('policy')) {
          setError("Permission denied. Please run the RLS fix SQL in Supabase.");
        } else {
          setError(error.message);
        }
        return;
      }
      
      if (!data) {
        console.error("❌ No supplier data returned");
        setError("Supplier not found");
        return;
      }
      
      console.log("✅ Supplier fetched successfully:", data);
      setSupplier(data);
      setError(null);
    } catch (err) {
      console.error("❌ Exception fetching supplier:", err);
      setError("Failed to load supplier information");
    }
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    if (value >= minQuantity) {
      setQuantity(value);
    }
  };

  const handlePlaceOrder = async () => {
    if (quantity < minQuantity) {
      setError(`Quantity cannot be less than recommended: ${minQuantity}`);
      return;
    }

    if (!supplier) {
      setError("Supplier information not available");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("=== PLACE ORDER CLICKED ===");
      console.log("Step 1: Getting current session...");
      
      // Use current session token directly (already fresh from context)
      if (!session || !session.access_token) {
        console.error("No session found!");
        throw new Error("Session expired. Please login again.");
      }

      console.log("Step 2: Session found, token exists:", session.access_token.substring(0, 20) + "...");
      
      const requestBody = {
        supplier_id: supplier.id,
        items: [
          {
            product_id: product.product_id,
            product_name: product.product_name,
            quantity: quantity,
            unit_cost: costPrice,
            total_cost: totalCost
          }
        ],
        notes: notes
      };
      
      console.log("Step 3: Request body prepared:", requestBody);
      console.log("Step 4: Sending POST to http://localhost:5000/api/orders/purchase-order");

      const response = await fetch("http://localhost:5000/api/orders/purchase-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log("Step 5: Response received! Status:", response.status);

      // Check status before parsing JSON
      if (!response.ok) {
        let errorMessage = "Failed to place order";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error("Error response body:", errorData);
        } catch (e) {
          console.error("Failed to parse error response:", e);
        }
        console.error("Response not OK:", response.status, errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Step 6: Response data parsed:", data);

      console.log("SUCCESS: Purchase order created:", data);
      
      // Show success message
      alert(
        `✅ Purchase Order Placed Successfully!\n\n` +
        `Order Number: ${data.order_number}\n` +
        `Total Amount: ₹${data.total_amount.toFixed(2)}\n` +
        `Supplier: ${supplier.full_name}\n` +
        `Email sent to: ${supplier.email}\n\n` +
        `The order has been created and email notification sent.`
      );
      
      // Notify parent and close modal
      onOrderPlaced && onOrderPlaced(data);
      onClose();
      
    } catch (err) {
      console.error("=== ERROR PLACING ORDER ===");
      console.error("Error object:", err);
      console.error("Error message:", err.message);
      console.error("Error stack:", err.stack);
      
      // Check if it's a network error
      if (err.message.includes('fetch') || err.message.includes('NetworkError') || err.message.includes('Failed to fetch')) {
        setError("Cannot connect to backend. Please make sure the backend server is running on localhost:5000");
      } else {
        setError(err.message || "Failed to place order. Please try again.");
      }
    } finally {
      console.log("=== PLACE ORDER FINISHED ===");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 bg-opacity-50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-6 rounded-t-xl flex items-center justify-between sticky top-0">
          <div className="flex items-center gap-3">
            <Package size={28} />
            <div>
              <h2 className="text-2xl font-bold">Place Reorder</h2>
              <p className="text-indigo-100 text-sm">Create purchase order for supplier</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-indigo-500 p-2 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-semibold text-red-800">Error</h4>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Product Information */}
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Package size={18} className="text-indigo-600" />
              Product Details
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Product Name:</span>
                <span className="font-semibold text-gray-800">{product?.product_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Category:</span>
                <span className="font-medium text-gray-700">{product?.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Current Stock:</span>
                <span className="font-semibold text-orange-600">{product?.current_stock} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">7-Day Demand:</span>
                <span className="font-semibold text-indigo-600">{product?.forecast_7day_total} units</span>
              </div>
            </div>
          </div>

          {/* Supplier Information */}
          {supplier && (
            <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <User size={18} className="text-blue-600" />
                Supplier Details
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Supplier Name:</span>
                  <span className="font-semibold text-gray-800">{supplier.full_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Mail size={14} /> Email:
                  </span>
                  <span className="font-medium text-blue-600">{supplier.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Phone size={14} /> Phone:
                  </span>
                  <span className="font-medium text-gray-700">{supplier.phone || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Order Quantity */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Order Quantity (Minimum: {minQuantity} units)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min={minQuantity}
                value={quantity}
                onChange={handleQuantityChange}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg font-semibold"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setQuantity(Math.max(minQuantity, quantity - 10))}
                  className="px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition-colors"
                  disabled={quantity <= minQuantity}
                >
                  -10
                </button>
                <button
                  onClick={() => setQuantity(quantity + 10)}
                  className="px-4 py-3 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg font-semibold transition-colors"
                >
                  +10
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Recommended: {minQuantity} units • You can only increase this quantity
            </p>
          </div>

          {/* Cost Breakdown */}
          <div className="bg-green-50 rounded-lg p-5 border border-green-200">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <DollarSign size={18} className="text-green-600" />
              Cost Breakdown
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Unit Cost Price:</span>
                <span className="font-semibold text-gray-800">₹{costPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-semibold text-gray-800">{quantity} units</span>
              </div>
              <div className="h-px bg-green-300 my-2"></div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-800">Total Amount:</span>
                <span className="text-2xl font-bold text-green-600">₹{totalCost.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any special instructions or notes for the supplier..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex items-center justify-end gap-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-lg font-medium transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handlePlaceOrder}
            disabled={loading || !supplier || quantity < minQuantity}
            className={`px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              loading || !supplier
                ? "bg-gray-400 cursor-not-allowed text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md"
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Placing Order...
              </>
            ) : (
              <>
                <Send size={18} />
                Place Order
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReorderModal;
