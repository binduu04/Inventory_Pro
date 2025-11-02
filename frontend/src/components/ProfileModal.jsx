import { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Package, Save } from 'lucide-react';

const ProfileModal = ({ isOpen, onClose, user, onUpdateUser, orders }) => {
  const [activeTab, setActiveTab] = useState('orders');
  const [editForm, setEditForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || ''
  });

  // Reset form when user changes or modal opens
  useEffect(() => {
    if (isOpen && user) {
      setEditForm({
        full_name: user.full_name || '',
        phone: user.phone || ''
      });
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSaveProfile = () => {
    onUpdateUser({
      ...user,
      full_name: editForm.full_name,
      phone: editForm.phone
    });
    onClose();
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'profile') {
      setEditForm({
        full_name: user?.full_name || '',
        phone: user?.phone || ''
      });
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-xl bg-opacity-30 z-40" 
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <div className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-3xl sm:max-h-[90vh] bg-white rounded-xl shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-5 py-4 flex justify-between items-center rounded-t-xl">
          <h2 className="text-lg font-bold">
            {activeTab === 'orders' ? 'My Orders' : 'Edit Profile'}
          </h2>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => handleTabChange('orders')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'orders'
                ? 'text-emerald-600 border-b-2 border-emerald-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Package className="w-4 h-4" />
              <span>My Orders</span>
            </div>
          </button>
          <button
            onClick={() => handleTabChange('profile')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'profile'
                ? 'text-emerald-600 border-b-2 border-emerald-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <User className="w-4 h-4" />
              <span>Edit Profile</span>
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'profile' && (
            /* Profile Edit Tab */
            <div className="space-y-5 max-w-md mx-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1.5 ml-1">Email cannot be changed</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            /* Orders Tab */
            <div className="space-y-3">
              {orders && orders.length > 0 ? (
                orders.map((order) => (
                  <div 
                    key={order.id} 
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{order.id}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.date).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <span 
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'Delivered' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{order.items} items</span>
                      <span className="font-bold text-emerald-600">₹{order.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm">No orders yet</p>
                  <p className="text-xs text-gray-400 mt-1">Start shopping to see your orders here</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProfileModal;