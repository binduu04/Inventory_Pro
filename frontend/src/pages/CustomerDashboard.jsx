import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const CustomerDashboard = () => {
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
          <h2>Customer Portal</h2>
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
          <h1>Welcome, {user?.full_name || 'Customer'}!</h1>
          <p>Access your orders and track your purchases</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-icon">📦</div>
            <h3>My Orders</h3>
            <p>View and track your orders</p>
            <button className="card-btn">View Orders</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">🛒</div>
            <h3>Browse Products</h3>
            <p>Explore our product catalog</p>
            <button className="card-btn">Browse</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">👤</div>
            <h3>My Profile</h3>
            <p>Manage your account settings</p>
            <button className="card-btn">Edit Profile</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">📊</div>
            <h3>Order History</h3>
            <p>View your past purchases</p>
            <button className="card-btn">View History</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
