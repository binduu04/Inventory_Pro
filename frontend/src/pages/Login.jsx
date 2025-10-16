// // src/pages/Login.jsx
// import { useState } from 'react';
// import { useAuth } from '../context/AuthContext';
// import { useNavigate, Link } from 'react-router-dom';
// import { supabase } from '../config/supabase';
// import './Auth.css';

// const Login = () => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const { signIn } = useAuth();
//   const navigate = useNavigate();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setLoading(true);

//     try {
//       const { data, error } = await signIn(email, password);

//       if (error) {
//         setError(error.message || String(error));
//         return;
//       }

//       if (data?.user) {
//         // fetch role from profiles (may be missing if not confirmed yet)
//         const { data: profileData, error: profileError } = await supabase
//           .from('profiles')
//           .select('role')
//           .eq('id', data.user.id)
//           .single();

//         if (profileError) {
//           // If profile not found, default to 'customer' (or handle as you wish)
//           console.warn('Profile fetch error or profile not created yet:', profileError.message || profileError);
//         }

//         const role = profileData?.role || 'customer';

//         switch (role) {
//           case 'manager':
//             navigate('/dashboard/manager');
//             break;
//           case 'biller':
//             navigate('/dashboard/biller');
//             break;
//           case 'customer':
//           default:
//             navigate('/dashboard/customer');
//             break;
//         }
//       }
//     } catch (err) {
//       console.error(err);
//       setError('An unexpected error occurred. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="auth-container">
//       <div className="auth-card">
//         <div className="auth-header">
//           <h2>Welcome Back</h2>
//           <p>Sign in to your account</p>
//         </div>

//         <form onSubmit={handleSubmit} className="auth-form">
//           {error && <div className="error-message">{error}</div>}

//           <div className="form-group">
//             <label htmlFor="email">Email Address</label>
//             <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
//               placeholder="you@example.com" required autoComplete="email" />
//           </div>

//           <div className="form-group">
//             <label htmlFor="password">Password</label>
//             <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
//               placeholder="••••••••" required autoComplete="current-password" minLength={6} />
//           </div>

//           <button type="submit" className="auth-button" disabled={loading}>
//             {loading ? 'Signing in...' : 'Sign In'}
//           </button>
//         </form>

//         <div className="auth-footer">
//           <p>Don't have an account?{' '}
//             <Link to="/register" className="auth-link">Sign up</Link>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { Mail, Lock, Package } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'email') setEmail(value);
    if (name === 'password') setPassword(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: signInError } = await signIn(email, password);
      
      if (signInError) {
        setError(signInError.message || String(signInError));
        return;
      }

      if (data?.user) {
        // fetch role from profiles
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.warn('Profile fetch error or profile not created yet:', profileError.message || profileError);
        }

        const role = profileData?.role || 'customer';

        switch (role) {
          case 'manager':
            navigate('/dashboard/manager');
            break;
          case 'biller':
            navigate('/dashboard/biller');
            break;
          case 'customer':
          default:
            navigate('/dashboard/customer');
            break;
        }
      }
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
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left Side - Branding */}
            <div className="hidden md:block">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-3 rounded-xl">
                  <Package className="h-8 w-8 text-white" />
                </div>
                <span className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  InventoryPro
                </span>
              </div>
              
              <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                Welcome back to your
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                  workspace
                </span>
              </h1>
              
              <p className="text-lg text-gray-600 mb-8">
                Sign in to access your inventory management dashboard and streamline your operations.
              </p>
            </div>

            {/* Right Side - Login Form */}
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
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h2>
                  <p className="text-gray-600">Enter your credentials</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-8 pb-8">
                  {/* Error Message */}
                  {error && (
                    <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

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
                        value={email}
                        onChange={handleChange}
                        className="block w-full pl-12 pr-4 py-3.5 border border-gray-300 bg-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400"
                        placeholder="you@example.com"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="mb-6">
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
                        value={password}
                        onChange={handleChange}
                        className="block w-full pl-12 pr-4 py-3.5 border border-gray-300 bg-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 placeholder:text-gray-400"
                        placeholder="••••••••"
                        required
                        autoComplete="current-password"
                        minLength={6}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    disabled={loading}
                  >
                    {loading ? 'Signing in...' : 'Sign In to Dashboard'}
                  </button>

                  {/* Divider */}
                  <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500">New to InventoryPro?</span>
                    </div>
                  </div>

                  {/* Register Link */}
                  <div className="text-center">
                    <Link 
                      to="/register" 
                      className="inline-flex items-center justify-center w-full px-6 py-3.5 border-2 border-indigo-600 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-all duration-200"
                    >
                      Create an Account
                    </Link>
                  </div>
                </form>
              </div>

              {/* Trust Indicators */}
              <div className="mt-6 text-center text-sm text-gray-600">
                <p className="flex items-center justify-center gap-2">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Secured with 256-bit encryption
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

