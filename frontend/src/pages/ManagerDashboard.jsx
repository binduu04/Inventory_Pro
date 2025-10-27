// import { useState } from 'react';
// import { useAuth } from '../context/AuthContext';
// import { useNavigate } from 'react-router-dom';
// import { LayoutDashboardIcon, Users, Package, BarChart3, LogOut, Menu, X,UserPlus,Eye } from 'lucide-react';

// const ManagerDashboard = () => {
//   const { user, signOut } = useAuth();
//   const navigate = useNavigate();
//   const [activeSection, setActiveSection] = useState('overview');
//   const [sidebarOpen, setSidebarOpen] = useState(true);
//   const [userManagementExpanded, setUserManagementExpanded] = useState(false);

//   const handleLogout = async () => {
//     await signOut();
//     navigate('/login');
//   };

//   // Get first letter of name for avatar
//   const getInitial = () => {
//     if (user?.full_name) {
//       return user.full_name.charAt(0).toUpperCase();
//     }
//     return user?.email?.charAt(0).toUpperCase() || 'M';
//   };

//   const menuItems = [
//     { id: 'overview', label: 'Overview', icon: LayoutDashboardIcon },
//     { 
//       id: 'user-management', 
//       label: 'User Management', 
//       icon: Users,
//       subItems: [
//         { id: 'add-supplier', label: 'Add Supplier', icon: UserPlus },
//         { id: 'add-biller', label: 'Add Biller', icon: UserPlus },
//         { id: 'view-customers', label: 'View Customers', icon: Eye }
//       ]
//     },
//     { id: 'inventory', label: 'Inventory', icon: Package },
//     { id: 'analytics', label: 'Analytics', icon: BarChart3 }
//   ];

//   const renderContent = () => {
//     switch(activeSection) {
//       case 'overview':
//         return <OverviewContent />;
//       case 'add-supplier':
//         return <AddSupplierContent />;
//       case 'add-biller':
//         return <AddBillerContent />;
//       case 'view-customers':
//         return <ViewCustomersContent />;
//       case 'inventory':
//         return <InventoryContent />;
//       case 'analytics':
//         return <AnalyticsContent />;
//       default:
//         return <OverviewContent />;
//     }
//   };

//   return (
//     <div className="flex h-screen bg-gray-50">
//       {/* Sidebar */}
//       <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-lg transition-all duration-300 flex flex-col`}>
//         {/* Logo Section */}
//         <div className="p-4 border-b border-gray-200 flex items-center justify-between">
//           {sidebarOpen && <h2 className="text-xl font-bold text-indigo-600">Manager Portal</h2>}
//           <button 
//             onClick={() => setSidebarOpen(!sidebarOpen)}
//             className="p-2 rounded-lg hover:bg-gray-100"
//           >
//             {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
//           </button>
//         </div>

//         {/* Navigation Menu */}
//         <nav className="flex-1 p-4 overflow-y-auto">
//           {menuItems.map((item) => (
//             <div key={item.id} className="mb-2">
//               <button
//                 onClick={() => {
//                   if (item.subItems) {
//                     setUserManagementExpanded(!userManagementExpanded);
//                   } else {
//                     setActiveSection(item.id);
//                     if (item.subItems) {
//                       setUserManagementExpanded(false);
//                     }
//                   }
//                 }}
//                 className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
//                   activeSection === item.id || (item.id === 'user-management' && userManagementExpanded)
//                     ? 'bg-indigo-50 text-indigo-600'
//                     : 'text-gray-700 hover:bg-gray-100'
//                 }`}
//               >
//                 <item.icon size={20} />
//                 {sidebarOpen && <span className="font-medium">{item.label}</span>}
//               </button>
              
