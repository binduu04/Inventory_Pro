import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Search, X, Loader, Package, ShoppingBag, ListOrdered } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Custom Alert Component
const CustomAlert = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-80 ${
        type === 'success' 
          ? 'bg-green-600 text-white' 
          : type === 'error'
          ? 'bg-red-600 text-white'
          : 'bg-blue-600 text-white'
      }`}>
        <span className="flex-1 font-medium">{message}</span>
        <button
          onClick={onClose}
          className="hover:bg-white/20 rounded p-1 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

// Loading Overlay Component
const LoadingOverlay = () => (
  <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-xl">
    <div className="flex flex-col items-center gap-3">
      <Loader className="animate-spin text-indigo-600" size={40} />
      <span className="text-gray-600 font-medium">Loading...</span>
    </div>
  </div>
);

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState('suppliers');
  const [alert, setAlert] = useState(null);

  const showAlert = (message, type) => {
    setAlert({ message, type });
  };

  const tabs = [
    { id: 'suppliers', label: 'Suppliers' },
    { id: 'billers', label: 'Billers' },
    { id: 'customers', label: 'Customers' }
  ];

  return (
    <div>
      {alert && (
        <CustomAlert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}

      <h1 className="text-3xl font-bold text-gray-800 mb-6">User Management</h1>
      
      <div className="bg-white rounded-t-xl shadow-sm border border-gray-200 border-b-0">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-4 font-medium text-sm transition-all relative ${
                activeTab === tab.id
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-b-xl shadow-sm border border-gray-200">
        {activeTab === 'suppliers' && <SuppliersTab showAlert={showAlert} />}
        {activeTab === 'billers' && <BillersTab showAlert={showAlert} />}
        {activeTab === 'customers' && <CustomersTab  showAlert={showAlert} />}
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

const SuppliersTab = ({ showAlert }) => {
  const { session } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
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
      showAlert('Failed to load suppliers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (supplierId) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/suppliers/${supplierId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (response.ok) {
        showAlert('Supplier deleted successfully', 'success');
        setSuppliers(suppliers.filter(s => s.id !== supplierId));
      } else {
        showAlert('Failed to delete supplier', 'error');
      }
    } catch (error) {
      console.error('Error deleting supplier:', error);
      showAlert('Network error', 'error');
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 relative">
      {loading && <LoadingOverlay />}

      {!showAddForm && !editingSupplier ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="ml-4 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <Plus size={20} />
              Add Supplier
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSuppliers.length > 0 ? (
                  filteredSuppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold text-sm mr-3">
                            {supplier.full_name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{supplier.full_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{supplier.company}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{supplier.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{supplier.phone}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{supplier.address}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setEditingSupplier(supplier)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4 inline-flex items-center gap-1"
                        >
                          <Edit2 size={16} />
                          Edit
                        </button>
                        {/* <button
                          onClick={() => handleDelete(supplier.id)}
                          className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button> */}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      {searchTerm ? 'No suppliers found matching your search' : 'No suppliers added yet'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <SupplierForm
          supplier={editingSupplier}
          onCancel={() => {
            setShowAddForm(false);
            setEditingSupplier(null);
          }}
          onSuccess={(newSupplier) => {
            setShowAddForm(false);
            if (editingSupplier) {
              setSuppliers(suppliers.map(s => s.id === newSupplier.id ? newSupplier : s));
              showAlert('Supplier updated successfully', 'success');
            } else {
              setSuppliers([newSupplier, ...suppliers]);
              showAlert('Supplier added successfully', 'success');
            }
            setEditingSupplier(null);
          }}
          showAlert={showAlert}
        />
      )}
    </div>
  );
};

const SupplierForm = ({ supplier, onCancel, onSuccess, showAlert }) => {
  const { session } = useAuth();
  const [formData, setFormData] = useState({
    full_name: supplier?.full_name || '',
    email: supplier?.email || '',
    phone: supplier?.phone || '',
    company: supplier?.company || '',
    address: supplier?.address || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.full_name || !formData.email || !formData.phone || !formData.company || !formData.address) {
      showAlert('All fields are required', 'error');
      setLoading(false);
      return;
    }

    try {
      const url = supplier 
        ? `http://localhost:5000/api/suppliers/${supplier.id}`
        : 'http://localhost:5000/api/suppliers/';
      
      const response = await fetch(url, {
        method: supplier ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        onSuccess(data.supplier || { ...formData, id: Date.now().toString() });
      } else {
        const data = await response.json();
        showAlert(data.error || 'Failed to save supplier', 'error');
      }
    } catch (error) {
      console.error('Error saving supplier:', error);
      showAlert('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {supplier ? 'Edit Supplier' : 'Add New Supplier'}
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            placeholder="Enter supplier name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            placeholder="supplier@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            placeholder="+91 1234567890"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            placeholder="Company name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            placeholder="Supplier address"
            rows="3"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader className="animate-spin" size={18} />}
            {loading ? 'Saving...' : supplier ? 'Update Supplier' : 'Add Supplier'}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const BillersTab = ({ showAlert }) => {
  const { session } = useAuth();
  const [billers, setBillers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBiller, setEditingBiller] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBillers();
  }, []);

  const fetchBillers = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/billers/', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setBillers(data.billers || []);
      }
    } catch (error) {
      console.error('Error fetching billers:', error);
      showAlert('Failed to load billers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (billerId) => {
    if (!window.confirm('Are you sure you want to permanently delete this biller? This action cannot be undone.')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/billers/${billerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (response.ok) {
        showAlert('Biller deleted successfully', 'success');
        setBillers(billers.filter(b => b.id !== billerId));
      } else {
        const data = await response.json();
        showAlert(data.error || 'Failed to delete biller', 'error');
      }
    } catch (error) {
      console.error('Error deleting biller:', error);
      showAlert('Network error', 'error');
    }
  };

  const filteredBillers = billers.filter(biller =>
    biller.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    biller.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    biller.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 relative">
      {loading && <LoadingOverlay />}

      {!showAddForm && !editingBiller ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search billers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="ml-4 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <Plus size={20} />
              Add Biller
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBillers.length > 0 ? (
                  filteredBillers.map((biller) => (
                    <tr key={biller.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-semibold text-sm mr-3">
                            {biller.full_name?.charAt(0) || 'B'}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{biller.full_name || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{biller.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{biller.phone || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {biller.created_at ? new Date(biller.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setEditingBiller(biller)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4 inline-flex items-center gap-1"
                        >
                          <Edit2 size={16} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(biller.id)}
                          className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      {searchTerm ? 'No billers found matching your search' : 'No billers added yet'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <BillerForm
          biller={editingBiller}
          onCancel={() => {
            setShowAddForm(false);
            setEditingBiller(null);
          }}
          onSuccess={(newBiller) => {
            setShowAddForm(false);
            if (editingBiller) {
              setBillers(billers.map(b => b.id === newBiller.id ? newBiller : b));
              showAlert('Biller updated successfully', 'success');
            } else {
              setBillers([newBiller, ...billers]);
              showAlert('Biller added successfully', 'success');
            }
            setEditingBiller(null);
          }}
          showAlert={showAlert}
        />
      )}
    </div>
  );
};

const BillerForm = ({ biller, onCancel, onSuccess, showAlert }) => {
  const { session } = useAuth();
  const [formData, setFormData] = useState({
    full_name: biller?.full_name || '',
    email: biller?.email || '',
    phone: biller?.phone || '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.full_name || !formData.email || !formData.phone) {
      showAlert('Name, email, and phone are required', 'error');
      setLoading(false);
      return;
    }

    if (!biller && !formData.password) {
      showAlert('Password is required for new billers', 'error');
      setLoading(false);
      return;
    }

    if (!biller && formData.password.length < 6) {
      showAlert('Password must be at least 6 characters', 'error');
      setLoading(false);
      return;
    }

    try {
      const url = biller 
        ? `http://localhost:5000/api/billers/${biller.id}`
        : 'http://localhost:5000/api/billers/';
      
      const body = biller 
        ? { full_name: formData.full_name, phone: formData.phone }
        : formData;
      
      const response = await fetch(url, {
        method: biller ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const data = await response.json();
        onSuccess(data.biller);
      } else {
        const data = await response.json();
        showAlert(data.error || 'Failed to save biller', 'error');
      }
    } catch (error) {
      console.error('Error saving biller:', error);
      showAlert('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {biller ? 'Edit Biller' : 'Add New Biller'}
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            placeholder="Enter biller name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            placeholder="biller@example.com"
            disabled={!!biller}
          />
          {biller && (
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            placeholder="+91 1234567890"
          />
        </div>

        {!biller && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="Minimum 6 characters"
            />
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader className="animate-spin" size={18} />}
            {loading ? 'Saving...' : biller ? 'Update Biller' : 'Add Biller'}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};



const CustomersTab = () => {
  const { session } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const showAlert = (message, type) => setAlert({ message, type });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/customer/all", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setCustomers(data.customers || []);
      } else {
        showAlert(data.error || "Failed to fetch customers", "error");
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
      showAlert("Network error", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (customerId) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/customer/${customerId}/orders`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setOrders(data.orders || []);
        setSelectedCustomer(customerId);
      } else {
        showAlert(data.error || "Failed to fetch orders", "error");
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      showAlert("Network error", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (customerId) => {
    if (!window.confirm("Are you sure you want to delete this customer?")) return;
    try {
      const response = await fetch(`http://localhost:5000/api/customer/${customerId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setCustomers(customers.filter((c) => c.id !== customerId));
        showAlert("Customer deleted successfully", "success");
      } else {
        showAlert(data.error || "Failed to delete customer", "error");
      }
    } catch (err) {
      console.error("Error deleting customer:", err);
      showAlert("Network error", "error");
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 relative">
      {loading && <LoadingOverlay />}
      {alert && (
        <CustomAlert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}

      {!selectedCustomer ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm mr-3">
                          {c.full_name?.charAt(0) || 'C'}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{c.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.phone}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => fetchOrders(c.id)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4 inline-flex items-center gap-1"
                      >
                        <ShoppingBag size={16} />
                        View Orders
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    {searchTerm ? 'No customers found matching your search' : 'No customers found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </>
      ) : (
        <div>
          <button
            onClick={() => setSelectedCustomer(null)}
            className="mb-4 text-sm text-indigo-600 hover:underline"
          >
            ← Back
          </button>
          <h3 className="text-xl font-semibold mb-3">Recent Orders</h3>
          {orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.sale_id} className="border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between text-sm text-gray-700 mb-2">
                    <span><strong>Order:</strong> {order.order_number}</span>
                    <span><strong>Date:</strong> {new Date(order.date).toLocaleString()}</span>
                  </div>
                  <div className="text-gray-700 mb-2">
                    <strong>Status:</strong> {order.status || "N/A"}
                  </div>
                  <div className="text-gray-700 mb-2">
                    <strong>Total:</strong> ₹{order.total.toFixed(2)}
                  </div>
                  <ul className="text-sm text-gray-600 list-disc ml-5">
                    {order.sale_items.map((item, i) => (
                      <li key={i}>
                        {item.products?.product_name} × {item.quantity} — ₹{item.subtotal}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No recent orders found.</p>
          )}
        </div>
      )}
    </div>
  );
};


export default UserManagement;