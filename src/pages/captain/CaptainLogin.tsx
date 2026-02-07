import { useState } from 'react';
import { CreditCard, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';

interface CaptainLoginProps {
  onSwitchToAdmin: () => void;
}

export function CaptainLogin({ onSwitchToAdmin }: CaptainLoginProps) {
  const [studentId, setStudentId] = useState('');
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
      const email = studentId.includes('@') ? studentId : studentId + '@school.edu';
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      <div className="flex-1 flex flex-col p-3 sm:p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full overflow-hidden flex items-center justify-center bg-white dark:bg-gray-700 shadow-sm">
              <img src="/icss_logo.png" alt="ICSS Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 dark:text-white">Sports Captain Portal</h1>
          </div>
          <div className="px-2 sm:px-3 py-0.5 sm:py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs sm:text-sm font-semibold rounded-full">
            Online
          </div>
        </div>

        <div className="relative rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden mb-4 sm:mb-6 md:mb-8 shadow-xl">
          <img
            src="https://images.pexels.com/photos/3612/sport-balls-basketball-ball.jpg?auto=compress&cs=tinysrgb&w=800"
            alt="Equipment Center"
            className="w-full h-32 sm:h-40 md:h-48 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
            <h2 className="text-white text-lg sm:text-xl md:text-2xl font-bold p-3 sm:p-4 md:p-6">Equipment Center</h2>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1.5 sm:mb-2 text-center">Welcome, Captain</h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-4 sm:mb-6 md:mb-8 text-xs sm:text-sm md:text-base">
            Please sign in to start your shift and manage inventory.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-2.5 sm:p-3 rounded-lg text-xs sm:text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-1.5 sm:mb-2">
                Email or Student ID
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Enter your email or ID number"
                  required
                  className="w-full pl-10 sm:pl-11 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-900 dark:text-white mb-1.5 sm:mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 sm:pl-11 pr-10 sm:pr-11 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                >
                  {showPassword ? (
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
                  ) : (
                    <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              disabled={loading}
              className="flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {loading ? 'Signing in...' : 'LOG IN'}
              <span className="text-lg sm:text-xl">→</span>
            </Button>
          </form>
        </div>

        <button
          onClick={onSwitchToAdmin}
          className="flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300 font-medium py-3 sm:py-4 hover:text-gray-900 dark:hover:text-white transition-colors text-sm sm:text-base"
        >
          <User className="w-4 h-4 sm:w-5 sm:h-5" />
          Teacher / Admin Login
        </button>

        <p className="text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-3 sm:mt-4">
          Need help? Contact Mr. Smith in the PE Office.
        </p>
      </div>
    </div>
  );
}