//               {/* Sub-menu items */}
//               {item.subItems && userManagementExpanded && sidebarOpen && (
//                 <div className="ml-8 mt-2 space-y-1">
//                   {item.subItems.map((subItem) => (
//                     <button
//                       key={subItem.id}
//                       onClick={() => setActiveSection(subItem.id)}
//                       className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
//                         activeSection === subItem.id
//                           ? 'bg-indigo-50 text-indigo-600'
//                           : 'text-gray-600 hover:bg-gray-50'
//                       }`}
//                     >
//                       <subItem.icon size={16} />
//                       <span>{subItem.label}</span>
//                     </button>
//                   ))}
//                 </div>
//               )}
//             </div>
//           ))}
//         </nav>

//         {/* User Profile Section */}
//         <div className="p-4 border-t border-gray-200">
//           <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
//             <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
//               {getInitial()}
//             </div>
//             {sidebarOpen && (
//               <div className="flex-1 min-w-0">
//                 <p className="text-sm font-semibold text-gray-800 truncate">
//                   {user?.full_name || 'Manager'}
//                 </p>
//                 <p className="text-xs text-gray-500 truncate">{user?.email}</p>
//               </div>
//             )}
//           </div>
//           <button
//             onClick={handleLogout}
//             className={`mt-3 w-full flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all ${
//               !sidebarOpen && 'justify-center'
//             }`}
//           >
//             <LogOut size={18} />
//             {sidebarOpen && <span className="font-medium">Logout</span>}
//           </button>
//         </div>
//       </aside>

//       {/* Main Content */}
//       <main className="flex-1 overflow-y-auto">
//         <div className="p-8">
//           {renderContent()}
//         </div>
//       </main>
//     </div>
//   );
// };

// // Content Components
// const OverviewContent = () => (
//   <div>
//     <h1 className="text-3xl font-bold text-gray-800 mb-2">Manager Dashboard</h1>
//     <p className="text-gray-600 mb-8">Complete control and oversight of operations</p>
    
//     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//       {[
//         { title: 'Total Users', value: '245', icon: Users, color: 'bg-blue-500' },
//         { title: 'Inventory Items', value: '1,234', icon: Package, color: 'bg-green-500' },
//         { title: 'Analytics', value: 'View', icon: BarChart3, color: 'bg-purple-500' }
//       ].map((card, idx) => (
//         <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-gray-500 text-sm mb-1">{card.title}</p>
//               <p className="text-2xl font-bold text-gray-800">{card.value}</p>
//             </div>
//             <div className={`${card.color} p-3 rounded-lg`}>
//               <card.icon className="text-white" size={24} />
//             </div>
//           </div>
//         </div>
//       ))}
//     </div>
//   </div>
// );

// const AddSupplierContent = () => {
//   const { session } = useAuth(); // Get session for auth token
//   const [formData, setFormData] = useState({
//     fullName: '',
//     email: '',
//     phone: '',
//     company: '',
//     address: ''
//   });
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState({ type: '', text: '' });

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setMessage({ type: '', text: '' });

//     // Validation
//     if (!formData.fullName || !formData.email || !formData.phone || !formData.company || !formData.address) {
//       setMessage({ type: 'error', text: 'Please fill all fields' });
//       setLoading(false);
//       return;
//     }

//     try {
//       const response = await fetch('http://localhost:5000/api/suppliers/', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${session.access_token}`
//         },
//         body: JSON.stringify({
//           full_name: formData.fullName,
//           email: formData.email,
//           phone: formData.phone,
//           company: formData.company,
//           address: formData.address
//         })
//       });

//       const data = await response.json();

//       if (response.ok) {
//         setMessage({ type: 'success', text: 'Supplier added successfully!' });
//         setFormData({ fullName: '', email: '', phone: '', company: '', address: '' });
//       } else {
//         setMessage({ type: 'error', text: data.error || 'Failed to add supplier' });
//       }
//     } catch (error) {
//       console.error('Error adding supplier:', error);
//       setMessage({ type: 'error', text: 'Network error. Please try again.' });
//     } finally {
//       setLoading(false);
//     }
//   };
//   return (
//     <div>
//       <h1 className="text-3xl font-bold text-gray-800 mb-6">Add Supplier</h1>
//       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-w-2xl">
//         {message.text && (
//           <div className={`mb-4 p-4 rounded-lg ${
//             message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
//           }`}>
//             {message.text}
//           </div>
//         )}
        
