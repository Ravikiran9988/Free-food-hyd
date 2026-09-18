import { Search, MapPin, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onGeoLocation?: () => void;
}

export function SearchBar({ value, onChange, placeholder = "Search area, landmark or place...", onGeoLocation }: SearchBarProps) {
  return (
    <div className="relative w-full max-w-2xl mx-auto flex items-center shadow-lg shadow-slate-200/50 rounded-2xl overflow-hidden bg-white border border-slate-200 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/20 transition-all">
      <div className="pl-3 md:pl-4 pr-2 text-slate-400">
        <Search className="w-4 h-4 md:w-5 md:h-5" />
      </div>
      <input
        type="text"
        className="w-full py-3 md:py-4 px-2 outline-none text-slate-700 bg-transparent placeholder:text-slate-400 text-sm md:text-base truncate"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="p-1 md:p-2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      )}
      {onGeoLocation && (
        <button 
          type="button"
          onClick={onGeoLocation}
          className="mr-1 md:mr-2 p-2 rounded-xl text-brand-600 hover:bg-brand-50 transition-colors flex items-center gap-1 md:gap-2 font-medium text-xs md:text-sm shrink-0"
          title="Use my current location"
        >
          <MapPin className="w-4 h-4 md:w-5 md:h-5" />
          <span className="hidden sm:inline pr-1 md:pr-2">Near Me</span>
        </button>
      )}
    </div>
  );
}
