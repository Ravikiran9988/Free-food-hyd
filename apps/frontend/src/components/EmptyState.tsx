import { SearchX } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

export function EmptyState({ 
  title = "No spots found", 
  description = "We couldn't find any free food spots matching your criteria. Try adjusting your filters or search.",
  children
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
      <div className="bg-slate-100 p-3.5 rounded-full mb-3 text-slate-400">
        <SearchX className="w-7 h-7" />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-500 max-w-sm leading-relaxed">{description}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
