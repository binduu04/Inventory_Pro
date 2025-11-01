// import { useState, useEffect } from 'react';
// import { ShoppingCart, User, Package, LogOut, X, Plus, Minus, Search, Filter, Heart } from 'lucide-react';
// import { useAuth } from '../context/AuthContext';
// import { useNavigate } from 'react-router-dom';

// const CustomerDashboard = () => {
//   const { user, signOut, session } = useAuth();
//   const navigate = useNavigate();
  
//   const [showProfileMenu, setShowProfileMenu] = useState(false);
//   const [showCart, setShowCart] = useState(false);
//   const [showOrders, setShowOrders] = useState(false);
//   const [cartItems, setCartItems] = useState([]);
//   const [products, setProducts] = useState([]);
//   const [filteredProducts, setFilteredProducts] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedCategory, setSelectedCategory] = useState('all');
//   const [categories, setCategories] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const orderHistory = [
//     { id: 'ORD-001', date: '2025-10-25', items: 3, total: 89.97, status: 'Delivered' },
//     { id: 'ORD-002', date: '2025-10-20', items: 2, total: 56.98, status: 'Delivered' },
//     { id: 'ORD-003', date: '2025-10-15', items: 1, total: 24.99, status: 'In Transit' }
//   ];

//   useEffect(() => {
//     fetchProducts();
//     fetchCategories();
//     loadCartFromStorage();
//   }, []);

//   useEffect(() => {
//     let filtered = products;
//     if (searchTerm) {
//       filtered = filtered.filter(p => 
//         p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         p.description?.toLowerCase().includes(searchTerm.toLowerCase())
//       );
//     }
//     if (selectedCategory !== 'all') {
//       filtered = filtered.filter(p => p.category === selectedCategory);
//     }
//     setFilteredProducts(filtered);
//   }, [searchTerm, selectedCategory, products]);

//   const fetchProducts = async () => {
//     setLoading(true);
//     try {
//       const response = await fetch('http://localhost:5000/api/products/', {
//         headers: { 'Authorization': `Bearer ${session?.access_token}` }
//       });
//       const data = await response.json();
//       if (response.ok) {
//         setProducts(data.products || []);
//         setFilteredProducts(data.products || []);
//       }
//     } catch (error) {
//       console.error('Error fetching products:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchCategories = async () => {
//     try {
//       const response = await fetch('http://localhost:5000/api/products/categories', {
//         headers: { 'Authorization': `Bearer ${session?.access_token}` }
//       });
//       const data = await response.json();
//       if (response.ok) setCategories(data.categories || []);
//     } catch (error) {
//       console.error('Error fetching categories:', error);
//     }
//   };

//   const loadCartFromStorage = () => {
//     const savedCart = localStorage.getItem(`cart_${user?.id}`);
//     if (savedCart) setCartItems(JSON.parse(savedCart));
//   };

//   const saveCartToStorage = (updatedCart) => {
//     localStorage.setItem(`cart_${user?.id}`, JSON.stringify(updatedCart));
//   };

//   const getUserInitial = () => {
//     if (user?.full_name) return user.full_name.charAt(0).toUpperCase();
//     if (user?.email) return user.email.charAt(0).toUpperCase();
//     return 'U';
//   };

//   const handleLogout = async () => {
//     await signOut();
//     navigate('/login');
//   };

//   const addToCart = (product) => {
//     const existingItem = cartItems.find(item => item.id === product.id);
//     let updatedCart;
//     if (existingItem) {
//       updatedCart = cartItems.map(item =>
//         item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
//       );
//     } else {
//       updatedCart = [...cartItems, { ...product, quantity: 1 }];
//     }
//     setCartItems(updatedCart);
//     saveCartToStorage(updatedCart);
//   };

//   const updateQuantity = (productId, change) => {
//     const updatedCart = cartItems.map(item => {
//       if (item.id === productId) {
//         const newQuantity = item.quantity + change;
//         return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
//       }
//       return item;
//     }).filter(item => item.quantity > 0);
//     setCartItems(updatedCart);
//     saveCartToStorage(updatedCart);
//   };

//   const removeFromCart = (productId) => {
//     const updatedCart = cartItems.filter(item => item.id !== productId);
//     setCartItems(updatedCart);
//     saveCartToStorage(updatedCart);
//   };

//   const calculateDiscountedPrice = (price, discountPercentage) => {
//     if (!discountPercentage || discountPercentage <= 0) return price;
//     return price * (1 - discountPercentage / 100);
//   };

//   const cartTotal = cartItems.reduce((sum, item) => {
//     const price = calculateDiscountedPrice(item.price, item.discount_percentage || 0);
//     return sum + (price * item.quantity);
//   }, 0);
  
