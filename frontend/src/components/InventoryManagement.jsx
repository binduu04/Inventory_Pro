import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, Search, Package, AlertTriangle, Upload, X, Image as ImageIcon, CheckSquare, Square } from 'lucide-react';

const InventoryManagement = () => {
  const { session } = useAuth();
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedProducts, setSelectedProducts] = useState([]);

  const categories = ['Dairy', 'Beverages', 'Snacks', 'Staples', 'Personal Care'];
  const seasons = ['Summer', 'Winter', 'Monsoon', 'All'];

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
  }, []);

  // Auto-dismiss message after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = 'http://localhost:5000/api/products/';
      const params = new URLSearchParams();
      
      if (filterCategory) params.append('category', filterCategory);
      if (filterSupplier) params.append('supplier_id', filterSupplier);
      if (showLowStock) {
        url = 'http://localhost:5000/api/products/low-stock';
      } else if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setMessage({ type: 'error', text: 'Failed to load products' });
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/suppliers/', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setSuppliers(data.suppliers || []);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filterCategory, filterSupplier, showLowStock]);

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Product deleted successfully' });
        setProducts(products.filter(p => p.id !== productId));
        setSelectedProducts(selectedProducts.filter(id => id !== productId));
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to delete product' });
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      setMessage({ type: 'error', text: 'Network error' });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) {
      setMessage({ type: 'error', text: 'No products selected' });
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedProducts.length} product(s)?`)) return;

    try {
      const deletePromises = selectedProducts.map(productId =>
        fetch(`http://localhost:5000/api/products/${productId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        })
      );

      const results = await Promise.all(deletePromises);
      const successCount = results.filter(r => r.ok).length;
      
      if (successCount > 0) {
        setMessage({ type: 'success', text: `${successCount} product(s) deleted successfully` });
        setProducts(products.filter(p => !selectedProducts.includes(p.id)));
        setSelectedProducts([]);
      } else {
        setMessage({ type: 'error', text: 'Failed to delete products' });
      }
    } catch (error) {
      console.error('Error deleting products:', error);
      setMessage({ type: 'error', text: 'Network error during bulk delete' });
    }
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const toggleSelectProduct = (productId) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  const filteredProducts = products.filter(product =>
    product.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isLowStock = (product) => {
    return product.current_stock <= product.safety_stock;
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Inventory Management</h1>

      {/* Custom Alert - Fixed Position */}
      {message.text && (
        <div className={`fixed top-2 right-4 z-50 animate-slide-in rounded-lg shadow-lg max-w-md p-4 ${
          message.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          <div className="flex items-center justify-between">
            <span className="font-medium">{message.text}</span>
            <button onClick={() => setMessage({ type: '', text: '' })} className="hover:bg-white/20 rounded p-1 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {!showAddForm && !editingProduct ? (
        <>
          {/* Filters and Actions */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={filterSupplier}
                onChange={(e) => setFilterSupplier(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              >
                <option value="">All Suppliers</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>{supplier.company}</option>
                ))}
              </select>

              <button
                onClick={() => setShowLowStock(!showLowStock)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  showLowStock
                    ? 'bg-red-100 text-red-700 border border-red-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <AlertTriangle size={18} />
                  Low Stock Only
                </div>
              </button>
            </div>

            <div className="flex justify-between items-center">
              {selectedProducts.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  <Trash2 size={20} />
                  Delete Selected ({selectedProducts.length})
                </button>
              )}
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium ml-auto"
              >
                <Plus size={20} />
                Add Product
              </button>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading products...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <button
                          onClick={toggleSelectAll}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {selectedProducts.length === filteredProducts.length && filteredProducts.length > 0 ? (
                            <CheckSquare size={20} />
                          ) : (
                            <Square size={20} />
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Selling Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => (
                        <tr key={product.id} className={`hover:bg-gray-50 transition-colors ${isLowStock(product) ? 'bg-red-50' : ''}`}>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => toggleSelectProduct(product.id)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              {selectedProducts.includes(product.id) ? (
                                <CheckSquare size={20} className="text-indigo-600" />
                              ) : (
                                <Square size={20} />
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.product_name}
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                <ImageIcon size={20} className="text-gray-400" />
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{product.product_name}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <span className="badge whitespace-nowrap px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
                              {product.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {suppliers.find(s => s.id === product.supplier_id)?.company || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">₹{parseFloat(product.cost_price).toFixed(2)}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">₹{parseFloat(product.selling_price).toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <div className={`font-medium ${isLowStock(product) ? 'text-red-600' : 'text-gray-900'}`}>
                                {product.current_stock}
                                {isLowStock(product) && <AlertTriangle size={14} className="inline ml-1" />}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => setEditingProduct(product)}
                              className="text-indigo-600 hover:text-indigo-900 mr-3 inline-flex items-center gap-1"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                          {searchTerm || filterCategory || filterSupplier || showLowStock
                            ? 'No products found matching your filters'
                            : 'No products added yet'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <ProductForm
          product={editingProduct}
          suppliers={suppliers}
          categories={categories}
          seasons={seasons}
          onCancel={() => {
            setShowAddForm(false);
            setEditingProduct(null);
          }}
          onSuccess={(savedProduct, message) => {
            setShowAddForm(false);
            if (editingProduct) {
              setProducts(products.map(p => p.id === savedProduct.id ? savedProduct : p));
            } else {
              setProducts([savedProduct, ...products]);
            }
            setMessage({ type: 'success', text: message });
            setEditingProduct(null);
          }}
          onError={(errorMsg) => {
            setMessage({ type: 'error', text: errorMsg });
          }}
        />
      )}
    </div>
  );
};

const ProductForm = ({ product, suppliers, categories, seasons, onCancel, onSuccess, onError }) => {
  const { session } = useAuth();
  const [formData, setFormData] = useState({
    product_name: product?.product_name || '',
    category: product?.category || '',
    season_affinity: product?.season_affinity || 'All',
    supplier_id: product?.supplier_id || '',
    cost_price: product?.cost_price || '',
    selling_price: product?.selling_price || '',
    current_stock: product?.current_stock || '',
    is_forecastable: product?.is_forecastable || false,
    image_url: product?.image_url || '',
    festival_discount_percent: product?.festival_discount_percent || 0,
    flash_sale_discount_percent: product?.flash_sale_discount_percent || 0
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(product?.image_url || '');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        onError('Please select a valid image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        onError('Image size should be less than 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.product_name || !formData.category || !formData.supplier_id || 
        !formData.cost_price || !formData.selling_price || !formData.current_stock) {
      onError('Please fill all required fields');
      setLoading(false);
      return;
    }

    if (parseFloat(formData.cost_price) < 0 || parseFloat(formData.selling_price) < 0) {
      onError('Prices cannot be negative');
      setLoading(false);
      return;
    }

    if (parseInt(formData.current_stock) < 0) {
      onError('Stock values cannot be negative');
      setLoading(false);
      return;
    }

    if (parseFloat(formData.festival_discount_percent) < 0 || parseFloat(formData.festival_discount_percent) > 100) {
      onError('Festival discount must be between 0 and 100');
      setLoading(false);
      return;
    }

    if (parseFloat(formData.flash_sale_discount_percent) < 0 || parseFloat(formData.flash_sale_discount_percent) > 100) {
      onError('Flash sale discount must be between 0 and 100');
      setLoading(false);
      return;
    }

    try {
      const url = product 
        ? `http://localhost:5000/api/products/${product.id}`
        : 'http://localhost:5000/api/products/';
      
      // Use FormData for both add and update to send image file
      const formDataToSend = new FormData();
      formDataToSend.append('product_name', formData.product_name);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('season_affinity', formData.season_affinity);
      formDataToSend.append('supplier_id', formData.supplier_id);
      formDataToSend.append('cost_price', formData.cost_price);
      formDataToSend.append('selling_price', formData.selling_price);
      formDataToSend.append('current_stock', formData.current_stock);
      formDataToSend.append('safety_stock', '5'); // Default value
      formDataToSend.append('lead_time_days', '1'); // Default value
      formDataToSend.append('is_forecastable', formData.is_forecastable);
      formDataToSend.append('festival_discount_percent', formData.festival_discount_percent);
      formDataToSend.append('flash_sale_discount_percent', formData.flash_sale_discount_percent);
      
      // Append image file if present
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      const response = await fetch(url, {
        method: product ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: formDataToSend
      });

      if (response.ok) {
        const data = await response.json();
        onSuccess(data.product, product ? 'Product updated successfully' : 'Product added successfully');
      } else {
        const data = await response.json();
        onError(data.error || 'Failed to save product');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      onError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-w-4xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {product ? 'Edit Product' : 'Add New Product'}
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.product_name}
              onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="Enter unique product name"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Season */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Season Affinity <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.season_affinity}
              onChange={(e) => setFormData({ ...formData, season_affinity: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            >
              {seasons.map(season => (
                <option key={season} value={season}>{season}</option>
              ))}
            </select>
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supplier <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.supplier_id}
              onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            >
              <option value="">Select Supplier</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>{supplier.company}</option>
              ))}
            </select>
          </div>

          {/* Cost Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cost Price (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.cost_price}
              onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="0.00"
            />
          </div>

          {/* Selling Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selling Price (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.selling_price}
              onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="0.00"
            />
          </div>

          {/* Current Stock */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Stock <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              value={formData.current_stock}
              onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="0"
            />
          </div>

         
          

          {/* Festival Discount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Festival Discount (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.festival_discount_percent}
              onChange={(e) => setFormData({ ...formData, festival_discount_percent: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="0.00"
            />
            <p className="text-xs text-gray-500 mt-1">For Diwali/Christmas/Navratri sales</p>
          </div>

          {/* Flash Sale Discount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Flash Sale Discount (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.flash_sale_discount_percent}
              onChange={(e) => setFormData({ ...formData, flash_sale_discount_percent: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="0.00"
            />
            <p className="text-xs text-gray-500 mt-1">For 3rd Wednesday monthly flash sales</p>
          </div>

 
 {/* Forecastable */}
<div className="flex items-center">
            <input
              type="checkbox"
              id="is_forecastable"
              checked={formData.is_forecastable}
              onChange={(e) => setFormData({ ...formData, is_forecastable: e.target.checked })}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="is_forecastable" className="ml-2 text-sm font-medium text-gray-700">
              Enable for Forecasting
            </label>
          </div>
          {/* Image Upload */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Image
            </label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Max size: 5MB. Supported formats: JPG, PNG, WebP</p>
              </div>
              {imagePreview && (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview('');
                      setFormData({ ...formData, image_url: '' });
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading || uploading}
            className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Upload size={18} className="animate-pulse" />
                Uploading Image...
              </>
            ) : loading ? (
              'Saving...'
            ) : product ? (
              'Update Product'
            ) : (
              'Add Product'
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading || uploading}
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default InventoryManagement;