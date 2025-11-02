import { useState, useEffect } from 'react';
import { ShoppingCart, User, Package, LogOut, X, Search, Filter, RocketIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Cart from '../components/Cart';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';
import ProfileModal from '../components/ProfileModal';
import  CustomAlert from '../components/CustomAlert';

const CustomerDashboard = () => {
  const { user, signOut, session } = useAuth();
  const navigate = useNavigate();
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({
  isOpen: false,
  type: 'success',
  title: '',
  message: ''
});

  const orderHistory = [
    { id: 'ORD-001', date: '2025-10-25', items: 3, total: 89.97, status: 'Delivered' },
    { id: 'ORD-002', date: '2025-10-20', items: 2, total: 56.98, status: 'Delivered' },
    { id: 'ORD-003', date: '2025-10-15', items: 1, total: 24.99, status: 'In Transit' },
  { id: 'ORD-004', date: '2025-10-15', items: 1, total: 24.99, status: 'In Transit' }, { id: 'ORD-005', date: '2025-10-15', items: 1, total: 24.99, status: 'In Transit' }, { id: 'ORD-006', date: '2025-10-15', items: 1, total: 24.99, status: 'In Transit' }];

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    loadCartFromStorage();
  }, []);

  useEffect(() => {
    let filtered = products;
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    setFilteredProducts(filtered);
  }, [searchTerm, selectedCategory, products]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/products/', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      const data = await response.json();
      if (response.ok) {
        console.log('Fetched products:', data.products);
        setProducts(data.products || []);
        setFilteredProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products/categories', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      const data = await response.json();
      if (response.ok) setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const loadCartFromStorage = () => {
    const savedCart = localStorage.getItem(`cart_${user?.id}`);
    if (savedCart) setCartItems(JSON.parse(savedCart));
  };

  const saveCartToStorage = (updatedCart) => {
    localStorage.setItem(`cart_${user?.id}`, JSON.stringify(updatedCart));
  };

  const getUserInitial = () => {
    if (user?.full_name) return user.full_name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

const handleUpdateUser = async (updatedUser) => {
  try {
    const response = await fetch('http://localhost:5000/api/customer/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        full_name: updatedUser.full_name,
        phone: updatedUser.phone
      })
    });

    const data = await response.json();

    if (response.ok) {
      setAlert({
        isOpen: true,
        type: 'success',
        title: 'Success!',
        message: 'Profile updated successfully'
      });
      // Refresh after a delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      setAlert({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: data.error || 'Failed to update profile'
      });
    }
  } catch (error) {
    setAlert({
      isOpen: true,
      type: 'error',
      title: 'Error',
      message: 'Failed to update profile. Please try again.'
    });
  }
};
  const addToCart = (product) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    let updatedCart;
    if (existingItem) {
      updatedCart = cartItems.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      updatedCart = [...cartItems, { ...product, quantity: 1 }];
    }
    setCartItems(updatedCart);
    saveCartToStorage(updatedCart);
  };

  const updateQuantity = (productId, change) => {
    const updatedCart = cartItems.map(item => {
      if (item.id === productId) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0);
    setCartItems(updatedCart);
    saveCartToStorage(updatedCart);
  };

  const removeFromCart = (productId) => {
    const updatedCart = cartItems.filter(item => item.id !== productId);
    setCartItems(updatedCart);
    saveCartToStorage(updatedCart);
  };

  const calculateDiscountedPrice = (price, discountPercentage) => {
    if (!discountPercentage || discountPercentage <= 0) return price;
    return price * (1 - discountPercentage / 100);
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-green-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                <RocketIcon className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600">
                QuickMart
              </h1>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowCart(true)}
                className="relative p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-green-600 text-white font-semibold rounded-full flex items-center justify-center hover:shadow-lg transition-all text-sm"
                >
                  {getUserInitial()}
                </button>

                {showProfileMenu && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowProfileMenu(false)}></div>
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-40">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-semibold text-gray-900 text-sm truncate">{user?.full_name || 'User'}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                      <button
                        onClick={() => { 
                          setShowProfileModal(true); 
                          setShowProfileMenu(false); 
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-emerald-50 flex items-center space-x-2 transition-colors"
                      >
                        <User className="w-4 h-4 text-emerald-600" />
                        <span>My Account</span>
                      </button>
                      <div className="border-t border-gray-100 mt-1">
                        <button 
                          onClick={handleLogout}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Welcome back, {user?.full_name?.split(' ')[0] || 'Customer'}! 👋
          </h2>
          <p className="text-sm text-gray-600">Discover our products</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No products found</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredProducts.map((product) => {
              const cartItem = cartItems.find(item => item.id === product.id);
              const quantityInCart = cartItem ? cartItem.quantity : 0;
              
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  quantityInCart={quantityInCart}
                  onAddToCart={addToCart}
                  onUpdateQuantity={updateQuantity}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Cart Component */}
      <Cart
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        cartItems={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        calculateDiscountedPrice={calculateDiscountedPrice}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        onUpdateUser={handleUpdateUser}
        orders={orderHistory}
      />

      {/* Custom Alert */}
<CustomAlert
  isOpen={alert.isOpen}
  onClose={() => setAlert({ ...alert, isOpen: false })}
  type={alert.type}
  title={alert.title}
  message={alert.message}
/>
    </div>
  );
};

export default CustomerDashboard;
