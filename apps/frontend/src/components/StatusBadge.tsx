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
        "inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300",
        size === 'sm' ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className
      )}>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        🟢 Serving Now
      </span>
    );
  }

  if (norm === 'starting_soon') {
    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300",
        size === 'sm' ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className
      )}>
        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
        🟡 Starting Soon
      </span>
    );
  }

  if (norm === 'upcoming') {
    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-300",
        size === 'sm' ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className
      )}>
        <span className="w-2 h-2 rounded-full bg-slate-400"></span>
        ⚪ Upcoming
      </span>
    );
  }

  if (norm === 'expired') {
    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold uppercase tracking-wider bg-slate-800 text-slate-200 border border-slate-900",
        size === 'sm' ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className
      )}>
        <span className="w-2 h-2 rounded-full bg-slate-500"></span>
        ⚫ Expired / Past
      </span>
    );
  }

  if (norm === 'recurring_time_only') {
    return (
      <span className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-200",
        size === 'sm' ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className
      )}>
        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
        Daily Free Food
      </span>
    );
  }

  return (
    <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200", className)}>
      {status}
    </span>
  );
}