//         <div className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Full Name <span className="text-red-500">*</span>
//             </label>
//             <input 
//               type="text"
//               value={formData.fullName}
//               onChange={(e) => setFormData({...formData, fullName: e.target.value})}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
//               placeholder="Enter supplier name"
//               required
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Email <span className="text-red-500">*</span>
//             </label>
//             <input 
//               type="email"
//               value={formData.email}
//               onChange={(e) => setFormData({...formData, email: e.target.value})}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
//               placeholder="supplier@example.com"
//               required
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Phone <span className="text-red-500">*</span>
//             </label>
//             <input 
//               type="tel"
//               value={formData.phone}
//               onChange={(e) => setFormData({...formData, phone: e.target.value})}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
//               placeholder="+91 1234567890"
//               required
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Company <span className="text-red-500">*</span>
//             </label>
//             <input 
//               type="text"
//               value={formData.company}
//               onChange={(e) => setFormData({...formData, company: e.target.value})}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
//               placeholder="Company name"
//               required
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Address <span className="text-red-500">*</span>
//             </label>
//             <input 
//               type="text"
//               value={formData.address}
//               onChange={(e) => setFormData({...formData, address: e.target.value})}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
//               placeholder="Supplier address"
//               required
//             />
//           </div>
//           <button 
//             onClick={handleSubmit}
//             disabled={loading}
//             className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:bg-indigo-400 disabled:cursor-not-allowed"
//           >
//             {loading ? 'Adding Supplier...' : 'Add Supplier'}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// const AddBillerContent = () => {
//   const [formData, setFormData] = useState({
//     fullName: '',
//     email: '',
//     password: '',
//     employeeId: ''
//   });
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState({ type: '', text: '' });

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setMessage({ type: '', text: '' });

//     // Validation
//     if (!formData.fullName || !formData.email || !formData.password || !formData.employeeId) {
//       setMessage({ type: 'error', text: 'Please fill all fields' });
//       setLoading(false);
//       return;
//     }

//     if (formData.password.length < 6) {
//       setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
//       setLoading(false);
//       return;
//     }

//     // TODO: Replace with actual API call later
//     console.log('Biller data:', formData);
    
//     // Simulate API call
//     setTimeout(() => {
//       setMessage({ type: 'success', text: 'Biller added successfully!' });
//       setFormData({ fullName: '', email: '', password: '', employeeId: '' });
//       setLoading(false);
//     }, 1000);
//   };

//   return (
//     <div>
//       <h1 className="text-3xl font-bold text-gray-800 mb-6">Add Biller</h1>
//       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-w-2xl">
//         {message.text && (
//           <div className={`mb-4 p-4 rounded-lg ${
//             message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
//           }`}>
//             {message.text}
//           </div>
//         )}
        
//         <div className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Full Name <span className="text-red-500">*</span>
//             </label>
//             <input 
//               type="text"
//               value={formData.fullName}
//               onChange={(e) => setFormData({...formData, fullName: e.target.value})}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
//               placeholder="Enter biller name"
//               required
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Email <span className="text-red-500">*</span>
//             </label>
//             <input 
//               type="email"
//               value={formData.email}
//               onChange={(e) => setFormData({...formData, email: e.target.value})}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
//               placeholder="biller@example.com"
//               required
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Password <span className="text-red-500">*</span>
//             </label>
//             <input 
//               type="password"
//               value={formData.password}
//               onChange={(e) => setFormData({...formData, password: e.target.value})}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
//               placeholder="Set password (min 6 characters)"
//               required
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Employee ID <span className="text-red-500">*</span>
//             </label>
//             <input 
//               type="text"
//               value={formData.employeeId}
//               onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
//               placeholder="EMP-001"
//               required
//             />
//           </div>
//           <button 
//             onClick={handleSubmit}
//             disabled={loading}
//             className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:bg-indigo-400 disabled:cursor-not-allowed"
//           >
//             {loading ? 'Adding Biller...' : 'Add Biller'}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// const ViewCustomersContent = () => {
//   const [loading, setLoading] = useState(false);
  
