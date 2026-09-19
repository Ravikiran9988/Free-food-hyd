import { cn } from '../utils/cn';

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, className, size = 'md' }: StatusBadgeProps) {
  const norm = status?.toLowerCase() || 'upcoming';

  if (norm === 'serving_now' || norm === 'active') {
    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs",
        size === 'sm' ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className
      )}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        Serving Now
      </span>
    );
  }

  if (norm === 'starting_soon') {
    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold bg-amber-50 text-amber-800 border border-amber-200 shadow-xs",
        size === 'sm' ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className
      )}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        Starting Soon
      </span>
    );
  }

  if (norm === 'upcoming') {
    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium bg-slate-100 text-slate-700 border border-slate-200",
        size === 'sm' ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className
      )}>
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
        Upcoming
      </span>
    );
  }

  if (norm === 'expired') {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium bg-slate-100/90 text-slate-500 border border-slate-200/80",
        size === 'sm' ? "px-2 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs",
        className
      )}>
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
        Past
      </span>
    );
  }

  if (norm === 'recurring_time_only') {
    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200 shadow-xs",
        size === 'sm' ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className
      )}>
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
        Daily Free Food
      </span>
    );
  }

  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200", className)}>
      {status}
    </span>
  );
}
