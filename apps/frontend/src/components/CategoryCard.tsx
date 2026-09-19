import { cn } from '../utils/cn';

interface CategoryCardProps {
  title: string;
  icon: string;
  onClick?: () => void;
  isActive?: boolean;
}

export function CategoryCard({ title, icon, onClick, isActive }: CategoryCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-2.5 p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 w-full hover:-translate-y-0.5 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
        isActive 
          ? "bg-brand-50/80 border-brand-300 text-brand-800 shadow-xs ring-1 ring-brand-400" 
          : "bg-white border-slate-200/90 text-slate-700 hover:border-slate-300 hover:bg-slate-50/60"
      )}
    >
      <div className={cn(
        "text-2xl sm:text-3xl p-2.5 rounded-xl transition-transform group-hover:scale-105",
        isActive ? "bg-white shadow-xs" : "bg-slate-50"
      )}>
        {icon}
      </div>
      <span className="font-semibold text-xs sm:text-sm text-center leading-tight line-clamp-2 min-h-[2.25rem] flex items-center justify-center">{title}</span>
    </button>
  );
}
