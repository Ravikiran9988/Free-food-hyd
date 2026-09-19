import { Link } from 'react-router-dom';
import { MapPin, Clock, Users, AlertTriangle, Navigation, CheckCircle2, ArrowRight } from 'lucide-react';
import type { SpotSummary } from '../services/api';
import { StatusBadge } from './StatusBadge';

interface SpotCardProps {
  spot: SpotSummary;
}

export function SpotCard({ spot }: SpotCardProps) {
  const areaNameStr = spot?.area_name || '';
  const displayName = spot?.landmark || spot?.name || areaNameStr.split(',')[0] || 'Food Spot';
  const mapsUrl = spot?.google_maps_url || (spot?.latitude && spot?.longitude ? `https://www.google.com/maps?q=${spot.latitude},${spot.longitude}` : undefined);
  const confirmation = spot?.community_confirmation;

  // Format time display cleanly
  const timeDisplay = spot.is_recurring_or_time_only
    ? `Daily • ${spot.start_time} – ${spot.end_time}`
    : `${spot.start_date ? `${spot.start_date} • ` : 'Today • '}${spot.start_time} – ${spot.end_time}`;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between h-full p-4 sm:p-5">
      <div>
        {/* Top Meta Row: Category & Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span className="text-[11px] font-semibold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-100 uppercase tracking-wider truncate max-w-[140px]">
              {spot.category || 'Annadhanam'}
            </span>
            {spot.distance_km !== undefined && spot.distance_km !== null && (
              <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                {spot.distance_km < 1 ? `${Math.round(spot.distance_km * 1000)}m` : `${spot.distance_km} km`}
              </span>
            )}
          </div>
          <div className="shrink-0">
            <StatusBadge status={spot.live_status || spot.status} size="sm" />
          </div>
        </div>

        {/* Title: 2 lines readable, not aggressively clipped */}
        <Link to={`/spot/${spot.id}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg">
          <h3 
            className="font-bold text-base text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-2 leading-snug mb-2" 
            title={displayName}
          >
            {displayName}
          </h3>
        </Link>

        {/* Location & Landmark */}
        <div className="flex items-start gap-1.5 text-xs text-slate-500 leading-relaxed mb-2">
          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
          <span className="line-clamp-2" title={spot.area_name}>{spot.area_name}</span>
        </div>

        {/* Schedule & Timing */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-3">
          <Clock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          <span className="truncate">{timeDisplay}</span>
        </div>

        {/* Real-time Community Confirmation Badge (Compact) */}
        {confirmation && confirmation.confirmed_count > 0 ? (
          <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 text-[11px] font-medium text-emerald-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
            <span className="truncate">{confirmation.confirmation_text}</span>
          </div>
        ) : null}
      </div>

      {/* Footer Section: Social proof + Primary CTA */}
      <div className="mt-2 pt-3 border-t border-slate-100 flex flex-col gap-2.5">
        {/* Social Proof Row */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-medium" title={`${spot.interested_count} people interested`}>
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>{spot.interested_count} interested</span>
            </span>
            {spot.report_count > 0 && (
              <span className="flex items-center gap-1 text-amber-600 font-medium" title={`${spot.report_count} reports`}>
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{spot.report_count}</span>
              </span>
            )}
          </div>
          <span className="text-[10px] uppercase font-semibold text-slate-400">
            {spot.source_type === 'imported' ? 'Source Verified' : 'Community'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          {mapsUrl ? (
            <a 
              href={mapsUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex-1 py-2.5 px-3 rounded-xl font-semibold text-xs sm:text-sm bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center gap-1.5 shadow-xs hover:shadow transition-all"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Directions</span>
            </a>
          ) : (
            <span className="flex-1 py-2.5 px-3 rounded-xl font-semibold text-xs text-center text-slate-400 bg-slate-100 flex items-center justify-center gap-1.5 cursor-not-allowed">
              <Navigation className="w-3.5 h-3.5" />
              <span>No GPS</span>
            </span>
          )}

          <Link 
            to={`/spot/${spot.id}`}
            className="py-2.5 px-3 rounded-xl font-semibold text-xs sm:text-sm text-slate-700 hover:text-brand-600 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1 border border-slate-200"
          >
            <span>Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
