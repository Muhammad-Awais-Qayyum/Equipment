interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'overdue' | 'clear' | 'available' | 'borrowed' | 'reserved' | 'repair' | 'active' | 'lost' | 'damaged';
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, variant = 'default', size = 'md' }: StatusBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
  };

  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    overdue: 'bg-red-100 text-red-800 font-semibold',
    clear: 'bg-green-100 text-green-800 font-semibold',
    available: 'bg-blue-600 text-white font-bold',
    borrowed: 'bg-red-800 text-white font-bold',
    reserved: 'bg-orange-500 text-white font-bold',
    repair: 'bg-orange-500 text-white font-bold',
    active: 'bg-green-100 text-green-800 font-medium',
    lost: 'bg-gray-700 text-white font-bold',
    damaged: 'bg-amber-600 text-white font-bold',
  };

  return (
    <span className={`inline-block rounded-full ${sizeClasses[size]} ${variantClasses[variant]}`}>
      {status}
    </span>
  );
}