//   const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
//       <header className="bg-white border-b border-green-100 sticky top-0 z-40 shadow-sm">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center h-14">
//             <div className="flex items-center space-x-2">
//               <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
//                 <span className="text-white font-bold text-lg">🍃</span>
//               </div>
//               <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600">
//                 GreenMart
//               </h1>
//             </div>

//             <div className="flex items-center space-x-3">
//               <button
//                 onClick={() => setShowCart(true)}
//                 className="relative p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
//               >
//                 <ShoppingCart className="w-5 h-5" />
//                 {cartCount > 0 && (
//                   <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center">
//                     {cartCount}
//                   </span>
//                 )}
//               </button>

//               <div className="relative">
//                 <button
//                   onClick={() => setShowProfileMenu(!showProfileMenu)}
//                   className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-green-600 text-white font-semibold rounded-full flex items-center justify-center hover:shadow-lg transition-all text-sm"
//                 >
//                   {getUserInitial()}
//                 </button>

//                 {showProfileMenu && (
//                   <>
//                     <div className="fixed inset-0 z-30" onClick={() => setShowProfileMenu(false)}></div>
//                     <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-40">
//                       <div className="px-4 py-3 border-b border-gray-100">
//                         <p className="font-semibold text-gray-900 text-sm truncate">{user?.full_name || 'User'}</p>
//                         <p className="text-xs text-gray-500 truncate">{user?.email}</p>
//                       </div>
//                       <button
//                         onClick={() => { setShowOrders(true); setShowProfileMenu(false); }}
//                         className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-emerald-50 flex items-center space-x-2 transition-colors"
//                       >
//                         <Package className="w-4 h-4 text-emerald-600" />
//                         <span>My Orders</span>
//                       </button>
//                       <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-emerald-50 flex items-center space-x-2 transition-colors">
//                         <User className="w-4 h-4 text-emerald-600" />
//                         <span>Profile</span>
//                       </button>
//                       <div className="border-t border-gray-100 mt-1">
//                         <button 
//                           onClick={handleLogout}
//                           className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors"
//                         >
//                           <LogOut className="w-4 h-4" />
//                           <span>Logout</span>
//                         </button>
//                       </div>
//                     </div>
//                   </>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </header>

//       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
//         <div className="mb-6">
//           <h2 className="text-2xl font-bold text-gray-900 mb-1">
//             Welcome back, {user?.full_name?.split(' ')[0] || 'Customer'}! 👋
//           </h2>
//           <p className="text-sm text-gray-600">Discover our premium organic products</p>
//         </div>

//         <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
//           <div className="flex flex-col sm:flex-row gap-3">
//             <div className="flex-1 relative">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
//               <input
//                 type="text"
//                 placeholder="Search products..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
//               />
//             </div>
//             <div className="flex items-center gap-2">
//               <Filter className="w-4 h-4 text-gray-400" />
//               <select
//                 value={selectedCategory}
//                 onChange={(e) => setSelectedCategory(e.target.value)}
//                 className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white cursor-pointer"
//               >
//                 <option value="all">All Categories</option>
//                 {categories.map(cat => (
//                   <option key={cat} value={cat}>{cat}</option>
//                 ))}
//               </select>
//             </div>
//           </div>
//         </div>

//         {loading ? (
//           <div className="text-center py-12 text-gray-500">Loading products...</div>
//         ) : filteredProducts.length === 0 ? (
//           <div className="text-center py-12 text-gray-500">No products found</div>
//         ) : (
//           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
//             {filteredProducts.map((product) => {
//               const hasDiscount = product.discount_percentage > 0;
//               const discountedPrice = calculateDiscountedPrice(product.price, product.discount_percentage);
//               const cartItem = cartItems.find(item => item.id === product.id);
//               const quantityInCart = cartItem ? cartItem.quantity : 0;
              
//               return (
//                 <div key={product.id} className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden">
//                   {/* Product Image with Discount Badge */}
//                   <div className="relative bg-gray-50 p-4">
//                     {hasDiscount && (
//                       <div className="absolute top-2 left-2 bg-emerald-500 text-white px-3 py-1 rounded-md text-xs font-bold z-10">
//                         {product.discount_percentage}% OFF
//                       </div>
//                     )}
                    
//                     <div className="aspect-square flex items-center justify-center">
//                       <img
//                         src={product.image_url || 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&h=400&fit=crop'}
//                         alt={product.name}
//                         className="w-full h-full object-contain"
//                       />
//                     </div>

