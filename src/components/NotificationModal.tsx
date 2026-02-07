import { useState } from 'react';
import { X, AlertTriangle, UserX, Calendar, TrendingUp } from 'lucide-react';
import { Modal } from './Modal';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { db, generateUUID } from '../lib/db';
import { Toast } from './Toast';

interface AtRiskStudent {
  id: string;
  student_id: string;
  full_name: string;
  year_group: string;
  house: string | null;
  avatar_url: string | null;
  trust_score: number;
  is_blacklisted: boolean;
  late_returns_count: number;
  late_returns_since_suspension: number;
  total_suspensions: number;
  warning_threshold: number;
  total_late_returns: number;
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: AtRiskStudent[];
  onStudentUpdated: () => void;
  onDismiss: (studentId: string) => void;
}

export function NotificationModal({ isOpen, onClose, students, onStudentUpdated, onDismiss }: NotificationModalProps) {
  const [showBlacklistForm, setShowBlacklistForm] = useState<string | null>(null);
  const [blacklistDuration, setBlacklistDuration] = useState('7');
  const [blacklistReason, setBlacklistReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [dismissing, setDismissing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  async function handleDismiss(student: AtRiskStudent) {
    setDismissing(student.id);
    try {
      // Store dismissal in localStorage
      const dismissedKey = `dismissed_${student.id}_${student.late_returns_since_suspension}`;
      localStorage.setItem(dismissedKey, 'true');

      setToast({ message: 'Notification dismissed', type: 'success' });
      onDismiss(student.id);
    } catch (error) {
      console.error('Error dismissing notification:', error);
      setToast({ message: 'Failed to dismiss notification', type: 'error' });
    } finally {
      setDismissing(null);
    }
  }

  async function handleBlacklist(studentId: string, studentName: string) {
    if (!blacklistReason.trim()) {
      setToast({ message: 'Please provide a reason', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + parseInt(blacklistDuration));
      const now = new Date().toISOString();

      await db.students.update(studentId, {
        is_blacklisted: true,
        blacklist_end_date: endDate.toISOString(),
        blacklist_reason: blacklistReason,
        updated_at: now,
        trust_score: Math.max(0, (await db.students.get(studentId))?.trust_score || 50 * 0.5),
      });

      await db.blacklistEntries.add({
        id: generateUUID(),
        student_id: studentId,
        blacklisted_by_user_id: null,
        start_date: now,
        end_date: endDate.toISOString(),
        reason: blacklistReason,
        is_active: true,
        created_at: now,
      });

      setToast({ message: `${studentName} has been suspended`, type: 'success' });
      setShowBlacklistForm(null);
      setBlacklistReason('');
      setBlacklistDuration('7');
      onStudentUpdated();
    } catch (error) {
      console.error('Error blacklisting student:', error);
      setToast({ message: 'Failed to suspend student', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  function getWarningLevel(student: AtRiskStudent): string {
    if (student.total_suspensions > 0) {
      return 'Suspension Eligible';
    }

    if (student.late_returns_since_suspension === 1) {
      return 'First Warning';
    } else if (student.late_returns_since_suspension === 2) {
      return 'Second Warning';
    } else if (student.late_returns_since_suspension === 3) {
      return 'Final Warning';
    } else {
      return 'Suspension Eligible';
    }
  }

  function getWarningColor(student: AtRiskStudent): string {
    if (student.total_suspensions > 0) {
      return 'bg-red-50 text-red-700 border-red-200';
    }

    if (student.late_returns_since_suspension === 1) {
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    } else if (student.late_returns_since_suspension === 2) {
      return 'bg-orange-50 text-orange-700 border-orange-200';
    } else if (student.late_returns_since_suspension === 3) {
      return 'bg-red-50 text-red-700 border-red-200';
    } else {
      return 'bg-red-50 text-red-700 border-red-200';
    }
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="md" title="">
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">At-Risk Students</h2>
              <p className="text-sm text-gray-600">
                {students.length} {students.length === 1 ? 'student has' : 'students have'} reached warning threshold
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800">
                <p className="font-semibold mb-1">Progressive Warning System</p>
                <p>1st offense → 2nd offense → Final Warning → Suspension. After any suspension, each late return triggers immediate suspension.</p>
              </div>
            </div>
          </div>

          {students.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500">No at-risk students at this time</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {students.map((student) => (
                <div key={student.id} className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Avatar
                        src={student.avatar_url}
                        name={student.full_name}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">{student.full_name}</h3>
                        <p className="text-sm text-gray-600">
                          {student.year_group} {student.house ? `• ${student.house}` : ''}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className={`text-xs font-semibold px-2 py-1 rounded border ${getWarningColor(student)}`}>
                            {getWarningLevel(student)}
                          </span>
                          <span className="text-xs text-red-600 font-semibold bg-red-50 px-2 py-1 rounded">
                            {student.late_returns_since_suspension} / {student.warning_threshold} Late Returns
                          </span>
                          <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {student.total_late_returns} Total
                          </span>
                        </div>
                        {student.total_suspensions > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Previously suspended {student.total_suspensions} {student.total_suspensions === 1 ? 'time' : 'times'}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDismiss(student)}
                      disabled={dismissing === student.id}
                      className="flex-shrink-0 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      title="Dismiss notification"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  {student.is_blacklisted ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-800 font-medium">Already Suspended</p>
                    </div>
                  ) : showBlacklistForm === student.id ? (
                    <div className="space-y-3 pt-3 border-t border-gray-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Suspension Duration
                        </label>
                        <select
                          value={blacklistDuration}
                          onChange={(e) => setBlacklistDuration(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
                          <option value="7">7 days</option>
                          <option value="14">14 days</option>
                          <option value="30">30 days</option>
                          <option value="90">90 days</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Reason
                        </label>
                        <textarea
                          value={blacklistReason}
                          onChange={(e) => setBlacklistReason(e.target.value)}
                          placeholder="Consistently late returns..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setShowBlacklistForm(null);
                            setBlacklistReason('');
                          }}
                          fullWidth
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleBlacklist(student.id, student.full_name)}
                          disabled={loading}
                          fullWidth
                        >
                          {loading ? 'Suspending...' : 'Confirm Suspension'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowBlacklistForm(student.id)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                    >
                      <UserX className="w-4 h-4" />
                      Suspend Student
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
