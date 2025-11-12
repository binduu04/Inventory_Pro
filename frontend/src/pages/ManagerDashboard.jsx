import { useState } from 'react';
import { Home, Users, Package, BarChart3, LogOut, Menu, X, TrendingUp} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import UserManagement from '../components/UserManagement';
import InventoryManagement from '../components/InventoryManagement';

import Forecast from '../components/Forecast';

const ManagerDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const getInitial = () => {
    if (user?.full_name) {
      return user.full_name.charAt(0).toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || 'M';
  };

 
  const menuItems = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'user-management', label: 'Users', icon: Users },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'forecast', label: 'Forecast', icon: TrendingUp }

];


  const renderContent = () => {
    switch(activeSection) {
      case 'overview':
        return <OverviewContent />;
      case 'user-management':
        return <UserManagement />;
      case 'inventory':
        return <InventoryManagement />;
      case 'analytics':
        return <AnalyticsContent />;
      case 'forecast':
        return <Forecast />;  // 🔥 New line added
      default:
        return <OverviewContent />;
    }
  };


  return (
    <div className="flex h-screen bg-gray-50">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-lg transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen && <h2 className="text-xl font-bold text-indigo-600">Manager Portal</h2>}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all mb-2 ${
                activeSection === item.id
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <item.icon size={20} />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
              {getInitial()}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {user?.full_name || 'Manager'}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`mt-3 w-full flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all ${
              !sidebarOpen && 'justify-center'
            }`}
          >
            <LogOut size={18} />
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

const OverviewContent = () => (
  <div>
    <h1 className="text-3xl font-bold text-gray-800 mb-2">Manager Dashboard</h1>
    <p className="text-gray-600 mb-8">Complete control and oversight of operations</p>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[
        { title: 'Total Users', value: '245', icon: Users, color: 'bg-blue-500' },
        { title: 'Inventory Items', value: '1,234', icon: Package, color: 'bg-green-500' },
        { title: 'Analytics', value: 'View', icon: BarChart3, color: 'bg-purple-500' }
      ].map((card, idx) => (
        <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">{card.title}</p>
              <p className="text-2xl font-bold text-gray-800">{card.value}</p>
            </div>
            <div className={`${card.color} p-3 rounded-lg`}>
              <card.icon className="text-white" size={24} />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const AnalyticsContent = () => (
  <div>
    <h1 className="text-3xl font-bold text-gray-800 mb-6">Analytics</h1>
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
      <BarChart3 size={64} className="mx-auto text-gray-400 mb-4" />
      <h3 className="text-xl font-semibold text-gray-700 mb-2">Coming Soon</h3>
      <p className="text-gray-600">Analytics dashboard will be available here.</p>
    </div>
  </div>
);

export default ManagerDashboard;
