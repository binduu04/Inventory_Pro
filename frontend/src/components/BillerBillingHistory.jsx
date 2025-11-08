import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Package, Receipt, Calendar, Search } from 'lucide-react';

const BillerBillingHistory = ({ session }) => {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSale, setExpandedSale] = useState(null);
  const [saleItems, setSaleItems] = useState({});
  const [loadingItems, setLoadingItems] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('offline'); // online, offline
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month, year

  useEffect(() => {
    fetchSales();
  }, [session]);

  useEffect(() => {
    filterSales();
  }, [sales, searchQuery, activeTab, dateFilter]);

  const filterSales = () => {
    let filtered = [...sales];

    // Apply tab filter
    if (activeTab === 'online') {
      filtered = filtered.filter(sale => sale.sale_type === 'ONLINE');
    } else if (activeTab === 'offline') {
      filtered = filtered.filter(sale => sale.sale_type === 'OFFLINE');
    }

    // Apply date filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (dateFilter === 'today') {
      filtered = filtered.filter(sale => {
        const saleDate = new Date(sale.sale_date);
        return saleDate >= today;
      });
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(sale => new Date(sale.sale_date) >= weekAgo);
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filtered = filtered.filter(sale => new Date(sale.sale_date) >= monthAgo);
    } else if (dateFilter === 'year') {
      const yearAgo = new Date(today);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      filtered = filtered.filter(sale => new Date(sale.sale_date) >= yearAgo);
    }

    // Apply search filter (invoice number or customer name/phone)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(sale => 
        String(sale.sale_id).includes(query) ||
        sale.customer_name.toLowerCase().includes(query) ||
        sale.customer_phone.includes(query)
      );
    }

    setFilteredSales(filtered);
  };

  const fetchSales = async () => {
    if (!session?.access_token) return;

    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/billers/sales', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSales(data.sales || []);
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSaleItems = async (saleId) => {
    if (saleItems[saleId]) {
      setExpandedSale(expandedSale === saleId ? null : saleId);
      return;
    }

    try {
      setLoadingItems({ ...loadingItems, [saleId]: true });
      const response = await fetch(
        `http://localhost:5000/api/billers/sales/${saleId}/items`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSaleItems({ ...saleItems, [saleId]: data.items || [] });
        setExpandedSale(saleId);
      }
    } catch (error) {
      console.error('Error fetching sale items:', error);
    } finally {
      setLoadingItems({ ...loadingItems, [saleId]: false });
    }
  };

  const toggleSaleDetails = (saleId) => {
    if (expandedSale === saleId) {
      setExpandedSale(null);
    } else {
      fetchSaleItems(saleId);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Loading history...</p>
        </div>
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="bg-orange-50 rounded-full p-6 mb-4">
          <Receipt size={48} className="text-orange-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No sales yet</h3>
        <p className="text-sm text-gray-500">Your billing history will appear here</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header with Tabs */}
      <div className="mb-6">
        {/* Tabs for Online/Offline */}
        <div className="flex items-center justify-between mb-4 border-b border-gray-200">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('offline')}
              className={`pb-3 px-1 text-sm font-semibold transition-all relative ${
                activeTab === 'offline'
                  ? 'text-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Offline Sales
              {activeTab === 'offline' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('online')}
              className={`pb-3 px-1 text-sm font-semibold transition-all relative ${
                activeTab === 'online'
                  ? 'text-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Online Orders
              {activeTab === 'online' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
              )}
            </button>
          </div>

          {/* Date Filter Pills */}
          <div className="flex gap-2 pb-3">
            {[
              { value: 'all', label: 'All' },
              { value: 'today', label: 'Today' },
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' },
              { value: 'year', label: 'Year' },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setDateFilter(filter.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  dateFilter === filter.value
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar and Count */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by invoice, customer name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            />
          </div>
          <div className="text-sm text-gray-500">
            {filteredSales.length} transaction{filteredSales.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredSales.map((sale) => {
          const isExpanded = expandedSale === sale.sale_id;
          const items = saleItems[sale.sale_id] || [];
          const isLoadingItems = loadingItems[sale.sale_id];

          return (
            <div
              key={sale.sale_id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-orange-300 hover:shadow-sm transition-all"
            >
              {/* Main Sale Row */}
              <div className="p-4">
                <div className="flex items-center gap-4 justify-between">
                  {/* Invoice Number */}
                  <div className="w-28">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Invoice</p>
                    <p className="font-mono font-bold text-gray-900 text-sm">
                      #{String(sale.sale_id).padStart(6, '0')}
                    </p>
                  </div>

                  {/* Date & Time */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Date & Time</p>
                    <p className="text-sm text-gray-900 truncate">
                      {new Date(sale.sale_date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                      <span className="text-gray-400 mx-1.5">•</span>
                      {new Date(sale.sale_date).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </p>
                  </div>

                  {/* Customer */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Customer</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{sale.customer_name}</p>
                    <p className="text-xs text-gray-500 truncate">{sale.customer_phone}</p>
                  </div>

                  {/* Total Amount - Clickable */}
                  <button
                    onClick={() => toggleSaleDetails(sale.sale_id)}
                    className="flex items-center gap-2 px-2 py-2 transition-all group"
                  >
                    <div className="text-right">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Total</p>
                      <p className="text-l font-bold text-orange-600">₹{sale.total_amount.toFixed(2)}</p>
                    </div>
                    <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </button>
                </div>
              </div>

              {/* Expanded Items Section */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gradient-to-b from-orange-50/30 to-white">
                  {isLoadingItems ? (
                    <div className="p-8 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                    </div>
                  ) : (
                    <div className="p-5">
                      {/* Items Table Header */}
                      <div className="grid grid-cols-12 gap-4 px-4 py-2 mb-2 bg-white rounded-lg border border-gray-200">
                        <div className="col-span-5 text-xs font-bold text-gray-700 uppercase tracking-wider">Product</div>
                        <div className="col-span-2 text-xs font-bold text-gray-700 uppercase tracking-wider text-center">Quantity</div>
                        <div className="col-span-2 text-xs font-bold text-gray-700 uppercase tracking-wider text-right">Price</div>
                        <div className="col-span-3 text-xs font-bold text-gray-700 uppercase tracking-wider text-right">Amount</div>
                      </div>

                      {/* Items List */}
                      <div className="space-y-1.5">
                        {items.map((item, index) => (
                          <div
                            key={index}
                            className="grid grid-cols-12 gap-4 px-4 py-3 bg-white rounded-lg border border-gray-100 transition-colors"
                          >
                            <div className="col-span-5">
                              <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                            </div>
                            <div className="col-span-2 text-center">
                              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                                {item.quantity}
                              </span>
                            </div>
                            <div className="col-span-2 text-right">
                              <p className="text-sm text-gray-700">₹{item.unit_price.toFixed(2)}</p>
                            </div>
                            <div className="col-span-3 text-right">
                              <p className="text-sm font-bold text-gray-900">₹{item.subtotal.toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Items Summary */}
                      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center px-4">
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold text-gray-900">{items.length}</span> item{items.length !== 1 ? 's' : ''} purchased
                        </p>
                        <p className="text-base font-bold text-gray-900">
                          Total: <span className="text-orange-600">₹{sale.total_amount.toFixed(2)}</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BillerBillingHistory;