//                     {product.stock_quantity === 0 && (
//                       <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
//                         <span className="bg-white text-gray-900 px-4 py-2 rounded-lg font-semibold text-sm">Out of Stock</span>
//                       </div>
//                     )}
//                   </div>

//                   {/* Product Details */}
//                   <div className="p-4">
//                     {/* Product Name */}
//                     <h3 className="font-semibold text-gray-900 text-base mb-2 line-clamp-2 min-h-[3rem]">
//                       {product.name}
//                     </h3>

//                     {/* Weight/Size */}
//                     <p className="text-sm text-gray-500 mb-3">
//                       {product.category || 'General'}
//                     </p>

//                     {/* Price Section */}
//                     <div className="flex items-center gap-2 mb-4">
//                       <span className="text-xl font-bold text-gray-900">
//                         ₹{discountedPrice}
//                       </span>
//                       {hasDiscount && (
//                         <>
//                           <span className="text-sm text-gray-400 line-through">
//                             ₹{product.price}
//                           </span>
//                           <span className="text-xs font-semibold text-emerald-600">
//                             {product.discount_percentage}% OFF
//                           </span>
//                         </>
//                       )}
//                     </div>

//                     {/* Add to Cart / Quantity Controls */}
//                     {product.stock_quantity === 0 ? (
//                       <button
//                         disabled
//                         className="w-full py-2.5 rounded-lg bg-gray-200 text-gray-500 font-semibold text-sm cursor-not-allowed"
//                       >
//                         Out of Stock
//                       </button>
//                     ) : quantityInCart > 0 ? (
//                       <div className="flex items-center justify-between border-2 border-emerald-500 rounded-lg px-3 py-2">
//                         <button
//                           onClick={() => updateQuantity(product.id, -1)}
//                           className="w-8 h-8 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors font-bold text-lg"
//                         >
//                           −
//                         </button>
//                         <span className="font-bold text-emerald-600 text-lg">
//                           {quantityInCart}
//                         </span>
//                         <button
//                           onClick={() => updateQuantity(product.id, 1)}
//                           className="w-8 h-8 flex items-center justify-center text-white bg-emerald-500 hover:bg-emerald-600 rounded-md transition-colors font-bold text-lg"
//                         >
//                           +
//                         </button>
//                       </div>
//                     ) : (
//                       <button
//                         onClick={() => addToCart(product)}
//                         className="w-full py-2.5 rounded-lg border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-500 hover:text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
//                       >
//                         <Plus className="w-4 h-4" />
//                         ADD
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </main>

//       {showCart && (
//         <>
//           <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowCart(false)}></div>
//           <div className="fixed right-0 top-0 w-full sm:w-96 h-full bg-white shadow-2xl z-50 flex flex-col">
//             <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-5 py-4 flex justify-between items-center">
//               <h2 className="text-lg font-bold">Shopping Cart ({cartCount})</h2>
//               <button onClick={() => setShowCart(false)} className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-all">
//                 <X className="w-5 h-5" />
//               </button>
//             </div>

//             <div className="flex-1 overflow-y-auto p-4">
//               {cartItems.length === 0 ? (
//                 <div className="text-center py-12">
//                   <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-3" />
//                   <p className="text-gray-500 text-sm">Your cart is empty</p>
//                 </div>
//               ) : (
//                 <div className="space-y-4">
//                   {cartItems.map((item) => {
//                     const itemPrice = calculateDiscountedPrice(item.price, item.discount_percentage || 0);
//                     return (
//                       <div key={item.id} className="flex gap-4 bg-white border border-gray-200 p-4 rounded-lg">
//                         <div className="w-24 h-24 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
//                           <img 
//                             src={item.image_url || 'https://via.placeholder.com/80'} 
//                             alt={item.name} 
//                             className="w-full h-full object-contain rounded-lg" 
//                           />
//                         </div>
//                         <div className="flex-1 flex flex-col">
//                           <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{item.name}</h3>
//                           <p className="text-sm text-gray-500 mb-2">{item.category || 'General'}</p>
                          
//                           <div className="flex items-center justify-between mt-auto">
//                             <p className="text-lg font-bold text-gray-900">₹{itemPrice}</p>
                            
//                             <div className="flex items-center gap-3">
//                               <div className="flex items-center border-2 border-emerald-500 rounded-lg">
//                                 <button 
//                                   onClick={() => updateQuantity(item.id, -1)} 
//                                   className="w-8 h-8 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 rounded-l-md font-bold"
//                                 >
//                                   −
//                                 </button>
//                                 <span className="font-semibold text-emerald-600 px-3">{item.quantity}</span>
//                                 <button 
//                                   onClick={() => updateQuantity(item.id, 1)} 
//                                   className="w-8 h-8 flex items-center justify-center text-white bg-emerald-500 hover:bg-emerald-600 rounded-r-md font-bold"
//                                 >
//                                   +
//                                 </button>
//                               </div>
                              
