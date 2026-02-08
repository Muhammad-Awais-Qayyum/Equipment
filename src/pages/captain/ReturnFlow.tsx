import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { SearchBar } from '../../components/SearchBar';
import { FilterPills } from '../../components/FilterPills';
import { Button } from '../../components/Button';
import { StatusBadge } from '../../components/StatusBadge';
import { Toast } from '../../components/Toast';
import { db, updateStudentTrustScore } from '../../lib/db';

export function ReturnFlow({ onComplete }: { onComplete: () => void }) {
  const [loans, setLoans] = useState<any[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Borrowed');
  const [showToast, setShowToast] = useState(false);
  const [lastReturned, setLastReturned] = useState<any>(null);

  useEffect(() => {
    loadLoans();
  }, []);

  useEffect(() => {
    filterLoans();
  }, [loans, searchQuery, statusFilter]);

  async function loadLoans() {
    const allLoans = await db.loans.toArray();
    const loans = allLoans.filter(loan => loan.returned_at === null);

    // Sort by due_at ascending
    loans.sort((a, b) =>
      new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
    );

    // Get student and equipment details
    const loansWithDetails = await Promise.all(
      loans.map(async (loan) => {
        const [student, equipment] = await Promise.all([
          db.students.get(loan.student_id),
          db.equipment.get(loan.equipment_id),
        ]);
        return {
          ...loan,
          student: student || null,
          equipment: equipment || null,
        };
      })
    );

    setLoans(loansWithDetails);
  }

  function filterLoans() {
    let filtered = loans;

    if (searchQuery) {
      filtered = filtered.filter(
        loan =>
          loan.student?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          loan.equipment?.item_id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter === 'Overdue') {
      const now = new Date();
      filtered = filtered.filter(loan => new Date(loan.due_at) < now);
    } else if (statusFilter === "Today's") {
      const today = new Date().toDateString();
      filtered = filtered.filter(
        loan => new Date(loan.borrowed_at).toDateString() === today
      );
    }

    setFilteredLoans(filtered);
  }

  async function handleReturn(loan: any) {
    try {
      const now = new Date().toISOString();

      await db.loans.update(loan.id, {
        returned_at: now,
        status: 'returned',
        is_overdue: false,
      });

      await db.equipment.update(loan.equipment_id, {
        status: 'available',
        updated_at: now,
      });

      // Update student trust score
      await updateStudentTrustScore(loan.student_id);

      setLastReturned(loan);
      setShowToast(true);
      loadLoans();
    } catch (error) {
      console.error('Error returning item:', error);
    }
  }

  async function handleUndo() {
    if (!lastReturned) return;

    try {
      const now = new Date().toISOString();

      await db.loans.update(lastReturned.id, {
        returned_at: null,
        status: 'active',
      });

      await db.equipment.update(lastReturned.equipment_id, {
        status: 'borrowed',
        updated_at: now,
      });

      // Recalculate trust score
      await updateStudentTrustScore(lastReturned.student_id);

      loadLoans();
      setShowToast(false);
    } catch (error) {
      console.error('Error undoing return:', error);
    }
  }

  function isOverdue(dueDate: string) {
    return new Date(dueDate) < new Date();
  }

  function formatDueTime(dueDate: string) {
    const due = new Date(dueDate);
    const now = new Date();

    if (isOverdue(dueDate)) {
      return 'Due yesterday';
    }

    const diffHours = Math.floor((due.getTime() - now.getTime()) / 3600000);
    if (diffHours < 1) {
      const diffMins = Math.floor((due.getTime() - now.getTime()) / 60000);
      return `Due in ${diffMins} mins`;
    }

    return `Due ${due.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  }

  const overdueCount = loans.filter(loan => isOverdue(loan.due_at)).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onComplete} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <ArrowLeft className="w-6 h-6 dark:text-gray-300" />
        </button>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Return Equipment</h2>
      </div>

      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search student or item #..."
      />

      <FilterPills
        options={['All Borrowed', 'Overdue', "Today's"]}
        selected={statusFilter}
        onChange={setStatusFilter}
        counts={{ Overdue: overdueCount }}
      />

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Active Loans
        </h3>

        {filteredLoans.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">No active loans found</p>
          </div>
        ) : (
          filteredLoans.map(loan => {
            const overdue = isOverdue(loan.due_at);
            const cardBg = loan.equipment?.category === 'Basketball'
              ? 'from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-800/30'
              : loan.equipment?.category === 'Tennis'
                ? 'from-orange-100 to-yellow-50 dark:from-orange-900/30 dark:to-yellow-900/30'
                : loan.equipment?.category === 'Soccer'
                  ? 'from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700'
                  : 'from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30';

            return (
              <div
                key={loan.id}
                className={`bg-gradient-to-br ${cardBg} rounded-lg shadow-md overflow-hidden`}
              >
                <div className="relative">
                  {overdue && (
                    <div className="absolute top-3 left-3 z-10">
                      <StatusBadge status="OVERDUE" variant="overdue" size="sm" />
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4">
                    <div className="relative flex-shrink-0 w-full sm:w-auto">
                      <img
                        src={loan.equipment?.image_url}
                        alt={loan.equipment?.name}
                        className="w-full sm:w-32 h-40 sm:h-32 object-contain bg-white rounded-lg"
                      />
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        ID: {loan.equipment?.item_id}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 w-full">
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">
                        {loan.equipment?.name}
                      </h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1 mb-2">
                        <span className="font-medium">👤</span>
                        {loan.student?.full_name}
                      </p>
                      <p
                        className={`text-sm font-semibold ${overdue ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'
                          }`}
                      >
                        {formatDueTime(loan.due_at)}
                      </p>
                      <div className="mt-3 sm:hidden">
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleReturn(loan)}
                          className="w-full"
                        >
                          Return
                        </Button>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleReturn(loan)}
                      className="hidden sm:block"
                    >
                      Return
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Toast
        message={`${lastReturned?.equipment?.name} returned`}
        type="success"
        isOpen={showToast}
        onClose={() => setShowToast(false)}
        duration={4000}
        action={{
          label: 'Undo',
          onClick: handleUndo,
        }}
      />
    </div>
  );
}