//   // Mock data - will be replaced with actual API call
//   const mockCustomers = [
//     { id: 1, name: 'Rajesh Kumar', email: 'rajesh@example.com', phone: '+91 9876543210', status: 'Active', joined: '2024-01-15' },
//     { id: 2, name: 'Priya Sharma', email: 'priya@example.com', phone: '+91 9876543220', status: 'Active', joined: '2024-02-20' },
//     { id: 3, name: 'Amit Patel', email: 'amit@example.com', phone: '+91 9876543230', status: 'Inactive', joined: '2024-03-10' },
//     { id: 4, name: 'Sneha Reddy', email: 'sneha@example.com', phone: '+91 9876543240', status: 'Active', joined: '2024-04-05' }
//   ];

//   return (
//     <div>
//       <div className="flex justify-between items-center mb-6">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-800">View Customers</h1>
//           <p className="text-gray-600 mt-1">Total customers: {mockCustomers.length}</p>
//         </div>
//         <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
//           Export Data
//         </button>
//       </div>
      
//       <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead className="bg-gray-50 border-b border-gray-200">
//               <tr>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {mockCustomers.map((customer) => (
//                 <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="flex items-center">
//                       <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold text-sm mr-3">
//                         {customer.name.charAt(0)}
//                       </div>
//                       <span className="text-sm font-medium text-gray-900">{customer.name}</span>
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.email}</td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phone}</td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.joined}</td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
//                       customer.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
//                     }`}>
//                       {customer.status}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm">
//                     <button className="text-indigo-600 hover:text-indigo-900 font-medium mr-3">View</button>
//                     <button className="text-gray-600 hover:text-gray-900 font-medium">Edit</button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// };

// const InventoryContent = () => (
//   <div>
//     <h1 className="text-3xl font-bold text-gray-800 mb-6">Inventory Management</h1>
//     <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
//       <Package size={64} className="mx-auto text-gray-400 mb-4" />
//       <h3 className="text-xl font-semibold text-gray-700 mb-2">Coming Soon</h3>
//       <p className="text-gray-600">Inventory management features will be available here.</p>
//     </div>
//   </div>
// );

// const AnalyticsContent = () => (
//   <div>
//     <h1 className="text-3xl font-bold text-gray-800 mb-6">Analytics</h1>
//     <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
//       <BarChart3 size={64} className="mx-auto text-gray-400 mb-4" />
//       <h3 className="text-xl font-semibold text-gray-700 mb-2">Coming Soon</h3>
//       <p className="text-gray-600">Analytics dashboard will be available here.</p>
//     </div>
//   </div>
// );

// export default ManagerDashboard;


// import { useState, useEffect } from 'react';
// import { Home, Users, Package, BarChart3, LogOut, Menu, X, Plus, Edit2, Trash2, Search } from 'lucide-react';
// import { useAuth } from '../context/AuthContext';
// import { useNavigate } from 'react-router-dom';

// const ManagerDashboard = () => {
//   const { user, signOut } = useAuth();
//   const navigate = useNavigate();
//   const [activeSection, setActiveSection] = useState('overview');
//   const [sidebarOpen, setSidebarOpen] = useState(true);

//   const handleLogout = async () => {
//     await signOut();
//     navigate('/login');
//   };

