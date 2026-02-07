import { Search, X } from 'lucide-react';
import { InputHTMLAttributes, useState } from 'react';

interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search...', ...props }: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div
      className={`flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-lg px-4 py-3 transition-all ${
        isFocused ? 'ring-2 ring-blue-500 bg-white dark:bg-gray-600' : ''
      }`}
    >
      <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        {...props}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
        >
          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      )}
    </div>
  );
}
