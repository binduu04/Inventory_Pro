// // src/pages/Register.jsx
// import { useState } from 'react';
// import { useAuth } from '../context/AuthContext';
// import { useNavigate, Link } from 'react-router-dom';
// import './Auth.css';

// const Register = () => {
//   const [formData, setFormData] = useState({
//     email: '',
//     password: '',
//     confirmPassword: '',
//     fullName: '',
//     phone: '',
//     role: 'customer', // user chooses at signup (demo)
//   });
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [loading, setLoading] = useState(false);
//   const { signUp } = useAuth();
//   const navigate = useNavigate();

//   const handleChange = (e) => {
//     setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setSuccess('');

//     if (formData.password !== formData.confirmPassword) {
//       setError('Passwords do not match');
//       return;
//     }
//     if (formData.password.length < 6) {
//       setError('Password must be at least 6 characters long');
//       return;
//     }

//     setLoading(true);
//     try {
//       const { data, error } = await signUp(
//         formData.email,
//         formData.password,
//         formData.fullName,
//         formData.phone,
//         formData.role
//       );

//       if (error) {
//         setError(error.message || String(error));
//         return;
//       }

//       // show message to user to check email for confirmation
//       setSuccess('Registration successful! Please check your email and confirm your address.');

//       // optionally navigate to login or a "check your email" page
//       setTimeout(() => navigate('/login'), 1800);
//     } catch (err) {
//       console.error(err);
//       setError('An unexpected error occurred. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="auth-container">
//       <div className="auth-card register-card">
//         <div className="auth-header">
//           <h2>Create Account</h2>
//           <p>Sign up to get started</p>
//         </div>

//         <form onSubmit={handleSubmit} className="auth-form">
//           {error && <div className="error-message">{error}</div>}
//           {success && <div className="success-message">{success}</div>}

//           <div className="form-group">
//             <label htmlFor="fullName">Full Name</label>
//             <input id="fullName" type="text" name="fullName" value={formData.fullName}
//               onChange={handleChange} placeholder="John Doe" required />
//           </div>

//           <div className="form-group">
//             <label htmlFor="email">Email Address</label>
//             <input id="email" type="email" name="email" value={formData.email}
//               onChange={handleChange} placeholder="you@example.com" required autoComplete="email" />
//           </div>

//           <div className="form-group">
//             <label htmlFor="phone">Phone (optional)</label>
//             <input id="phone" type="tel" name="phone" value={formData.phone}
//               onChange={handleChange} placeholder="+91 9XXXXXXXXX" />
//           </div>

//           <div className="form-group">
//             <label htmlFor="role">Role (demo)</label>
//             <select id="role" name="role" value={formData.role} onChange={handleChange} required>
//               <option value="customer">Customer</option>
//               <option value="biller">Biller</option>
//               <option value="manager">Manager</option>
//             </select>
//             <small className="hint">Role chosen now will be recorded only after you confirm your email.</small>
//           </div>

//           <div className="form-group">
//             <label htmlFor="password">Password</label>
//             <input id="password" type="password" name="password" value={formData.password}
//               onChange={handleChange} placeholder="••••••••" required minLength={6} />
//           </div>

//           <div className="form-group">
//             <label htmlFor="confirmPassword">Confirm Password</label>
//             <input id="confirmPassword" type="password" name="confirmPassword" value={formData.confirmPassword}
//               onChange={handleChange} placeholder="••••••••" required minLength={6} />
//           </div>

//           <button type="submit" className="auth-button" disabled={loading}>
//             {loading ? 'Creating account...' : 'Sign Up'}
//           </button>
//         </form>

//         <div className="auth-footer">
//           <p>Already have an account?{' '}
//             <Link to="/login" className="auth-link">Sign in</Link>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Register;



