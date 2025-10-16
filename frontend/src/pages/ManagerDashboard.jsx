import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const ManagerDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <h2>Manager Portal</h2>
        </div>
        <div className="nav-user">
          <span className="user-name">{user?.full_name || user?.email}</span>
          <span className="user-role">{user?.role}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>Manager Dashboard</h1>
          <p>Complete control and oversight of operations</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-icon">📊</div>
            <h3>Analytics</h3>
            <p>View business analytics and insights</p>
            <button className="card-btn">View Analytics</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">📦</div>
            <h3>Inventory Management</h3>
            <p>Manage stock and inventory</p>
            <button className="card-btn">Manage Inventory</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">👥</div>
            <h3>User Management</h3>
            <p>Manage users and roles</p>
            <button className="card-btn">Manage Users</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">💰</div>
            <h3>Financial Reports</h3>
            <p>View comprehensive financial data</p>
            <button className="card-btn">View Reports</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">📈</div>
            <h3>Sales Overview</h3>
            <p>Track sales and revenue</p>
            <button className="card-btn">View Sales</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">⚙️</div>
            <h3>System Settings</h3>
            <p>Configure system preferences</p>
            <button className="card-btn">Settings</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">📋</div>
            <h3>Order Management</h3>
            <p>Oversee all customer orders</p>
            <button className="card-btn">Manage Orders</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">🔔</div>
            <h3>Notifications</h3>
            <p>View system notifications</p>
            <button className="card-btn">View Notifications</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
