import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { azureLogin } from '../../store/slices/authSlice';
import { AppDispatch, RootState } from '../../store';

const LoginPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAzureLogin = async () => {
    try {
      await dispatch(azureLogin()).unwrap();
    } catch (err) {
      console.error('Azure login failed:', err);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement email/password login if needed
    console.log('Email login not implemented in MVP');
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Sign In
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Azure AD Login */}
      <button
        onClick={handleAzureLogin}
        disabled={isLoading}
        className="w-full btn-primary flex items-center justify-center py-3 mb-6"
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 23 23" fill="currentColor">
          <path d="M0 0h11v11H0zM12 0h11v11H12zM0 12h11v11H0zM12 12h11v11H12z" />
        </svg>
        {isLoading ? 'Signing in...' : 'Sign in with Microsoft'}
      </button>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with email</span>
        </div>
      </div>

      {/* Email/Password Form (Optional - for development) */}
      <form onSubmit={handleEmailLogin}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="your@email.com"
            disabled={isLoading}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="••••••••"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !email || !password}
          className="w-full btn-primary py-3"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-gray-500 text-sm mt-6">
        Protected by Azure Active Directory
      </p>
    </div>
  );
};

export default LoginPage;