import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Package, ShoppingCart, Users, UserCog } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'customer'
  });

  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/[-()\s]/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateForm()) {
      return;
    }

    // if (formData.password !== formData.confirmPassword) {
    //   setError('Passwords do not match');
    //   return;
    // }

    // if (formData.password.length < 6) {
    //   setError('Password must be at least 6 characters long');
    //   return;
    // }

    setLoading(true);
    try {
      const { data, error } = await signUp(
        formData.email,
        formData.password,
        formData.fullName,
        formData.phone,
        formData.role
      );

      if (error) {
        setError(error.message || String(error));
        return;
      }

      // Show message to user to check email for confirmation
      setSuccess('Registration successful! Please check your email and confirm your address.');

      // Optionally navigate to login or a "check your email" page
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 left-10 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 right-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 py-12">
        <div className="w-full max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Left Side - Branding & Benefits */}
            <div className="hidden md:block sticky top-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-3 rounded-xl">
                  <Package className="h-8 w-8 text-white" />
                </div>
                <span className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  InventoryPro
                </span>
              </div>
              
              <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                Start your journey with
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                  InventoryPro
                </span>
              </h1>
              
              <p className="text-lg text-gray-600 mb-8">
                Join thousands of businesses streamlining their inventory management with our powerful platform.
              </p>

              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <p className="text-sm text-gray-600 italic">
                  "InventoryPro transformed how we manage our stock. The role-based system is exactly what we needed!"
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    JD
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">John Doe</p>
                    <p className="text-sm text-gray-600">Operations Manager</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Registration Form */}
            <div className="w-full">
              <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                {/* Mobile Branding */}
                <div className="md:hidden px-8 pt-8 pb-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-2 rounded-lg">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      InventoryPro
                    </span>
                  </div>
                </div>

                {/* Header */}
                <div className="px-8 pt-8 pb-6">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
                  <p className="text-gray-600">Sign up to get started</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-8 pb-8">
                  {/* Global Error/Success Messages */}
                  {error && (
                    <div className="mb-5 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="mb-5 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
                      {success}
                    </div>
                  )} 

                  {/* Name and Phone in Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                    {/* Name Input */}
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          className={`block w-full pl-12 pr-4 py-3.5 border ${
                            errors.fullName ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                          } rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400`}
                          placeholder="John Doe"
                          required
                        />
                      </div>
                      {errors.fullName && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <span className="inline-block w-1 h-1 bg-red-600 rounded-full"></span>
                          {errors.fullName}
                        </p>
                      )}
                    </div>

                    {/* Phone Input */}
                    <div>
                      <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className={`block w-full pl-12 pr-4 py-3.5 border ${
                            errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                          } rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400`}
                          placeholder="+91 9XXXXXXXXX"
                        />
                      </div>
                      {errors.phone && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <span className="inline-block w-1 h-1 bg-red-600 rounded-full"></span>
                          {errors.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Email Input */}
                  <div className="mb-5">
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`block w-full pl-12 pr-4 py-3.5 border ${
                          errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                        } rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400`}
                        placeholder="you@example.com"
                        required
                        autoComplete="email"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <span className="inline-block w-1 h-1 bg-red-600 rounded-full"></span>
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Password Inputs in Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {/* Password Input */}
                    <div>
                      <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="password"
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          className={`block w-full pl-12 pr-4 py-3.5 border ${
                            errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                          } rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400`}
                          placeholder="Min. 6 characters"
                          required
                          minLength={6}
                        />
                      </div>
                      {errors.password && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <span className="inline-block w-1 h-1 bg-red-600 rounded-full"></span>
                          {errors.password}
                        </p>
                      )}
                    </div>

                    {/* Confirm Password Input */}
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="password"
                          id="confirmPassword"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className={`block w-full pl-12 pr-4 py-3.5 border ${
                            errors.confirmPassword ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                          } rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400`}
                          placeholder="Re-enter password"
                          required
                          minLength={6}
                        />
                      </div>
                      {errors.confirmPassword && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <span className="inline-block w-1 h-1 bg-red-600 rounded-full"></span>
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="mb-6">
                    <label className="flex items-start cursor-pointer group">
                      <input
                        id="terms"
                        type="checkbox"
                        className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                        required
                      />
                      <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900">
                        I agree to the{' '}
                        <a href="#" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                          Terms and Conditions
                        </a>
                        {' '}and{' '}
                        <a href="#" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                          Privacy Policy
                        </a>
                      </span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    disabled={loading}
                  >
                    {loading ? 'Creating account...' : 'Sign Up'}
                  </button>

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500">Already have an account?</span>
                    </div>
                  </div>

                  {/* Login Link */}
                  <div className="text-center">
                    <Link 
                      to="/login" 
                      className="inline-flex items-center justify-center w-full px-6 py-3.5 border-2 border-indigo-600 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-all duration-200"
                    >
                      Sign in
                    </Link>
                  </div>
                </form>
              </div>

              {/* Trust Indicators */}
              <div className="mt-6 text-center text-sm text-gray-600">
                <p className="flex items-center justify-center gap-2">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Your data is protected with enterprise-grade security
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