//   const getInitial = () => {
//     if (user?.full_name) {
//       return user.full_name.charAt(0).toUpperCase();
//     }
//     return user?.email?.charAt(0).toUpperCase() || 'M';
//   };

//   const menuItems = [
//     { id: 'overview', label: 'Overview', icon: Home },
//     { id: 'user-management', label: 'User Management', icon: Users },
//     { id: 'inventory', label: 'Inventory', icon: Package },
//     { id: 'analytics', label: 'Analytics', icon: BarChart3 }
//   ];

//   const renderContent = () => {
//     switch(activeSection) {
//       case 'overview':
//         return <OverviewContent />;
//       case 'user-management':
//         return <UserManagementContent />;
//       case 'inventory':
//         return <InventoryContent />;
//       case 'analytics':
//         return <AnalyticsContent />;
//       default:
//         return <OverviewContent />;
//     }
//   };

//   return (
//     <div className="flex h-screen bg-gray-50">
//       <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-lg transition-all duration-300 flex flex-col`}>
//         <div className="p-4 border-b border-gray-200 flex items-center justify-between">
//           {sidebarOpen && <h2 className="text-xl font-bold text-indigo-600">Manager Portal</h2>}
//           <button 
//             onClick={() => setSidebarOpen(!sidebarOpen)}
//             className="p-2 rounded-lg hover:bg-gray-100"
//           >
//             {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
//           </button>
//         </div>

//         <nav className="flex-1 p-4 overflow-y-auto">
//           {menuItems.map((item) => (
//             <button
//               key={item.id}
//               onClick={() => setActiveSection(item.id)}
//               className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all mb-2 ${
//                 activeSection === item.id
//                   ? 'bg-indigo-50 text-indigo-600'
//                   : 'text-gray-700 hover:bg-gray-100'
//               }`}
//             >
//               <item.icon size={20} />
//               {sidebarOpen && <span className="font-medium">{item.label}</span>}
//             </button>
//           ))}
//         </nav>

//         <div className="p-4 border-t border-gray-200">
//           <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
//             <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
//               {getInitial()}
//             </div>
//             {sidebarOpen && (
//               <div className="flex-1 min-w-0">
//                 <p className="text-sm font-semibold text-gray-800 truncate">
//                   {user?.full_name || 'Manager'}
//                 </p>
//                 <p className="text-xs text-gray-500 truncate">{user?.email}</p>
//               </div>
//             )}
//           </div>
//           <button
//             onClick={handleLogout}
//             className={`mt-3 w-full flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all ${
//               !sidebarOpen && 'justify-center'
//             }`}
//           >
//             <LogOut size={18} />
//             {sidebarOpen && <span className="font-medium">Logout</span>}
//           </button>
//         </div>
//       </aside>

//       <main className="flex-1 overflow-y-auto">
//         <div className="p-8">
//           {renderContent()}
//         </div>
//       </main>
//     </div>
//   );
// };

// const UserManagementContent = () => {
//   const [activeTab, setActiveTab] = useState('suppliers');

//   const tabs = [
//     { id: 'suppliers', label: 'Suppliers' },
//     { id: 'billers', label: 'Billers' },
//     { id: 'customers', label: 'Customers' }
//   ];

//   return (
//     <div>
//       <h1 className="text-3xl font-bold text-gray-800 mb-6">User Management</h1>
      
//       <div className="bg-white rounded-t-xl shadow-sm border border-gray-200 border-b-0">
//         <div className="flex border-b border-gray-200">
//           {tabs.map((tab) => (
//             <button
//               key={tab.id}
//               onClick={() => setActiveTab(tab.id)}
//               className={`px-6 py-4 font-medium text-sm transition-all relative ${
//                 activeTab === tab.id
//                   ? 'text-indigo-600 border-b-2 border-indigo-600'
//                   : 'text-gray-600 hover:text-gray-900'
//               }`}
//             >
//               {tab.label}
//             </button>
//           ))}
//         </div>
//       </div>

