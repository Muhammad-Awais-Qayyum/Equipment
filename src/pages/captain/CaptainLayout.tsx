import { ReactNode } from 'react';
import { LogOut, ArrowLeft, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDarkMode } from '../../contexts/DarkModeContext';

interface CaptainLayoutProps {
  children: ReactNode;
  currentTab?: 'home' | 'inventory' | 'history' | 'profile';
  onTabChange?: (tab: 'home' | 'inventory' | 'history' | 'profile') => void;
  onBackToLogin?: () => void;
}

export function CaptainLayout({ children, onBackToLogin }: CaptainLayoutProps) {
  const { signOut } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const handleLogout = async () => {
    if (onBackToLogin) {
      onBackToLogin();
    } else {
      try {
        await signOut();
      } catch (error) {
        console.error('Error signing out:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden flex items-center justify-center bg-white dark:bg-gray-700 shadow-sm">
              <img src="/icss_logo.png" alt="ICSS Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Sports Captain</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? (
                <Sun className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              ) : (
                <Moon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              )}
            </button>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors group"
              title={onBackToLogin ? "Back to Login" : "Logout"}
            >
              {onBackToLogin ? (
                <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400" />
              ) : (
                <LogOut className="w-6 h-6 text-gray-700 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        {children}
      </main>
    </div>
  );
}