//                               <button 
//                                 onClick={() => removeFromCart(item.id)} 
//                                 className="text-red-500 hover:text-red-700 p-2"
//                               >
//                                 <X className="w-5 h-5" />
//                               </button>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               )}
//             </div>

//             {cartItems.length > 0 && (
//               <div className="border-t border-gray-200 p-5 bg-white">
//                 <div className="space-y-3 mb-4">
//                   <div className="flex justify-between text-sm text-gray-600">
//                     <span>Subtotal ({cartCount} items)</span>
//                     <span className="font-semibold">₹{cartTotal}</span>
//                   </div>
//                   <div className="flex justify-between text-sm text-gray-600">
//                     <span>Delivery Charges</span>
//                     <span className="font-semibold text-emerald-600">FREE</span>
//                   </div>
//                   <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
//                     <span>Total Amount</span>
//                     <span className="text-emerald-600">₹{cartTotal}</span>
//                   </div>
//                 </div>
//                 <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-lg font-semibold text-base transition-all shadow-md hover:shadow-lg">
//                   Proceed to Checkout
//                 </button>
//               </div>
//             )}
//           </div>
//         </>
//       )}

//       {showOrders && (
//         <>
//           <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowOrders(false)}></div>
//           <div className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-2xl sm:max-h-[80vh] bg-white rounded-xl shadow-2xl z-50 flex flex-col">
//             <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-5 py-4 flex justify-between items-center rounded-t-xl">
//               <h2 className="text-lg font-bold">My Orders</h2>
//               <button onClick={() => setShowOrders(false)} className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-all">
//                 <X className="w-5 h-5" />
//               </button>
//             </div>

//             <div className="flex-1 overflow-y-auto p-5">
//               <div className="space-y-3">
//                 {orderHistory.map((order) => (
//                   <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
//                     <div className="flex justify-between items-start mb-2">
//                       <div>
//                         <p className="font-bold text-gray-900 text-sm">{order.id}</p>
//                         <p className="text-xs text-gray-500">{new Date(order.date).toLocaleDateString()}</p>
//                       </div>
//                       <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
//                         order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
//                       }`}>
//                         {order.status}
//                       </span>
//                     </div>
//                     <div className="flex justify-between text-sm">
//                       <span className="text-gray-600">{order.items} items</span>
//                       <span className="font-bold text-emerald-600">₹{order.total}</span>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// export default CustomerDashboard;


import { useState, useEffect } from 'react';
import { ShoppingCart, User, Package, LogOut, X, Search, Filter, RocketIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Cart from '../components/Cart';
import ProductCard from '../components/ProductCard';

const CustomerDashboard = () => {
  const { user, signOut, session } = useAuth();
  const navigate = useNavigate();
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const orderHistory = [
    { id: 'ORD-001', date: '2025-10-25', items: 3, total: 89.97, status: 'Delivered' },
    { id: 'ORD-002', date: '2025-10-20', items: 2, total: 56.98, status: 'Delivered' },
    { id: 'ORD-003', date: '2025-10-15', items: 1, total: 24.99, status: 'In Transit' }
  ];

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
        console.log('Fetched products:', data.products); // Debug log
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* Header */}
      <header className="bg-white border-b border-green-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                <RocketIcon className="w-5 h-5 text-white absolute" />
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
                        onClick={() => { setShowOrders(true); setShowProfileMenu(false); }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-emerald-50 flex items-center space-x-2 transition-colors"
                      >
                        <Package className="w-4 h-4 text-emerald-600" />
                        <span>My Orders</span>
                      </button>
                      <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-emerald-50 flex items-center space-x-2 transition-colors">
                        <User className="w-4 h-4 text-emerald-600" />
                        <span>Profile</span>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

      {/* Cart Component */}
      <Cart
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        cartItems={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        calculateDiscountedPrice={calculateDiscountedPrice}
      />

      {/* Orders Modal */}
      {showOrders && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowOrders(false)}></div>
          <div className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-2xl sm:max-h-[80vh] bg-white rounded-xl shadow-2xl z-50 flex flex-col">
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-5 py-4 flex justify-between items-center rounded-t-xl">
              <h2 className="text-lg font-bold">My Orders</h2>
              <button onClick={() => setShowOrders(false)} className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="space-y-3">
                {orderHistory.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{order.id}</p>
                        <p className="text-xs text-gray-500">{new Date(order.date).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{order.items} items</span>
                      <span className="font-bold text-emerald-600">₹{order.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomerDashboard;
