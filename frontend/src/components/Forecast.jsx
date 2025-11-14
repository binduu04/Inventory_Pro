import { useState, useEffect } from "react";
import { TrendingUp, Loader2, Download, AlertCircle, CheckCircle, AlertTriangle, Package, Search, Filter, ShoppingCart, BarChart3 } from "lucide-react";
import { supabase } from "../config/supabase";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ReorderModal from "./ReorderModal";
import { useAuth } from "../context/AuthContext";

const Forecast = () => {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [forecastData, setForecastData] = useState([]);
  const [reorderData, setReorderData] = useState([]);
  const [reorderSummary, setReorderSummary] = useState(null);
  const [mode, setMode] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReorderProduct, setSelectedReorderProduct] = useState(null);
  const [pendingOrders, setPendingOrders] = useState(new Set());

  useEffect(() => {
    fetchPendingPurchaseOrders();
  }, [session]);

  const fetchPendingPurchaseOrders = async () => {
    if (!session?.access_token) return;
    try {
      const response = await fetch("http://localhost:5000/api/orders/purchase-orders", {
        headers: { "Authorization": `Bearer ${session.access_token}` }
      });
      const data = await response.json();
      if (data.success && data.data) {
        const placedProductIds = new Set();
        data.data.forEach(po => {
          if (po.status === 'placed' && po.items) {
            po.items.forEach(item => placedProductIds.add(item.product_id));
          }
        });
        setPendingOrders(placedProductIds);
      }
    } catch (error) {
      console.error("Error fetching pending orders:", error);
    }
  };

  const handleForecast = async (type) => {
    setLoading(true);
    setMode(type);
    setForecastData([]);
    setReorderData([]);
    setReorderSummary(null);

    try {
      // Refresh session to ensure fresh token
      const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !freshSession) {
        console.error('❌ Session error:', sessionError);
        alert('Session expired. Please refresh the page.');
        setLoading(false);
        return;
      }

      console.log('🔑 Using fresh session token for forecast');

      if (type === "manual") {
        // Step 1: Fetch product details from Supabase
        const { data: products, error } = await supabase
          .from('products')
          .select('id, product_name, current_stock, supplier_id, cost_price');
        
        if (error) {
          console.error("Error fetching current stock:", error);
          alert("Failed to fetch current stock from database");
          setLoading(false);
          return;
        }

        // Step 1.5: Fetch all suppliers
        const { data: suppliers, error: supplierError } = await supabase
          .from('suppliers')
          .select('*');
        
        if (supplierError) {
          console.error("Error fetching suppliers:", supplierError);
        }

        console.log(`✅ Fetched ${products.length} products and ${suppliers?.length || 0} suppliers`);

        // Convert to dictionary for forecast API
        const currentStock = {};
        products.forEach(p => {
          currentStock[p.product_name] = p.current_stock || 0;
        });

        console.log(`Fetched stock for ${products.length} products`);

        // Step 2: Call the forecast + reorder API
        const response = await fetch("http://localhost:5000/api/forecast/generate-with-reorder", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${freshSession.access_token}`,
          },
          body: JSON.stringify({
            num_days: 7,
            current_stock: currentStock,
            safety_stock: 5,
            lead_time_days: 1
          }),
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          // Transform forecast data
          const transformedForecast = transformForecastData(data.forecast);
          setForecastData(transformedForecast);
          
          // Enrich reorder data with product details AND supplier info
          const enrichedReorderData = (data.reorder || []).map(item => {
            const productInfo = products.find(p => p.product_name === item.product_name);
            const supplierInfo = suppliers?.find(s => s.id === productInfo?.supplier_id);
            
            console.log(`🔍 Enriching ${item.product_name}:`, {
              found: !!productInfo,
              product_id: productInfo?.id,
              supplier_id: productInfo?.supplier_id,
              cost_price: productInfo?.cost_price,
              supplier_found: !!supplierInfo
            });
            
            return {
              ...item,
              product_id: productInfo?.id,
              supplier_id: productInfo?.supplier_id,
              cost_price: productInfo?.cost_price || 0,
              supplier: supplierInfo  // Pass full supplier object
            };
          });
          
          console.log("📊 Enriched reorder data:", enrichedReorderData);
          setReorderData(enrichedReorderData);
          setReorderSummary(data.reorder_summary || null);
          
          console.log(`Forecast generated for ${transformedForecast.length} products`);
          console.log(`Reorder recommendations: ${data.reorder.length} products`);
        } else {
          console.error("Forecast API returned error:", data.error);
          alert("Failed to generate forecast: " + (data.error || "Unknown error"));
        }
      } else {
        // EOD upload not implemented yet
        alert("EOD sales upload feature coming soon!");
      }
    } catch (error) {
      console.error("Error fetching forecast:", error);
      alert("Failed to generate forecast. Make sure backend is running and models are trained.");
    } finally {
      setLoading(false);
    }
  };

  const getColorClass = (level) => {
    switch (level) {
      case "red":
        return "bg-red-500 text-white";
      case "yellow":
        return "bg-yellow-400 text-gray-800";
      case "green":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-200";
    }
  };

  const getUrgencyBadgeClass = (status) => {
    switch (status) {
      case "red":
        return "bg-red-100 text-red-800 border border-red-300";
      case "yellow":
        return "bg-yellow-100 text-yellow-800 border border-yellow-300";
      case "green":
        return "bg-green-100 text-green-800 border border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-300";
    }
  };

  const getUrgencyIcon = (status) => {
    switch (status) {
      case "red":
        return <AlertCircle className="inline mr-1" size={16} />;
      case "yellow":
        return <AlertTriangle className="inline mr-1" size={16} />;
      case "green":
        return <CheckCircle className="inline mr-1" size={16} />;
      default:
        return null;
    }
  };

  // Filter reorder data based on search and filters
  const getFilteredReorderData = () => {
    if (!reorderData || reorderData.length === 0) return [];

    return reorderData.filter(item => {
      // Search filter
      const matchesSearch = item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = filterStatus === "all" || item.urgency_status === filterStatus;
      
      // Category filter
      const matchesCategory = filterCategory === "all" || item.category === filterCategory;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  };

  // Get unique categories for filter
  const getCategories = () => {
    if (!reorderData) return [];
    const categories = [...new Set(reorderData.map(item => item.category))];
    return categories.sort();
  };

  // Prepare chart data for selected product
  const getChartData = () => {
    if (!selectedProduct || !forecastData) return [];
    
    const productForecast = forecastData.find(p => p.product === selectedProduct);
    if (!productForecast) return [];

    return productForecast.forecast.map(day => ({
      date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      quantity: day.qty,
      revenue: day.revenue
    }));
  };

  const handleReorder = (product) => {
    setSelectedReorderProduct(product);
    setIsModalOpen(true);
  };

  const handleOrderPlaced = (orderData) => {
    console.log('✅ Order placed, refreshing pending orders...')
    fetchPendingPurchaseOrders();
  };

  return (
    <div>
      {/* Header - Consistent with other pages */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Sales Forecast & Inventory Reorder</h1>
          <p className="text-gray-600">AI-powered demand forecasting and intelligent reorder recommendations</p>
        </div>
        
        {/* Action Buttons - Top Right */}
        <div className="flex gap-3">
          <button
            onClick={() => handleForecast("manual")}
            disabled={loading}
            className={`px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all flex items-center gap-2 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            <TrendingUp size={18} />
            {loading ? "Generating..." : "Run Forecast"}
          </button>
          {forecastData.length > 0 && (
            <button className="px-5 py-2.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 font-medium text-gray-700 flex items-center gap-2 transition-all">
              <Download size={18} />
              Export CSV
            </button>
          )}
        </div>
      </div>

      <div>
        {/* Loader */}
        {loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
          <p className="text-gray-600 text-sm">
            Generating {mode === "save" ? "updated" : "manual"} forecast...
          </p>
        </div>
      )}

      {/* Empty State */}
      {!loading && forecastData.length === 0 && (
        <div className="text-center py-24">
          <TrendingUp size={56} className="mx-auto text-gray-400 mb-3" />
          <h3 className="text-xl font-semibold text-gray-700 mb-1">
            No Forecast Yet
          </h3>
          <p className="text-gray-500">
            Click one of the buttons above to generate predictions.
          </p>
        </div>
      )}

        {/* Results Display */}
        {!loading && forecastData.length > 0 && (
          <>
            {/* Summary Cards */}
            {reorderSummary && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600 font-semibold mb-1">Critical</p>
                      <p className="text-3xl font-bold text-red-700">{reorderSummary.critical_count}</p>
                      <p className="text-xs text-red-500 mt-1">0-2 days stock left</p>
                    </div>
                    <div className="bg-red-200 rounded-full p-3">
                      <AlertCircle className="text-red-600" size={28} />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-yellow-600 font-semibold mb-1">Warning</p>
                      <p className="text-3xl font-bold text-yellow-700">{reorderSummary.warning_count}</p>
                      <p className="text-xs text-yellow-500 mt-1">3-5 days stock left</p>
                    </div>
                    <div className="bg-yellow-200 rounded-full p-3">
                      <AlertTriangle className="text-yellow-600" size={28} />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-semibold mb-1">Good Stock</p>
                      <p className="text-3xl font-bold text-green-700">{reorderSummary.good_count}</p>
                      <p className="text-xs text-green-500 mt-1">6+ days stock left</p>
                    </div>
                    <div className="bg-green-200 rounded-full p-3">
                      <CheckCircle className="text-green-600" size={28} />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-indigo-600 font-semibold mb-1">Total Orders</p>
                      <p className="text-3xl font-bold text-indigo-700">{reorderSummary.total_order_qty}</p>
                      <p className="text-xs text-indigo-500 mt-1">{reorderSummary.products_needing_order} products</p>
                    </div>
                    <div className="bg-indigo-200 rounded-full p-3">
                      <Package className="text-indigo-600" size={28} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Product Forecast Visualization */}
            {forecastData.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <BarChart3 size={20} className="text-indigo-600" />
                    Product Forecast Visualization
                  </h2>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Product to View Forecast
                  </label>
                  <select
                    value={selectedProduct || ""}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">-- Choose a product --</option>
                    {forecastData.map((item) => (
                      <option key={item.product} value={item.product}>
                        {item.product} ({item.category})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedProduct && getChartData().length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={getChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis yAxisId="left" label={{ value: 'Quantity', angle: -90, position: 'insideLeft' }} />
                        <YAxis yAxisId="right" orientation="right" label={{ value: 'Revenue (₹)', angle: 90, position: 'insideRight' }} />
                        <Tooltip />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="quantity" stroke="#4f46e5" strokeWidth={2} name="Predicted Quantity" />
                        <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue (₹)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* Reorder Recommendations Table */}
            {reorderData.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Package size={20} className="text-indigo-600" />
                    Reorder Recommendations
                  </h2>
                </div>

                {/* Search and Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
                    >
                      <option value="all">All Status</option>
                      <option value="red">🔴 Critical Only</option>
                      <option value="yellow">🟡 Warning Only</option>
                      <option value="green">🟢 Good Only</option>
                    </select>
                  </div>

                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
                    >
                      <option value="all">All Categories</option>
                      {getCategories().map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Reorder Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-indigo-50 text-gray-700">
                        <th className="border border-gray-200 p-3 text-left font-semibold">Product</th>
                        <th className="border border-gray-200 p-3 text-left font-semibold">Category</th>
                        <th className="border border-gray-200 p-3 text-center font-semibold">Current Stock</th>
                        <th className="border border-gray-200 p-3 text-center font-semibold">Days Left</th>
                        <th className="border border-gray-200 p-3 text-center font-semibold">Status</th>
                        <th className="border border-gray-200 p-3 text-center font-semibold">7-Day Demand</th>
                        <th className="border border-gray-200 p-3 text-center font-semibold">Order Qty</th>
                        <th className="border border-gray-200 p-3 text-center font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredReorderData().map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="border border-gray-200 p-3 font-medium text-gray-800">
                            {item.product_name}
                          </td>
                          <td className="border border-gray-200 p-3 text-gray-600 text-xs">
                            <span className="whitespace-nowrap px-2 py-1 bg-gray-100 rounded-full">
                              {item.category}
                            </span>
                          </td>
                          <td className="border border-gray-200 p-3 text-center font-semibold text-gray-700">
                            {item.current_stock}
                          </td>
                          <td className="border border-gray-200 p-3 text-center">
                            <span className={`font-bold ${
                              item.days_until_stockout <= 2 ? 'text-red-600' :
                              item.days_until_stockout <= 5 ? 'text-yellow-600' :
                              'text-green-600'
                            }`}>
                              {item.days_until_stockout.toFixed(1)}d
                            </span>
                          </td>
                          <td className="border border-gray-200 p-3 text-center">
                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center ${getUrgencyBadgeClass(item.urgency_status)}`}>
                              {getUrgencyIcon(item.urgency_status)}
                              {item.urgency_status.toUpperCase()}
                            </span>
                          </td>
                          <td className="border border-gray-200 p-3 text-center font-semibold text-indigo-600">
                            {item.forecast_7day_total}
                          </td>
                          <td className="border border-gray-200 p-3 text-center">
                            {item.recommended_order_qty > 0 ? (
                              <span className="text-lg font-bold text-indigo-700">
                                {item.recommended_order_qty}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-sm">Sufficient</span>
                            )}
                          </td>
                          <td className="border border-gray-200 p-3 text-center">
                            {item.recommended_order_qty > 0 ? (
                              pendingOrders.has(item.product_id) ? (
                                <span className="whitespace-nowrap px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-xs font-medium">
                                  Order Placed
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleReorder(item)}
                                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1 mx-auto"
                                >
                                  <ShoppingCart size={14} />
                                  Reorder
                                </button>
                              )
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {getFilteredReorderData().length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Package size={48} className="mx-auto mb-2 opacity-30" />
                      <p>No products match your filters</p>
                    </div>
                  )}

                  {getFilteredReorderData().length > 0 && (
                    <p className="text-gray-500 text-sm mt-4 text-center">
                      Showing {getFilteredReorderData().length} of {reorderData.length} products
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Reorder Modal */}
      <ReorderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedReorderProduct}
        onOrderPlaced={handleOrderPlaced}
      />
    </div>
  );
};

// --- Transform API response to component format
const transformForecastData = (apiData) => {
  // Group by product and create 7-day forecast per product
  const productMap = {};
  
  apiData.forEach(item => {
    if (!productMap[item.product_name]) {
      productMap[item.product_name] = {
        product: item.product_name,
        category: item.category,
        forecast: []
      };
    }
    
    // Determine urgency level based on quantity
    let level = 'green';
    if (item.predicted_quantity < 10) {
      level = 'red'; // Low stock urgency
    } else if (item.predicted_quantity < 30) {
      level = 'yellow'; // Medium stock
    }
    
    productMap[item.product_name].forecast.push({
      date: item.date,
      qty: item.predicted_quantity,
      revenue: item.forecasted_revenue,
      level: level
    });
  });
  
  // Convert to array and sort by product name
  return Object.values(productMap).sort((a, b) => 
    a.product.localeCompare(b.product)
  );
};

export default Forecast;
