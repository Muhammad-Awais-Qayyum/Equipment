interface FilterPillsProps {
  options: string[];
  selected: string;
  onChange: (value: string) => void;
  counts?: Record<string, number>;
}

export function FilterPills({ options, selected, onChange, counts }: FilterPillsProps) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {options.map((option) => {
        const isSelected = selected === option;
        const count = counts?.[option];

        return (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
              isSelected
                ? 'bg-red-600 dark:bg-red-500 text-white shadow-md'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
            }`}
          >
            {option}
            {count !== undefined && count > 0 && (
              <span className={`ml-1 sm:ml-1.5 ${isSelected ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
