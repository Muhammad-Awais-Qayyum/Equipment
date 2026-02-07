import { useEffect, useState } from 'react';
import { Package, AlertTriangle, Clock, ArrowRight, X, Edit2, Check, Ban } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { StatusBadge } from '../../components/StatusBadge';
import { EquipmentAnalytics } from '../../components/EquipmentAnalytics';
import { Modal } from '../../components/Modal';
import { Avatar } from '../../components/Avatar';
import { Toast } from '../../components/Toast';
import { db, generateUUID } from '../../lib/db';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardStats {
  availableItems: number;
  currentlyOut: number;
  overdueLoans: any[];
  activeLoans: any[];
}

export function AdminDashboard() {
  const { profile, user, refreshProfile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    availableItems: 0,
    currentlyOut: 0,
    overdueLoans: [],
    activeLoans: [],
  });
  const [loading, setLoading] = useState(true);
  const [showAllLoans, setShowAllLoans] = useState(false);
  const [allActiveLoans, setAllActiveLoans] = useState<any[]>([]);
  const [showAvailableItems, setShowAvailableItems] = useState(false);
  const [availableEquipment, setAvailableEquipment] = useState<any[]>([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedLoanForStatus, setSelectedLoanForStatus] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [processingStatus, setProcessingStatus] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const [equipment, allLoans] = await Promise.all([
        db.equipment.toArray(),
        db.loans.toArray(),
      ]);

      const loans = allLoans.filter(loan => loan.returned_at === null);

      const available = equipment.filter(item => item.status === 'available').length;
      const borrowed = equipment.filter(item => item.status === 'borrowed').length;

      const loansWithDetails = await Promise.all(
        loans.map(async (loan) => {
          const [student, equipmentItem] = await Promise.all([
            db.students.get(loan.student_id),
            db.equipment.get(loan.equipment_id),
          ]);
          return {
            ...loan,
            student,
            equipment: equipmentItem,
          };
        })
      );

      // Sort by due_at
      loansWithDetails.sort((a, b) =>
        new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
      );

      const now = new Date();
      const overdue = loansWithDetails.filter(loan => new Date(loan.due_at) < now);
      const active = loansWithDetails.filter(loan => new Date(loan.due_at) >= now);

      setStats({
        availableItems: available,
        currentlyOut: borrowed,
        overdueLoans: overdue,
        activeLoans: active.slice(0, 5),
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadAllActiveLoans() {
    try {
      const allLoans = await db.loans.toArray();
      const loans = allLoans.filter(loan => loan.returned_at === null);

      const loansWithDetails = await Promise.all(
        loans.map(async (loan) => {
          const [student, equipmentItem] = await Promise.all([
            db.students.get(loan.student_id),
            db.equipment.get(loan.equipment_id),
          ]);
          return {
            ...loan,
            student,
            equipment: equipmentItem,
          };
        })
      );

      loansWithDetails.sort((a, b) =>
        new Date(b.borrowed_at).getTime() - new Date(a.borrowed_at).getTime()
      );

      setAllActiveLoans(loansWithDetails);
    } catch (error) {
      console.error('Error loading all active loans:', error);
    }
  }

  async function loadAvailableEquipment() {
    try {
      const equipment = await db.equipment
        .where('status')
        .equals('available')
        .toArray();

      equipment.sort((a, b) => a.name.localeCompare(b.name));

      setAvailableEquipment(equipment);
    } catch (error) {
      console.error('Error loading available equipment:', error);
    }
  }

  async function handleReturn(loanId: string, equipmentId: string) {
    try {
      const now = new Date().toISOString();

      await db.loans.update(loanId, {
        returned_at: now,
        status: 'returned',
        is_overdue: false,
      });

      await db.equipment.update(equipmentId, {
        status: 'available',
        updated_at: now,
      });

      const loan = await db.loans.get(loanId);
      if (loan) {
        const { updateStudentTrustScore } = await import('../../lib/db');
        await updateStudentTrustScore(loan.student_id);
      }

      loadDashboardData();
      if (showAllLoans) {
        loadAllActiveLoans();
      }
    } catch (error) {
      console.error('Error returning item:', error);
    }
  }

  function openStatusModal(loan: any) {
    setSelectedLoanForStatus(loan);
    setShowStatusModal(true);
  }

  async function handleMarkLostOrDamaged(status: 'lost' | 'damaged') {
    if (!selectedLoanForStatus) return;
    
    setProcessingStatus(true);
    
    try {
      const now = new Date().toISOString();
      const loan = selectedLoanForStatus;
      const equipmentName = loan.equipment?.name || 'Unknown equipment';
      const studentId = loan.student_id;
      
      // 1. Close the loan
      await db.loans.update(loan.id, {
        returned_at: now,
        status: 'returned',
        is_overdue: false,
      });
      
      // 2. Update equipment status to lost or damaged
      await db.equipment.update(loan.equipment_id, {
        status: status,
        condition_notes: `Marked as ${status} on ${new Date().toLocaleDateString()}`,
        updated_at: now,
      });
      
      // 3. Get student and apply automatic suspension (skip warnings)
      const student = await db.students.get(studentId);
      if (student) {
        // Set suspension end date (14 days for lost, 7 days for damaged)
        const suspensionDays = status === 'lost' ? 14 : 7;
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + suspensionDays);
        
        // Update student - set blacklisted and reduce trust score by 50%
        await db.students.update(studentId, {
          is_blacklisted: true,
          blacklist_end_date: endDate.toISOString(),
          blacklist_reason: `${status.charAt(0).toUpperCase() + status.slice(1)} equipment: ${equipmentName}`,
          trust_score: Math.max(0, student.trust_score * 0.5),
          updated_at: now,
        });
        
        // Create blacklist entry for tracking
        await db.blacklistEntries.add({
          id: generateUUID(),
          student_id: studentId,
          blacklisted_by_user_id: user?.id || null,
          start_date: now,
          end_date: endDate.toISOString(),
          reason: `${status.charAt(0).toUpperCase() + status.slice(1)} equipment: ${equipmentName}`,
          is_active: true,
          created_at: now,
        });
      }
      
      setShowStatusModal(false);
      setSelectedLoanForStatus(null);
      setToast({ 
        message: `Equipment marked as ${status}. Student has been suspended for ${status === 'lost' ? '14' : '7'} days.`, 
        type: 'success' 
      });
      
      loadDashboardData();
      if (showAllLoans) {
        loadAllActiveLoans();
      }
    } catch (error) {
      console.error('Error marking item as lost/damaged:', error);
      setToast({ message: 'Failed to update equipment status', type: 'error' });
    } finally {
      setProcessingStatus(false);
    }
  }

  function handleShowAllLoans() {
    loadAllActiveLoans();
    setShowAllLoans(true);
  }

  function handleShowAvailableItems() {
    loadAvailableEquipment();
    setShowAvailableItems(true);
  }

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  function handleEditName() {
    setEditedName(profile?.full_name || '');
    setIsEditingName(true);
  }

  async function handleSaveName() {
    if (!user?.id || !editedName.trim()) return;

    try {
      await db.users.update(user.id, {
        full_name: editedName.trim(),
        updated_at: new Date().toISOString(),
      });

      await refreshProfile();
      setIsEditingName(false);
    } catch (error) {
      console.error('Error updating name:', error);
    }
  }

  function getTimeAgo(date: string) {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  }

  function getOverdueDuration(dueDate: string) {
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = now.getTime() - due.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    return 'Just overdue';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <div className="flex items-center gap-2 sm:gap-3 group">
          {isEditingName ? (
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{getGreeting()},</h2>
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white border-b-2 border-blue-500 focus:outline-none bg-transparent px-1 sm:px-2 max-w-[200px] sm:max-w-none"
                placeholder="Your name"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
              />
              <button
                onClick={handleSaveName}
                className="p-1 sm:p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                title="Save name"
              >
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
              </button>
              <button
                onClick={() => setIsEditingName(false)}
                className="p-1 sm:p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Cancel"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {getGreeting()}, {profile?.full_name || 'Admin'}
              </h2>
              <button
                onClick={handleEditName}
                className="p-1 sm:p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors opacity-0 hover:opacity-100 group-hover:opacity-100"
                title="Edit name"
              >
                <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </>
          )}
        </div>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">Here's what's happening with your equipment today.</p>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
        <button onClick={handleShowAvailableItems} className="w-full text-left">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border border-blue-200 dark:border-blue-700 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-blue-700 dark:text-gray-300 font-medium">Available Items</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-white">{stats.availableItems}</p>
              </div>
            </div>
          </Card>
        </button>

        <button onClick={handleShowAllLoans} className="w-full text-left">
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 border border-orange-200 dark:border-orange-700 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-orange-700 dark:text-gray-300 font-medium">Currently Out</p>
                <p className="text-2xl sm:text-3xl font-bold text-orange-900 dark:text-white">{stats.currentlyOut}</p>
              </div>
            </div>
          </Card>
        </button>
      </div>

      {stats.overdueLoans.length > 0 && (
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">Action Required</h3>
          <div className="space-y-2 sm:space-y-3">
            {stats.overdueLoans.map((loan) => (
              <Card key={loan.id} borderLeft="border-red-500">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">{loan.equipment?.name}</p>
                        <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium">
                          Overdue by {getOverdueDuration(loan.due_at)}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-0.5 sm:mt-1 truncate">
                          Borrowed by {loan.student?.full_name || 'Unknown'}
                        </p>
                      </div>
                      <div className="flex gap-1.5 sm:gap-2 w-full sm:w-auto">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openStatusModal(loan)}
                          className="flex-1 sm:flex-none text-xs sm:text-sm"
                        >
                          <Ban className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          <span className="hidden xs:inline">Status</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleReturn(loan.id, loan.equipment_id)}
                          className="flex-1 sm:flex-none text-xs sm:text-sm"
                        >
                          Return
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Active Loans</h3>
          <button className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
            <span className="hidden xs:inline">View All</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
        <div className="space-y-2 sm:space-y-3">
          {stats.activeLoans.length === 0 ? (
            <Card>
              <p className="text-center text-sm sm:text-base text-gray-500 dark:text-gray-400 py-3 sm:py-4">No active loans at the moment</p>
            </Card>
          ) : (
            stats.activeLoans.map((loan) => (
              <Card key={loan.id} className="hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">{loan.equipment?.name}</p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                        {loan.student?.full_name} • {getTimeAgo(loan.borrowed_at)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status="Active" variant="active" size="sm" />
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <EquipmentAnalytics />

      <Modal
        isOpen={showAllLoans}
        onClose={() => setShowAllLoans(false)}
        size="lg"
        title="All Borrowed Items"
      >
        <div className="space-y-3">
          {allActiveLoans.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No active loans at the moment</p>
            </div>
          ) : (
            allActiveLoans.map((loan) => {
              const isOverdue = new Date(loan.due_at) < new Date();
              return (
                <Card key={loan.id} className={isOverdue ? 'border-red-300 dark:border-red-700' : ''}>
                  <div className="flex items-start gap-3">
                    <Avatar
                      src={loan.student?.avatar_url}
                      name={loan.student?.full_name || 'Unknown'}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white">{loan.equipment?.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                            {loan.equipment?.category} • {loan.equipment?.item_id}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              <span className="font-medium">{loan.student?.full_name}</span>
                              {loan.student?.year_group && (
                                <span className="text-gray-500 dark:text-gray-400"> • {loan.student.year_group}</span>
                              )}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Borrowed {getTimeAgo(loan.borrowed_at)}
                            {isOverdue && (
                              <span className="text-red-600 dark:text-red-400 font-semibold ml-2">
                                • Overdue by {getOverdueDuration(loan.due_at)}
                              </span>
                            )}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant={isOverdue ? 'danger' : 'primary'}
                          onClick={() => handleReturn(loan.id, loan.equipment_id)}
                          className="w-full sm:w-auto"
                        >
                          Return
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showAvailableItems}
        onClose={() => setShowAvailableItems(false)}
        size="lg"
        title="Available Equipment"
      >
        <div className="space-y-3">
          {availableEquipment.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No available equipment at the moment</p>
            </div>
          ) : (
            availableEquipment.map((equipment) => (
              <Card key={equipment.id}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white">{equipment.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                      {equipment.category} • {equipment.item_id}
                    </p>
                    {equipment.condition && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Condition: {equipment.condition}
                      </p>
                    )}
                  </div>
                  <StatusBadge status="Available" variant="available" size="sm" />
                </div>
              </Card>
            ))
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setSelectedLoanForStatus(null);
        }}
        size="md"
        title="Mark Equipment Status"
      >
        {selectedLoanForStatus && (
          <div className="space-y-4">
            {/* Equipment & Student - Single Row */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              {/* Equipment Image */}
              <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-white dark:bg-gray-700">
                {selectedLoanForStatus.equipment?.image_url ? (
                  <img 
                    src={selectedLoanForStatus.equipment.image_url} 
                    alt={selectedLoanForStatus.equipment?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
              
              {/* Equipment Details */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                  {selectedLoanForStatus.equipment?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedLoanForStatus.equipment?.item_id}
                </p>
              </div>

              {/* Divider */}
              <div className="w-px h-10 bg-gray-300 dark:bg-gray-600"></div>
              
              {/* Student Info */}
              <div className="flex items-center gap-2">
                <Avatar
                  src={selectedLoanForStatus.student?.avatar_url}
                  name={selectedLoanForStatus.student?.full_name}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {selectedLoanForStatus.student?.full_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedLoanForStatus.student?.class_name || selectedLoanForStatus.student?.year_group}
                  </p>
                </div>
              </div>
            </div>

            {/* Warning Banner - More Compact */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-r-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Warning</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                    This will remove equipment from inventory, suspend the student, and reduce their trust score by 50%.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons - Side by Side */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleMarkLostOrDamaged('lost')}
                disabled={processingStatus}
                className="p-4 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Ban className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm sm:text-base">Lost</p>
                    <p className="text-xs text-red-100">14 days</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleMarkLostOrDamaged('damaged')}
                disabled={processingStatus}
                className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm sm:text-base">Damaged</p>
                    <p className="text-xs text-orange-100">7 days</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Cancel Button */}
            <button
              onClick={() => {
                setShowStatusModal(false);
                setSelectedLoanForStatus(null);
              }}
              disabled={processingStatus}
              className="w-full py-3 text-gray-600 dark:text-gray-400 font-medium hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </Modal>

      <Toast
        message={toast?.message || ''}
        type={toast?.type}
        isOpen={!!toast}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
