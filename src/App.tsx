import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminInventory } from './pages/admin/AdminInventory';
import { AdminStudents } from './pages/admin/AdminStudents';
import { AdminSettings } from './pages/admin/AdminSettings';
import { CaptainLogin } from './pages/captain/CaptainLogin';
import { CaptainLayout } from './pages/captain/CaptainLayout';
import { CaptainDashboard } from './pages/captain/CaptainDashboard';
import { BorrowFlow } from './pages/captain/BorrowFlow';
import { ReturnFlow } from './pages/captain/ReturnFlow';
import { InstallPrompt } from './components/InstallPrompt';

type View = 'admin-login' | 'captain-login' | 'admin' | 'captain' | 'captain-mode';
type AdminTab = 'home' | 'inventory' | 'students' | 'settings';
type CaptainTab = 'home' | 'inventory' | 'history' | 'profile';
type CaptainView = 'dashboard' | 'borrow' | 'return';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [view, setView] = useState<View>('admin-login');
  const [adminTab, setAdminTab] = useState<AdminTab>('home');
  const [captainTab, setCaptainTab] = useState<CaptainTab>('home');
  const [captainView, setCaptainView] = useState<CaptainView>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (view === 'captain-mode') {
    if (captainView === 'borrow') {
      return <BorrowFlow onComplete={() => setCaptainView('dashboard')} />;
    }

    if (captainView === 'return') {
      return <ReturnFlow onComplete={() => setCaptainView('dashboard')} />;
    }

    return (
      <CaptainLayout
        currentTab={captainTab}
        onTabChange={setCaptainTab}
        onBackToLogin={() => setView('admin-login')}
      >
        {captainTab === 'home' && (
          <CaptainDashboard
            onBorrow={() => setCaptainView('borrow')}
            onReturn={() => setCaptainView('return')}
          />
        )}
        {captainTab === 'inventory' && (
          <div className="py-20 text-center text-gray-500">
            <p>Inventory view coming soon</p>
          </div>
        )}
        {captainTab === 'history' && (
          <div className="py-20 text-center text-gray-500">
            <p>History view coming soon</p>
          </div>
        )}
        {captainTab === 'profile' && (
          <div className="py-20 text-center text-gray-500">
            <p>Profile view coming soon</p>
          </div>
        )}
      </CaptainLayout>
    );
  }

  if (user && profile) {
    if (profile.role === 'admin') {
      return (
        <AdminLayout currentTab={adminTab} onTabChange={setAdminTab}>
          {adminTab === 'home' && <AdminDashboard />}
          {adminTab === 'inventory' && <AdminInventory />}
          {adminTab === 'students' && <AdminStudents />}
          {adminTab === 'settings' && <AdminSettings />}
        </AdminLayout>
      );
    }

    if (profile.role === 'sports_captain') {
      if (captainView === 'borrow') {
        return <BorrowFlow onComplete={() => setCaptainView('dashboard')} />;
      }

      if (captainView === 'return') {
        return <ReturnFlow onComplete={() => setCaptainView('dashboard')} />;
      }

      return (
        <CaptainLayout currentTab={captainTab} onTabChange={setCaptainTab}>
          {captainTab === 'home' && (
            <CaptainDashboard
              onBorrow={() => setCaptainView('borrow')}
              onReturn={() => setCaptainView('return')}
            />
          )}
          {captainTab === 'inventory' && (
            <div className="py-20 text-center text-gray-500">
              <p>Inventory view coming soon</p>
            </div>
          )}
          {captainTab === 'history' && (
            <div className="py-20 text-center text-gray-500">
              <p>History view coming soon</p>
            </div>
          )}
          {captainTab === 'profile' && (
            <div className="py-20 text-center text-gray-500">
              <p>Profile view coming soon</p>
            </div>
          )}
        </CaptainLayout>
      );
    }
  }

  if (view === 'admin-login') {
    return <AdminLogin onSportsCaptainMode={() => setView('captain-login')} />;
  }

  if (view === 'captain-login') {
    return <CaptainLogin onSwitchToAdmin={() => setView('admin-login')} />;
  }

  return <AdminLogin onSportsCaptainMode={() => setView('captain-login')} />;
}

function App() {
  return (
    <DarkModeProvider>
      <AuthProvider>
        <AppContent />
        <InstallPrompt />
      </AuthProvider>
    </DarkModeProvider>
  );
}

export default App;
