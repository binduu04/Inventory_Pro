import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const BillerDashboard = () => {
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
          <h2>Biller Portal</h2>
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
          <h1>Biller Dashboard</h1>
          <p>Manage invoices and billing operations</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-icon">📄</div>
            <h3>Create Invoice</h3>
            <p>Generate new customer invoices</p>
            <button className="card-btn">New Invoice</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">📋</div>
            <h3>Pending Invoices</h3>
            <p>View and process pending bills</p>
            <button className="card-btn">View Pending</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">✅</div>
            <h3>Completed Invoices</h3>
            <p>Review completed transactions</p>
            <button className="card-btn">View Completed</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">💰</div>
            <h3>Payment Records</h3>
            <p>Track all payment transactions</p>
            <button className="card-btn">View Records</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">👥</div>
            <h3>Customer List</h3>
            <p>Manage customer information</p>
            <button className="card-btn">View Customers</button>
          </div>

          <div className="dashboard-card">
            <div className="card-icon">📊</div>
            <h3>Billing Reports</h3>
            <p>Generate billing reports</p>
            <button className="card-btn">View Reports</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillerDashboard;
