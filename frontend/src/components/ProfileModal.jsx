import { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Package, Save, Edit2, Search, Filter, XCircle } from 'lucide-react';

const ProfileModal = ({ isOpen, onClose, user, onUpdateUser, orders }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredOrders, setFilteredOrders] = useState(orders || []);

  // Reset form when user changes or modal opens
  useEffect(() => {
    if (isOpen && user) {
      setEditForm({
        full_name: user.full_name || '',
        phone: user.phone || ''
      });
      setIsEditMode(false);
    }
  }, [isOpen, user]);

  // Filter orders based on search and status
  useEffect(() => {
    if (!orders) {
      setFilteredOrders([]);
      return;
    }

    let filtered = [...orders];

    // Search filter (by order ID or date)
    if (searchTerm) {
      filtered = filtered.filter(order => {
        const orderIdMatch = order.id.toLowerCase().includes(searchTerm.toLowerCase());
        const dateMatch = new Date(order.date).toLocaleDateString('en-IN').includes(searchTerm);
        return orderIdMatch || dateMatch;
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

  if (!isOpen) return null;

  const handleSaveChanges = () => {
    onUpdateUser({
      ...user,
      full_name: editForm.full_name,
      phone: editForm.phone
    });
    setIsEditMode(false);
  };

  const handleCancelEdit = () => {
    setEditForm({
      full_name: user?.full_name || '',
      phone: user?.phone || ''
    });
    setIsEditMode(false);
  };

  const getUserInitial = () => {
    if (user?.full_name) return user.full_name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  // Format status for display
  const formatStatus = (status) => {
    const statusMap = {
      'paid': 'Paid',
      'packed_and_ready_for_pickup': 'Ready for Pickup',
      'completed': 'Completed'
    };
    return statusMap[status] || status;
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch(status) {
      case 'paid':
        return 'bg-blue-100 text-blue-700';
      case 'packed_and_ready_for_pickup':
        return 'bg-purple-100 text-purple-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="flex flex-col lg:flex-row flex-1 h-full bg-gray-50">
      {/* Left Panel - Profile */}
      <div className="w-full lg:w-1/3 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col overflow-y-auto">
        {/* Close Button */}
        <div className="flex justify-end p-3 border-b border-gray-100">
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-red-50 rounded-md transition-colors"
            title="Close"
          >
            <X className="w-4 h-4 text-red-600" />
          </button>
        </div>

        {/* Profile Content */}
        <div className="flex-1 p-6">
          {/* Profile Icon */}
          <div className="flex justify-center mb-5">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-3xl font-semibold shadow-md">
              {getUserInitial()}
            </div>
          </div>

          {/* Profile Header with Edit Button */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Profile</h2>
            {!isEditMode && (
              <button
                onClick={() => setIsEditMode(true)}
                className="p-1.5 hover:bg-emerald-50 rounded-md transition-colors"
                title="Edit Profile"
              >
                <Edit2 className="w-4 h-4 text-emerald-600" />
              </button>
            )}
          </div>

          {/* Profile Fields */}
          <div className="space-y-4">
            {/* Name Field */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Full Name
              </label>
              {isEditMode ? (
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-emerald-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter your full name"
                />
              ) : (
                <div className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-900">{user?.full_name || 'Not set'}</p>
                </div>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Phone Number
              </label>
              {isEditMode ? (
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-emerald-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Enter your phone number"
                />
              ) : (
                <div className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-gray-900">{user?.phone || 'Not set'}</p>
                </div>
              )}
            </div>

            {/* Email Field (Read-only) */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1.5">Email cannot be changed</p>
            </div>
          </div>

          {/* Action Buttons (Edit Mode) */}
          {isEditMode && (
            <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={handleSaveChanges}
                className="flex-1 px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex-1 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Orders */}
      <div className="w-full lg:w-2/3 p-4 lg:p-6 flex flex-col">
        {/* Orders Header */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-1">My Orders</h2>
          <p className="text-xs text-gray-600">Track your order history</p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Order ID or Date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
            />
          </div>

          {/* Status Filter */}
          <div className="relative sm:w-48">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-white cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="packed_and_ready_for_pickup">Ready for Pickup</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto">
          {filteredOrders && filteredOrders.length > 0 ? (
            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-emerald-400 transition-all bg-white"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{order.id}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(order.date).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <span 
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                    >
                      {formatStatus(order.status)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Package className="w-3.5 h-3.5" />
                      <span>{order.items} items</span>
                    </div>
                    <span className="font-semibold text-sm text-emerald-600">₹{order.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center py-8 text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Package className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {searchTerm || statusFilter !== 'all' ? 'No orders match your search' : 'No orders yet'}
                </p>
                <p className="text-xs text-gray-500">
                  {searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Start shopping to see your orders here'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;