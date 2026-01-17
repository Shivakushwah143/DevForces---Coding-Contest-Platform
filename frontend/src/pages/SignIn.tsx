import { useState } from 'react';
import { Mail, CheckCircle } from 'lucide-react';
import api from '../lib/api';
import Layout from '../components/Layout';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/user/signin', { email });
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send sign-in email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-bg-primary rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-primary-main rounded-full flex items-center justify-center">
                  <Mail className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-neutral-black mb-2">Welcome to DevForces</h1>
              <p className="text-neutral-medium">Sign in to compete in coding challenges</p>
            </div>

            {!sent ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-dark mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-3 rounded-lg border border-border-medium focus:border-primary-main focus:ring-2 focus:ring-primary-light focus:ring-opacity-20 outline-none transition-all"
                  />
                </div>

                {error && (
                  <div className="bg-error bg-opacity-10 border border-error text-error px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary-main text-white py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send Magic Link'}
                </button>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle className="w-16 h-16 text-success" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-black">Check your email!</h3>
                <p className="text-neutral-medium">
                  We've sent a sign-in link to <strong className="text-neutral-black">{email}</strong>
                </p>
                <p className="text-sm text-neutral-medium">
                  Click the link in the email to complete sign-in.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="text-primary-main hover:text-primary-dark font-medium text-sm"
                >
                  Use a different email
                </button>
              </div>
            )}
          </div>

          <p className="text-center text-sm text-neutral-medium mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </Layout>
  );
}
