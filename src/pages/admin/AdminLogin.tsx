import { useState } from 'react';
import { User, EyeOff, Eye,LogIn, Trophy } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AdminLoginProps {
  onSportsCaptainMode?: () => void;
}

export function AdminLogin({ onSportsCaptainMode }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl md:rounded-3xl shadow-xl p-5 sm:p-8 md:p-10 w-full max-w-lg">
        <div className="text-center mb-5 sm:mb-6 md:mb-8">
          <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6 overflow-hidden bg-white dark:bg-gray-700 shadow-lg">
            <img src="/icss_logo.png" alt="ICSS Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">ICSS Equipment Borrowing</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm md:text-base lg:text-lg">Manage inventory and borrowing requests</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-2.5 sm:p-3 rounded-lg sm:rounded-xl text-xs sm:text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-900 dark:text-white mb-1.5 sm:mb-2">
              Username or Email
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@school.edu"
                required
                className="w-full pl-3 sm:pl-4 pr-10 sm:pr-12 py-3 sm:py-4 text-sm sm:text-base bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-600 transition-all text-gray-700 dark:text-gray-300"
              />
              <User className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-900 dark:text-white mb-1.5 sm:mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-3 sm:pl-4 pr-10 sm:pr-12 py-3 sm:py-4 text-sm sm:text-base bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-600 transition-all text-gray-700 dark:text-gray-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
              >
                {showPassword ? (
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
                ) : (
                  <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 text-sm sm:text-base"
          >
            <span>{loading ? 'Logging in...' : 'Log In'}</span>
            <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </form>

        <div className="relative my-6 sm:my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-xs sm:text-sm">
            <span className="px-3 sm:px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">Switch Context</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onSportsCaptainMode}
          className="w-full bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base"
        >
          <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
          <span>Sports Captain Dashboard</span>
        </button>
      </div>
    </div>
  );
}
