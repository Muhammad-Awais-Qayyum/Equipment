interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  statusColor?: 'green' | 'red' | 'gray';
}

export function Avatar({ src, name, size = 'md', showStatus = false, statusColor = 'green' }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl',
  };

  const statusSize = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5',
  };

  const statusColorClasses = {
    green: 'bg-green-500',
    red: 'bg-red-500',
    gray: 'bg-gray-400',
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative inline-block">
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover border-2 border-gray-200`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold border-2 border-gray-200`}
        >
          {getInitials(name)}
        </div>
      )}
      {showStatus && (
        <div
          className={`absolute bottom-0 right-0 ${statusSize[size]} ${statusColorClasses[statusColor]} rounded-full border-2 border-white`}
        />
      )}
    </div>
  );
}
