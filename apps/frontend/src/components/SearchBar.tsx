import { Search, MapPin, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onGeoLocation?: () => void;
}

export function SearchBar({ value, onChange, placeholder = "Search area, landmark or place...", onGeoLocation }: SearchBarProps) {
  return (
    <div className="relative w-full max-w-2xl mx-auto flex items-center bg-white rounded-2xl border border-slate-200/90 shadow-md shadow-slate-100/80 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/15 transition-all">
      <div className="pl-4 pr-1.5 text-slate-400 shrink-0">
        <Search className="w-5 h-5" />
      </div>
      <input
        type="text"
        className="w-full py-3.5 md:py-4 px-2.5 outline-none text-slate-800 bg-transparent placeholder:text-slate-400 text-sm md:text-base font-normal"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search food spots"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="p-2 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
          aria-label="Clear search text"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      {onGeoLocation && (
        <button 
          type="button"
          onClick={onGeoLocation}
          className="mr-2 px-3 py-2 rounded-xl text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200/60 transition-colors flex items-center gap-1.5 font-semibold text-xs md:text-sm shrink-0 shadow-2xs"
          title="Use my current location"
        >
          <MapPin className="w-4 h-4 text-brand-600" />
          <span className="hidden sm:inline">Near Me</span>
        </button>
      )}
    </div>
  );
}
