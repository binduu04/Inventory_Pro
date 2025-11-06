import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, FileText, LogOut, Plus, Minus, Trash2, Receipt, Search, X, Menu, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const BillerDashboard = () => {
  const { user, signOut, session } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('create-order');
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [customerDetailsOpen, setCustomerDetailsOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(`biller_cart_${user?.id}`);
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, [user]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`biller_cart_${user.id}`, JSON.stringify(cart));
    }
  }, [cart, user]);

  // Fetch categories on mount
  useEffect(() => {
    if (session?.access_token) {
      fetchCategories();
    }
  }, [session]);

  // Fetch products when category changes
  useEffect(() => {
    if (session?.access_token) {
      fetchProducts();
    }
  }, [selectedCategory, session]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const url = selectedCategory === 'all' 
        ? 'http://localhost:5000/api/billers/products'
        : `http://localhost:5000/api/billers/products?category=${selectedCategory}`;
      
      console.log('Fetching products from:', url);
      console.log('Session token:', session?.access_token ? 'Available' : 'Missing');
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Products fetched:', data.products?.length || 0);
        setProducts(data.products || []);
      } else {
        const error = await response.text();
        console.error('Failed to fetch products:', response.status, error);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      console.log('Fetching categories...');
      const response = await fetch('http://localhost:5000/api/billers/categories', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Categories fetched:', data.categories);
        setCategories(data.categories || []);
      } else {
        const error = await response.text();
        console.error('Failed to fetch categories:', response.status, error);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const filteredProducts = products.filter(product =>
    product.product_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart(cart.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
  };

  const getSubtotal = () => {
    return cart.reduce((sum, item) => {
      const price = item.final_price || item.selling_price || item.price;
      return sum + (price * item.quantity);
    }, 0);
  };

  const getTotal = () => {
    return getSubtotal();
  };

  const generateBill = () => {
    if (cart.length === 0) {
      alert('Please add items to cart');
      return;
    }
    
    const billDetails = `
Bill Generated Successfully!
Customer: ${customerName || 'Walk-in Customer'}
Phone: ${customerPhone || 'N/A'}
Items: ${cart.length}
Total: ₹${getTotal().toFixed(2)}
    `;
    
    alert(billDetails);
    clearCart();
  };

  const getFirstName = (name) => {
    if (!name) return 'U';
    return name.split(' ')[0].charAt(0).toUpperCase();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-55' : 'w-20'} bg-white border-r border-gray-200 flex flex-col shadow-sm transition-all duration-300`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className={`${sidebarOpen ? 'block' : 'hidden'}`}>
            <h2 className="text-xl font-bold text-gray-800">Biller Portal</h2>
            <p className="text-gray-500 text-xs mt-1">Point of Sale</p>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all"
          >
            <Menu size={20} className="text-gray-600" />
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          <button
            onClick={() => setActiveTab('approve-orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'approve-orders' 
                ? 'bg-orange-50 text-orange-600 font-medium' 
                : 'hover:bg-gray-50 text-gray-700'
            }`}
            title="Approve Online Orders"
          >
            <Package size={20} />
            <span className={`${sidebarOpen ? 'block' : 'hidden'}`}>Approve Orders</span>
          </button>

          <button
            onClick={() => setActiveTab('create-order')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'create-order' 
                ? 'bg-orange-50 text-orange-600 font-medium' 
                : 'hover:bg-gray-50 text-gray-700'
            }`}
            title="Create In-Store Order"
          >
            <ShoppingCart size={20} />
            <span className={`${sidebarOpen ? 'block' : 'hidden'}`}>Create Order</span>
          </button>

          <button
            onClick={() => setActiveTab('billing-history')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'billing-history' 
                ? 'bg-orange-50 text-orange-600 font-medium' 
                : 'hover:bg-gray-50 text-gray-700'
            }`}
            title="My Billing History"
          >
            <FileText size={20} />
            <span className={`${sidebarOpen ? 'block' : 'hidden'}`}>Billing History</span>
          </button>
        </nav>

        <div className="p-2 border-t border-gray-200 space-y-1">
          <div className="w-full flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center font-semibold text-sm text-orange-600">
              {getFirstName(user?.full_name || user?.email)}
            </div>
            <span className={`${sidebarOpen ? 'block' : 'hidden'} text-gray-700 text-sm`}>{user?.full_name || user?.email}</span>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 transition-all"
            title="Logout"
          >
            <LogOut size={20} />
            <span className={`${sidebarOpen ? 'block' : 'hidden'}`}>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-3">
          <h1 className="text-lg font-semibold text-gray-800">
            {activeTab === 'approve-orders' && 'Approve Online Orders'}
            {activeTab === 'create-order' && 'Create In-Store Order'}
            {activeTab === 'billing-history' && 'My Billing History'}
          </h1>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-hidden">
          {activeTab === 'approve-orders' && (
            <div className="h-full flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <Package size={80} className="mx-auto text-gray-300 mb-4" />
                <h2 className="text-3xl font-bold text-gray-700 mb-2">Coming Soon</h2>
                <p className="text-gray-500">Online order approval feature will be available soon</p>
              </div>
            </div>
          )}

          {activeTab === 'billing-history' && (
            <div className="h-full flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <FileText size={80} className="mx-auto text-gray-300 mb-4" />
                <h2 className="text-3xl font-bold text-gray-700 mb-2">Coming Soon</h2>
                <p className="text-gray-500">Billing history feature will be available soon</p>
              </div>
            </div>
          )}

          {activeTab === 'create-order' && (
            <div className="h-full flex">
              {/* Left Side - Products */}
              <div className="flex-1 flex flex-col bg-white">
                {/* Search Bar and Filter */}
                <div className="p-6 border-b border-gray-200 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search product by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      autoFocus
                    />
                  </div>
                  
                  {/* Category Filter */}
                  <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-500" />
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                          selectedCategory === 'all'
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        All
                      </button>
                      {categories.map(category => (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                            selectedCategory === category
                              ? 'bg-orange-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Products Grid */}
                <div className="flex-1 overflow-auto p-6">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading products...</p>
                      </div>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-400">
                        <ShoppingCart size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No products found</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-4">
                      {filteredProducts.map(product => (
                        <button
                          key={product.id}
                          onClick={() => addToCart(product)}
                          className="border border-gray-200 rounded-lg p-3 hover:shadow-md hover:border-orange-400 transition-all bg-white text-left active:scale-95"
                        >
                          <div className="flex flex-col h-full">
                            {/* Product Image */}
                            {product.image_url && (
                              <div className="w-full h-24 mb-2 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                                <img 
                                  src={product.image_url} 
                                  alt={product.product_name}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            )}
                            
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-2">{product.product_name}</h3>
                              {/* <p className="text-xs text-gray-500">Stock: {product.current_stock}</p> */}
                            </div>
                            
                            <div className="mt-2 flex justify-between items-end">
                              <div className="flex-1">
                                {product.discount_percent > 0 ? (
                                  <div>
                                    <div className="flex items-center gap-1">
                                      <p className="text-xs text-gray-400 line-through">₹{product.selling_price}</p>
                                      <span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded font-semibold">{product.discount_percent}% OFF</span>
                                    </div>
                                    <p className="text-lg font-bold text-orange-600">₹{product.final_price.toFixed(2)}</p>
                                  </div>
                                ) : (
                                  <p className="text-lg font-bold text-gray-800">₹{product.selling_price}</p>
                                )}
                              </div>
                              <Plus size={20} className="text-orange-600 flex-shrink-0" />
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side - Cart/Bill */}
              <div className="w-96 bg-white border-l border-gray-200 flex flex-col shadow-lg">
                {/* Cart Items - Starting from top */}
                <div className="flex-1 overflow-auto p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-gray-800">Items ({cart.length})</h3>
                    {cart.length > 0 && (
                      <button
                        onClick={clearCart}
                        className="text-sm text-red-600 hover:text-red-700 px-3 py-1 rounded-lg flex items-center gap-1"
                      >
                        <X size={14} />
                        Clear
                      </button>
                    )}
                  </div>
                  
                  {cart.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <ShoppingCart size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No items in cart</p>
                      <p className="text-sm mt-2">Start scanning products</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cart.map(item => {
                        const price = item.final_price || item.selling_price || item.price;
                        const hasDiscount = (item.discount_percent || 0) > 0;
                        
                        return (
                          <div key={item.id} className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm text-gray-800">{item.product_name || item.name}</h4>
                                <div className="flex items-center gap-2 text-xs">
                                  {hasDiscount ? (
                                    <>
                                      <span className="text-gray-400 line-through">₹{item.selling_price}</span>
                                      <span className="text-orange-600 font-semibold">₹{price.toFixed(2)}</span>
                                      <span className="bg-green-600 text-white px-1.5 py-0.5 rounded font-semibold">{item.discount_percent}% OFF</span>
                                    </>
                                  ) : (
                                    <span className="text-gray-600">₹{price.toFixed(2)}</span>
                                  )}
                                  <span className="text-gray-500">× {item.quantity}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="text-red-500 hover:text-red-600 ml-2"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="w-7 h-7 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                                >
                                  <Minus size={14} />
                                </button>
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                                  className="w-10 text-center bg-transparent font-semibold text-gray-800 text-sm"
                                  min="1"
                                />
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="w-7 h-7 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                              <span className="font-bold text-gray-800">
                                ₹{(price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Bill Summary */}
                {cart.length > 0 && (
                  <div className="border-t border-gray-200 p-4 bg-white">
                    {/* Customer Info - Collapsible */}
                    <div className="mb-4">
                      <button
                        onClick={() => setCustomerDetailsOpen(!customerDetailsOpen)}
                        className="text-sm text-orange-600 hover:text-orange-700 underline font-medium flex items-center gap-1"
                      >
                        <span>Enter Customer Details</span>
                        {customerDetailsOpen ? (
                          <ChevronUp size={14} />
                        ) : (
                          <ChevronDown size={14} />
                        )}
                      </button>
                      
                      {customerDetailsOpen && (
                        <div className="mt-2 space-y-2">
                          <input
                            type="text"
                            placeholder="Customer Name (Optional)"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                          <input
                            type="tel"
                            placeholder="Phone Number (Optional)"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-1 mb-3 pt-3 border-t border-gray-200">
                      <div className="flex justify-between text-m font-bold text-gray-800">
                        <span>TOTAL :</span>
                        <span>₹{getTotal().toFixed(2)}</span>
                      </div>
                    </div>

                    <button
                      onClick={generateBill}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-1.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
                    >
                      GENERATE BILL
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default BillerDashboard;
