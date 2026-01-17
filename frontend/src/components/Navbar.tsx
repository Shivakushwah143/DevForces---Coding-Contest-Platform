import { Link, useNavigate } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { authState } from '../store/atoms';
import { clearAuth } from '../lib/auth';
import { Code2, Trophy, Users, LogOut, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const [auth, setAuth] = useRecoilState(authState);
  const navigate = useNavigate();

  const handleSignOut = () => {
    clearAuth();
    setAuth({ token: null, user: null, isAuthenticated: false });
    navigate('/signin');
  };

  return (
    <nav className="bg-bg-primary border-b border-border-light sticky top-0 z-50">
      <div className=" mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <Code2 className="w-8 h-8 text-primary-main" />
              <span className="text-2xl font-bold text-neutral-black">DevForces</span>
            </Link>

            {auth.isAuthenticated && (
              <div className="hidden md:flex items-center space-x-6">
                <Link
                  to="/contests/active"
                  className="flex items-center space-x-2 text-neutral-dark hover:text-primary-main transition-colors"
                >
                  <Trophy className="w-5 h-5" />
                  <span className="font-medium">Contests</span>
                </Link>
                <Link
                  to="/contests/finished"
                  className="flex items-center space-x-2 text-neutral-dark hover:text-primary-main transition-colors"
                >
                  <Users className="w-5 h-5" />
                  <span className="font-medium">Leaderboard</span>
                </Link>
                {auth.user?.role === 'Admin' && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-2 text-neutral-dark hover:text-secondary-main transition-colors"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    <span className="font-medium">Admin</span>
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {auth.isAuthenticated ? (
              <>
                <div className="hidden md:flex items-center space-x-3">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium text-neutral-black">
                      {auth.user?.email}
                    </span>
                    <span className="text-xs text-neutral-medium">{auth.user?.role}</span>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-neutral-dark hover:bg-bg-tertiary transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="hidden md:inline">Sign Out</span>
                </button>
              </>
            ) : (
              <Link
                to="/signin"
                className="px-6 py-2 bg-primary-main text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
