import { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownLeft, AlertTriangle, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/db';
import { Modal } from '../../components/Modal';
import { Avatar } from '../../components/Avatar';
import { StudentProfileModal } from '../../components/StudentProfileModal';

interface CaptainDashboardProps {
  onBorrow: () => void;
  onReturn: () => void;
}

interface LoanWithStudent {
  id: string;
  student_id: string;
  equipment_id: string;
  borrowed_at: string;
  due_at: string;
  student: {
    id: string;
    student_id: string;
    full_name: string;
    year_group: string;
    house: string | null;
    avatar_url: string | null;
    trust_score: number;
    is_blacklisted: boolean;
  };
  equipment_items: {
    name: string;
    item_id: string;
  };
}

export function CaptainDashboard({ onBorrow, onReturn }: CaptainDashboardProps) {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    activeLoans: 0,
    overdueLoans: 0,
  });
  const [showLoansModal, setShowLoansModal] = useState(false);
  const [modalType, setModalType] = useState<'active' | 'overdue'>('active');
  const [loans, setLoans] = useState<LoanWithStudent[]>([]);
  const [loadingLoans, setLoadingLoans] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showStudentProfile, setShowStudentProfile] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const allLoans = await db.loans.toArray();
      const loans = allLoans.filter(loan => loan.returned_at === null);

      const now = new Date();
      const overdue = loans.filter(loan => new Date(loan.due_at) < now).length;

      setStats({
        activeLoans: loans.length,
        overdueLoans: overdue,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async function loadLoans(type: 'active' | 'overdue') {
    setLoadingLoans(true);
    try {
      const allLoans = await db.loans.toArray();
      const loans = allLoans.filter(loan => loan.returned_at === null);

      const now = new Date();
      let filteredLoans = loans;

      if (type === 'overdue') {
        filteredLoans = loans.filter(loan => new Date(loan.due_at) < now);
      }

      // Sort by due_at ascending
      filteredLoans.sort((a, b) =>
        new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
      );

      const loansWithStudent: LoanWithStudent[] = await Promise.all(
        filteredLoans.map(async (loan) => {
          const [student, equipmentItem] = await Promise.all([
            db.students.get(loan.student_id),
            db.equipment.get(loan.equipment_id),
          ]);
          return {
            id: loan.id,
            student_id: loan.student_id,
            equipment_id: loan.equipment_id,
            borrowed_at: loan.borrowed_at,
            due_at: loan.due_at,
            student: student || {
              id: '',
              student_id: '',
              full_name: 'Unknown',
              year_group: '',
              house: null,
              avatar_url: null,
              trust_score: 50,
              is_blacklisted: false,
            },
            equipment_items: equipmentItem ? {
              name: equipmentItem.name,
              item_id: equipmentItem.item_id,
            } : {
              name: 'Unknown',
              item_id: '',
            },
          };
        })
      );

      setLoans(loansWithStudent);
    } catch (error) {
      console.error('Error loading loans:', error);
    } finally {
      setLoadingLoans(false);
    }
  }

  function handleShowLoans(type: 'active' | 'overdue') {
    setModalType(type);
    setShowLoansModal(true);
    loadLoans(type);
  }

  function handleStudentClick(student: any) {
    setSelectedStudent(student);
    setShowStudentProfile(true);
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function getDaysOverdue(dueDate: string) {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = now.getTime() - due.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-6 sm:pb-8">
      <div className="pt-2 sm:pt-4">
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
          {getGreeting()}, {profile?.full_name || 'Captain'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base md:text-lg mt-1 sm:mt-2">Ready to manage the equipment?</p>
      </div>

      <div className="space-y-4">
        <button
          onClick={onBorrow}
          className="w-full bg-blue-600 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-lg hover:shadow-xl transition-all text-white relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent"></div>
          <div className="relative flex items-center justify-between">
            <div className="text-left">
              <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">BORROW</h2>
              <p className="text-blue-100 text-sm sm:text-lg">Lend items to students</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-14 h-14 sm:w-20 sm:h-20 bg-blue-500/50 rounded-full flex items-center justify-center">
                <ArrowUpRight className="w-7 h-7 sm:w-10 sm:h-10" strokeWidth={2.5} />
              </div>
              <div className="w-12 h-12 sm:w-16 sm:h-16 text-blue-200 hidden sm:block">
                <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="3" />
                  <path d="M50 10 L50 50 M90 50 L50 50 M50 90 L50 50 M10 50 L50 50" stroke="currentColor" strokeWidth="2" />
                  <circle cx="50" cy="25" r="8" />
                  <circle cx="75" cy="50" r="8" />
                  <circle cx="50" cy="75" r="8" />
                  <circle cx="25" cy="50" r="8" />
                </svg>
              </div>
            </div>
          </div>
        </button>

        <button
          onClick={onReturn}
          className="w-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-md hover:shadow-lg transition-all relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">RETURN</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-lg">Check items back in</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-14 h-14 sm:w-20 sm:h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <ArrowDownLeft className="w-7 h-7 sm:w-10 sm:h-10 text-gray-700 dark:text-gray-300" strokeWidth={2.5} />
              </div>
              <div className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600 hidden sm:block">
                <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" className="w-full h-full" strokeWidth="3">
                  <rect x="20" y="15" width="60" height="70" rx="5" />
                  <path d="M35 35 L45 45 L65 25" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="30" y1="60" x2="70" y2="60" />
                  <line x1="30" y1="70" x2="70" y2="70" />
                </svg>
              </div>
            </div>
          </div>
        </button>
      </div>

      <div>
        <div className="mb-3 sm:mb-4">
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Quick Status</h3>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
          <button
            onClick={() => handleShowLoans('active')}
            className="bg-blue-50 dark:bg-blue-900/30 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 border border-blue-100 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-left"
          >
            <div className="flex items-start gap-1.5 sm:gap-2 md:gap-3 mb-1.5 sm:mb-2 md:mb-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-6 md:h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">ACTIVE</p>
              </div>
            </div>
            <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-0.5 sm:mb-1">{stats.activeLoans}</p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Items currently out</p>
          </button>

          <button
            onClick={() => handleShowLoans('overdue')}
            className="bg-red-50 dark:bg-red-900/30 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 border border-red-100 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors text-left"
          >
            <div className="flex items-start gap-1.5 sm:gap-2 md:gap-3 mb-1.5 sm:mb-2 md:mb-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-red-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-6 md:h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">OVERDUE</p>
              </div>
            </div>
            <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-0.5 sm:mb-1">{stats.overdueLoans}</p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Action needed</p>
          </button>
        </div>
      </div>

      <Modal
        isOpen={showLoansModal}
        onClose={() => setShowLoansModal(false)}
        title={modalType === 'active' ? 'Active Loans' : 'Overdue Loans'}
        size="lg"
      >
        {loadingLoans ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
          </div>
        ) : loans.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No {modalType === 'active' ? 'active' : 'overdue'} loans found
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {loans.map(loan => {
              const isOverdue = modalType === 'overdue' || new Date(loan.due_at) < new Date();
              const daysOverdue = isOverdue ? getDaysOverdue(loan.due_at) : 0;

              return (
                <button
                  key={loan.id}
                  onClick={() => handleStudentClick(loan.student)}
                  className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={loan.student?.avatar_url}
                      name={loan.student?.full_name}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{loan.student?.full_name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {loan.student?.year_group} • {loan.student?.house}
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                        {loan.equipment_items?.name} ({loan.equipment_items?.item_id})
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className={`text-sm ${isOverdue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-600 dark:text-gray-300'}`}>
                          Due: {formatDate(loan.due_at)}
                        </p>
                        {isOverdue && (
                          <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 text-xs font-semibold rounded">
                            {daysOverdue}d overdue
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${loan.student?.trust_score >= 80 ? 'text-green-600 dark:text-green-400' :
                        loan.student?.trust_score >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                        {Math.round(loan.student?.trust_score || 50)}%
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Trust</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Modal>

      <StudentProfileModal
        isOpen={showStudentProfile}
        onClose={() => setShowStudentProfile(false)}
        student={selectedStudent}
      />
    </div>
  );
}
