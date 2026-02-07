import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  borderLeft?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', borderLeft, onClick }: CardProps) {
  const borderClass = borderLeft ? `border-l-4 ${borderLeft}` : '';
  const clickableClass = onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : '';

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 ${borderClass} ${clickableClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