//       <div className="bg-white rounded-b-xl shadow-sm border border-gray-200">
//         {activeTab === 'suppliers' && <SuppliersTab />}
//         {activeTab === 'billers' && <BillersTab />}
//         {activeTab === 'customers' && <CustomersTab />}
//       </div>
//     </div>
//   );
// };

// const SuppliersTab = () => {
//   const { session } = useAuth();
//   const [suppliers, setSuppliers] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [showAddForm, setShowAddForm] = useState(false);
//   const [editingSupplier, setEditingSupplier] = useState(null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [message, setMessage] = useState({ type: '', text: '' });

//   useEffect(() => {
//     //setSuppliers(fetchSuppliers());
//     fetchSuppliers();
//   }, []);

//   const fetchSuppliers = async () => {
//     setLoading(true);
//     try {
//       const response = await fetch('http://localhost:5000/api/suppliers/', {
//         headers: {
//           'Authorization': `Bearer ${session?.access_token}`
//         }
//       });
//       const data = await response.json();
//       if (response.ok) {
//         setSuppliers(data.suppliers || []);
//       }
//     } catch (error) {
//       console.error('Error fetching suppliers:', error);
//       setMessage({ type: 'error', text: 'Failed to load suppliers' });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDelete = async (supplierId) => {
//     if (!window.confirm('Are you sure you want to delete this supplier?')) return;

//     try {
//       const response = await fetch(`http://localhost:5000/api/suppliers/${supplierId}`, {
//         method: 'DELETE',
//         headers: {
//           'Authorization': `Bearer ${session?.access_token}`
//         }
//       });

//       if (response.ok) {
//         setMessage({ type: 'success', text: 'Supplier deleted successfully' });
//         setSuppliers(suppliers.filter(s => s.id !== supplierId));
//       } else {
//         setMessage({ type: 'error', text: 'Failed to delete supplier' });
//       }
//     } catch (error) {
//       console.error('Error deleting supplier:', error);
//       setMessage({ type: 'error', text: 'Network error' });
//     }
//   };

//   const filteredSuppliers = suppliers.filter(supplier =>
//     supplier.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     supplier.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     supplier.email.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   return (
//     <div className="p-6">
//       {message.text && (
//         <div className={`mb-4 p-4 rounded-lg ${
//           message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
//         }`}>
//           {message.text}
//         </div>
//       )}

//       {!showAddForm && !editingSupplier ? (
//         <>
//           <div className="flex justify-between items-center mb-6">
//             <div className="flex-1 max-w-md relative">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
//               <input
//                 type="text"
//                 placeholder="Search suppliers..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
//               />
//             </div>
//             <button
//               onClick={() => setShowAddForm(true)}
//               className="ml-4 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
//             >
//               <Plus size={20} />
//               Add Supplier
//             </button>
//           </div>

