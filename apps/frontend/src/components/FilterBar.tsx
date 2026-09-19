import { cn } from '../utils/cn';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  options: FilterOption[];
  activeValue: string;
  onChange: (value: string) => void;
  className?: string;
}

export function FilterBar({ options, activeValue, onChange, className }: FilterBarProps) {
  return (
    <div className={cn("flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar w-full", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all shrink-0",
            activeValue === option.value
              ? "bg-brand-600 text-white shadow-xs"
              : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
