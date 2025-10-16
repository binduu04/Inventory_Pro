import { useState } from 'react'
import { ShoppingCart, Package, Users, BarChart3, Shield, Zap, CheckCircle, ArrowRight, Menu, X } from 'lucide-react'
import { useNavigate } from "react-router-dom";
export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
const navigate = useNavigate();
  const handleLogin = () => {
    console.log('Navigate to login')
    navigate('/login')
  }

  const handleRegister = () => {
    console.log('Navigate to register')
    navigate('/register')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-2 rounded-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                InventoryPro
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-indigo-600 transition">Features</a>
              <a href="#roles" className="text-gray-600 hover:text-indigo-600 transition">Roles</a>
              <button
                onClick={handleLogin}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition"
              >
                Login
              </button>
              <button
                onClick={handleRegister}
                className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                Get Started
              </button>
            </div>

            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block text-gray-600 hover:text-indigo-600">Features</a>
              <a href="#roles" className="block text-gray-600 hover:text-indigo-600">Roles</a>
              <a href="#pricing" className="block text-gray-600 hover:text-indigo-600">Pricing</a>
              <button onClick={handleLogin} className="block w-full text-left text-gray-700">Login</button>
              <button onClick={handleRegister} className="block w-full px-4 py-2 text-white bg-indigo-600 rounded-lg">
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-indigo-100 rounded-full mb-6">
              <Zap className="h-4 w-4 text-indigo-600 mr-2" />
              <span className="text-sm font-medium text-indigo-600">Modern Inventory Management</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
              Transform Your
              <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Inventory Management
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Streamline operations with role-based access, real-time tracking, and powerful analytics. Built for teams that move fast.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              <button
                onClick={handleRegister}
                className="group px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 flex items-center justify-center"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={handleLogin}
                className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl border-2 border-gray-200 hover:border-indigo-600 hover:text-indigo-600 transition-all duration-200"
              >
                Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div>
                <div className="text-3xl font-bold text-gray-900">99.9%</div>
                <div className="text-sm text-gray-600">Uptime</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">10K+</div>
                <div className="text-sm text-gray-600">Users</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">4.9★</div>
                <div className="text-sm text-gray-600">Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need to succeed
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features designed to make inventory management effortless
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield className="h-8 w-8" />,
                title: "Role-Based Access",
                description: "Secure authentication with granular permissions for customers, billers, and managers."
              },
              {
                icon: <BarChart3 className="h-8 w-8" />,
                title: "Real-Time Analytics",
                description: "Track inventory levels, sales trends, and generate insights with live dashboards."
              },
              {
                icon: <Zap className="h-8 w-8" />,
                title: "Lightning Fast",
                description: "Optimized performance ensures your team can work without delays or interruptions."
              },
              {
                icon: <Package className="h-8 w-8" />,
                title: "Smart Inventory",
                description: "Automated stock alerts, reorder points, and supplier management in one place."
              },
              {
                icon: <ShoppingCart className="h-8 w-8" />,
                title: "Seamless Billing",
                description: "Generate invoices, process payments, and track transactions effortlessly."
              },
              {
                icon: <Users className="h-8 w-8" />,
                title: "Team Collaboration",
                description: "Work together with real-time updates and shared access across your organization."
              }
            ].map((feature, idx) => (
              <div key={idx} className="group p-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="inline-flex p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Roles Section */}
      <div id="roles" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Built for every role in your team
            </h2>
            <p className="text-xl text-gray-600">
              Tailored experiences for different user types
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <ShoppingCart className="h-12 w-12" />,
                role: "Customer",
                color: "from-blue-500 to-cyan-500",
                features: ["Browse Products", "Place Orders", "Track Purchases", "View History"]
              },
              {
                icon: <Users className="h-12 w-12" />,
                role: "Biller",
                color: "from-purple-500 to-pink-500",
                features: ["Generate Invoices", "Process Payments", "Manage Transactions", "Customer Management"]
              },
              {
                icon: <Package className="h-12 w-12" />,
                role: "Inventory Manager",
                color: "from-indigo-500 to-purple-500",
                features: ["Stock Monitoring", "Supplier Management", "Analytics Dashboard", "Reorder Automation"]
              }
            ].map((role, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                <div className={`inline-flex p-4 bg-gradient-to-r ${role.color} rounded-2xl text-white mb-6`}>
                  {role.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{role.role}</h3>
                <ul className="space-y-3">
                  {role.features.map((feature, i) => (
                    <li key={i} className="flex items-center text-gray-600">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to transform your inventory management?
          </h2>
          <p className="text-xl text-indigo-100 mb-10">
            Join thousands of businesses already using InventoryPro
          </p>
          <button
            onClick={handleRegister}
            className="group px-10 py-4 bg-white text-indigo-600 font-bold rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 inline-flex items-center"
          >
            Get Started for Free
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

    
      <footer className="relative z-10 border-t border-white/10 bg-gray-800 text-white ">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Main Footer Content */}
          <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
            {/* Brand */}
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold">InventoryPro</span>
              </div>
              <p className="text-white-400 text-sm text-center md:text-left">
                Modern inventory management for teams of all sizes.
              </p>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-6">
              <a href="#" className="text-white-400 hover:text-blue transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
             <a href="mailto:exploreit1216@gmail.com" className="text-white-400 hover:text-blue transition-colors">
                <span className="sr-only">Email</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                  <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                </svg>
              </a>
              <a href="#" className="text-white-400 hover:text-blue transition-colors">
                <span className="sr-only">LinkedIn</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
            <p className="text-white-400 text-sm">
              © 2025 InventoryPro. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 text-sm">
              <a href="#" className="text-white-400 hover:text-blue transition-colors">Privacy</a>
              <span className="text-black-600">•</span>
              <a href="#" className="text-white-400 hover:text-blue transition-colors">Terms</a>
              <span className="text-black-600">•</span>
              <a href="#" className="text-white-400 hover:text-blue transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}