//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead className="bg-gray-50 border-b border-gray-200">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {filteredSuppliers.length > 0 ? (
//                   filteredSuppliers.map((supplier) => (
//                     <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <div className="flex items-center">
//                           <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold text-sm mr-3">
//                             {supplier.full_name.charAt(0)}
//                           </div>
//                           <span className="text-sm font-medium text-gray-900">{supplier.full_name}</span>
//                         </div>
//                       </td>
//                       <td className="px-6 py-4 text-sm text-gray-600">{supplier.company}</td>
//                       <td className="px-6 py-4 text-sm text-gray-600">{supplier.email}</td>
//                       <td className="px-6 py-4 text-sm text-gray-600">{supplier.phone}</td>
//                       <td className="px-6 py-4 text-sm text-gray-600">{supplier.address}</td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm">
//                         <button
//                           onClick={() => setEditingSupplier(supplier)}
//                           className="text-indigo-600 hover:text-indigo-900 mr-4 inline-flex items-center gap-1"
//                         >
//                           <Edit2 size={16} />
//                           Edit
//                         </button>
//                         <button
//                           onClick={() => handleDelete(supplier.id)}
//                           className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
//                         >
//                           <Trash2 size={16} />
//                           Delete
//                         </button>
//                       </td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
//                       {searchTerm ? 'No suppliers found matching your search' : 'No suppliers added yet'}
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </>
//       ) : (
//         <SupplierForm
//           supplier={editingSupplier}
//           onCancel={() => {
//             setShowAddForm(false);
//             setEditingSupplier(null);
//           }}
//           onSuccess={(newSupplier) => {
//             setShowAddForm(false);
//             if (editingSupplier) {
//               setSuppliers(suppliers.map(s => s.id === newSupplier.id ? newSupplier : s));
//               setMessage({ type: 'success', text: 'Supplier updated successfully' });
//             } else {
//               setSuppliers([newSupplier, ...suppliers]);
//               setMessage({ type: 'success', text: 'Supplier added successfully' });
//             }
//             setEditingSupplier(null);
//           }}
//         />
//       )}
//     </div>
//   );
// };

// const SupplierForm = ({ supplier, onCancel, onSuccess }) => {
//   const { session } = useAuth();
//   const [formData, setFormData] = useState({
//     full_name: supplier?.full_name || '',
//     email: supplier?.email || '',
//     phone: supplier?.phone || '',
//     company: supplier?.company || '',
//     address: supplier?.address || ''
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');

//     if (!formData.full_name || !formData.email || !formData.phone || !formData.company || !formData.address) {
//       setError('All fields are required');
//       setLoading(false);
//       return;
//     }

//     try {
//       const url = supplier 
//         ? `http://localhost:5000/api/suppliers/${supplier.id}`
//         : 'http://localhost:5000/api/suppliers/';
      
//       const response = await fetch(url, {
//         method: supplier ? 'PUT' : 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${session?.access_token}`
//         },
//         body: JSON.stringify(formData)
//       });

//       if (response.ok) {
//         const data = await response.json();
//         onSuccess(data.supplier || { ...formData, id: Date.now().toString() });
//       } else {
//         const data = await response.json();
//         setError(data.error || 'Failed to save supplier');
//       }
//     } catch (error) {
//       console.error('Error saving supplier:', error);
//       setError('Network error. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="max-w-2xl">
//       <h2 className="text-2xl font-bold text-gray-800 mb-6">
//         {supplier ? 'Edit Supplier' : 'Add New Supplier'}
//       </h2>

//       {error && (
//         <div className="mb-4 p-4 rounded-lg bg-red-50 text-red-800">
//           {error}
//         </div>
//       )}

//       <div className="space-y-4">
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-2">
//             Full Name <span className="text-red-500">*</span>
//           </label>
//           <input
//             type="text"
//             value={formData.full_name}
//             onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
//             className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
//             placeholder="Enter supplier name"
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-2">
//             Email <span className="text-red-500">*</span>
//           </label>
//           <input
//             type="email"
//             value={formData.email}
//             onChange={(e) => setFormData({ ...formData, email: e.target.value })}
//             className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
//             placeholder="supplier@example.com"
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-2">
//             Phone <span className="text-red-500">*</span>
//           </label>
//           <input
//             type="tel"
//             value={formData.phone}
//             onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
//             className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
//             placeholder="+91 1234567890"
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-2">
//             Company <span className="text-red-500">*</span>
//           </label>
//           <input
//             type="text"
//             value={formData.company}
//             onChange={(e) => setFormData({ ...formData, company: e.target.value })}
//             className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
//             placeholder="Company name"
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-2">
//             Address <span className="text-red-500">*</span>
//           </label>
//           <textarea
//             value={formData.address}
//             onChange={(e) => setFormData({ ...formData, address: e.target.value })}
//             className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
//             placeholder="Supplier address"
//             rows="3"
//           />
//         </div>

