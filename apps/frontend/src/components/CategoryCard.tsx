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
        "flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all duration-200 w-full hover:-translate-y-1 hover:shadow-md",
        isActive 
          ? "bg-brand-50 border-brand-200 text-brand-700 shadow-sm" 
          : "bg-white border-slate-200 text-slate-700 hover:border-brand-200"
      )}
    >
      <div className={cn(
        "text-3xl p-3 rounded-xl",
        isActive ? "bg-white shadow-sm" : "bg-slate-50"
      )}>
        {icon}
      </div>
      <span className="font-semibold text-sm text-center">{title}</span>
    </button>
  );
}
