import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import CustomerDashboard from './pages/CustomerDashboard'
import BillerDashboard from './pages/BillerDashboard'
import ManagerDashboard from './pages/ManagerDashboard'
import Payment from './pages/Payment'

import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ✅ Add this */}
          <Route 
            path="/payment"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <Payment />
              </ProtectedRoute>
            }
          />

          {/* Protected Dashboards */}
          <Route 
            path="/dashboard/customer"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/dashboard/biller"
            element={
              <ProtectedRoute allowedRoles={['biller']}>
                <BillerDashboard />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/dashboard/manager"
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Redirect any unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