//         <div className="flex gap-3 pt-4">
//           <button
//             onClick={handleSubmit}
//             disabled={loading}
//             className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:bg-indigo-400 disabled:cursor-not-allowed"
//           >
//             {loading ? 'Saving...' : supplier ? 'Update Supplier' : 'Add Supplier'}
//           </button>
//           <button
//             onClick={onCancel}
//             className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
//           >
//             Cancel
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// const BillersTab = () => (
//   <div className="p-6 text-center py-12">
//     <Users size={64} className="mx-auto text-gray-400 mb-4" />
//     <h3 className="text-xl font-semibold text-gray-700 mb-2">Billers Management</h3>
//     <p className="text-gray-600">Billers management coming soon...</p>
//   </div>
// );

// const CustomersTab = () => (
//   <div className="p-6 text-center py-12">
//     <Users size={64} className="mx-auto text-gray-400 mb-4" />
//     <h3 className="text-xl font-semibold text-gray-700 mb-2">Customers Management</h3>
//     <p className="text-gray-600">Customers management coming soon...</p>
//   </div>
// );

// const OverviewContent = () => (
//   <div>
//     <h1 className="text-3xl font-bold text-gray-800 mb-2">Manager Dashboard</h1>
//     <p className="text-gray-600 mb-8">Complete control and oversight of operations</p>
    
//     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//       {[
//         { title: 'Total Users', value: '245', icon: Users, color: 'bg-blue-500' },
//         { title: 'Inventory Items', value: '1,234', icon: Package, color: 'bg-green-500' },
//         { title: 'Analytics', value: 'View', icon: BarChart3, color: 'bg-purple-500' }
//       ].map((card, idx) => (
//         <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-gray-500 text-sm mb-1">{card.title}</p>
//               <p className="text-2xl font-bold text-gray-800">{card.value}</p>
//             </div>
//             <div className={`${card.color} p-3 rounded-lg`}>
//               <card.icon className="text-white" size={24} />
//             </div>
//           </div>
//         </div>
//       ))}
//     </div>
//   </div>
// );

// const InventoryContent = () => (
//   <div>
//     <h1 className="text-3xl font-bold text-gray-800 mb-6">Inventory Management</h1>
//     <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
//       <Package size={64} className="mx-auto text-gray-400 mb-4" />
//       <h3 className="text-xl font-semibold text-gray-700 mb-2">Coming Soon</h3>
//       <p className="text-gray-600">Inventory management features will be available here.</p>
//     </div>
//   </div>
// );

// const AnalyticsContent = () => (
//   <div>
//     <h1 className="text-3xl font-bold text-gray-800 mb-6">Analytics</h1>
//     <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
//       <BarChart3 size={64} className="mx-auto text-gray-400 mb-4" />
//       <h3 className="text-xl font-semibold text-gray-700 mb-2">Coming Soon</h3>
//       <p className="text-gray-600">Analytics dashboard will be available here.</p>
//     </div>
//   </div>
// );

// export default ManagerDashboard;


import { useState } from 'react';
import { Home, Users, Package, BarChart3, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import UserManagement from '../components/UserManagement';

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
    { id: 'user-management', label: 'User Management', icon: Users },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  const renderContent = () => {
    switch(activeSection) {
      case 'overview':
        return <OverviewContent />;
      case 'user-management':
        return <UserManagement />;
      case 'inventory':
        return <InventoryContent />;
      case 'analytics':
        return <AnalyticsContent />;
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

const InventoryContent = () => (
  <div>
    <h1 className="text-3xl font-bold text-gray-800 mb-6">Inventory Management</h1>
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
      <Package size={64} className="mx-auto text-gray-400 mb-4" />
      <h3 className="text-xl font-semibold text-gray-700 mb-2">Coming Soon</h3>
      <p className="text-gray-600">Inventory management features will be available here.</p>
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
