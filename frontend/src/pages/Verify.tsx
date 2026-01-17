import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import api from '../lib/api';
import { authState } from '../store/atoms';
import { saveAuth } from '../lib/auth';
import Layout from '../components/Layout';

export default function Verify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useSetRecoilState(authState);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await api.get(`/user/signin/verify?token=${token}`);
        const { token: authToken, user } = response.data;

        saveAuth(authToken, user);
        setAuth({
          token: authToken,
          user,
          isAuthenticated: true,
        });

        setStatus('success');
        setMessage('Successfully signed in!');

        setTimeout(() => {
          navigate('/contests/active');
        }, 1500);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Verification failed');
      }
    };

    verifyToken();
  }, [searchParams, navigate, setAuth]);

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-bg-primary rounded-2xl shadow-lg p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 text-primary-main animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-neutral-black mb-2">Verifying...</h2>
              <p className="text-neutral-medium">Please wait while we sign you in</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-neutral-black mb-2">Success!</h2>
              <p className="text-neutral-medium">{message}</p>
              <p className="text-sm text-neutral-medium mt-2">Redirecting to contests...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-error mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-neutral-black mb-2">Verification Failed</h2>
              <p className="text-neutral-medium mb-6">{message}</p>
              <button
                onClick={() => navigate('/signin')}
                className="px-6 py-3 bg-primary-main text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
              >
                Back to Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
