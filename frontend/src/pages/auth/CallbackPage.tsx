import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { azureCallback } from '../../store/slices/authSlice';
import { AppDispatch } from '../../store';
import { toast } from 'react-toastify';

const CallbackPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        console.error('Azure AD error:', error, errorDescription);
        toast.error(errorDescription || 'Authentication failed');
        navigate('/login');
        return;
      }

      if (!code) {
        toast.error('No authorization code received');
        navigate('/login');
        return;
      }

      try {
        await dispatch(azureCallback(code)).unwrap();
        toast.success('Successfully logged in!');
        navigate('/dashboard');
      } catch (err: any) {
        console.error('Callback error:', err);
        toast.error(err.message || 'Authentication failed');
        navigate('/login');
      }
    };

    handleCallback();
  }, [dispatch, navigate, searchParams]);

  return (
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Completing sign in...
      </h2>
      <p className="text-gray-600">
        Please wait while we authenticate you.
      </p>
    </div>
  );
};

export default CallbackPage;
