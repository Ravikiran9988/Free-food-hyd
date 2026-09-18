import { Link } from 'react-router-dom';
import { MapPin, Clock, Users, AlertTriangle, Navigation, CheckCircle2 } from 'lucide-react';
import type { SpotSummary } from '../services/api';
import { StatusBadge } from './StatusBadge';

interface SpotCardProps {
  spot: SpotSummary;
}

export function SpotCard({ spot }: SpotCardProps) {
  const areaNameStr = spot?.area_name || '';
  const displayName = spot?.landmark || spot?.name || areaNameStr.split(',')[0] || 'Unknown Location';
  const mapsUrl = spot?.google_maps_url || (spot?.latitude && spot?.longitude ? `https://www.google.com/maps?q=${spot.latitude},${spot.longitude}` : undefined);
  const confirmation = spot?.community_confirmation;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
      <div className="p-4 md:p-5 flex-grow flex flex-col gap-3">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold tracking-wider text-brand-700 uppercase bg-brand-50 px-2 py-0.5 rounded">
                {spot.category || 'Annadhanam'}
              </span>
              {spot.distance_km !== undefined && spot.distance_km !== null && (
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {spot.distance_km < 1 ? `${Math.round(spot.distance_km * 1000)}m` : `${spot.distance_km} km`}
                </span>
              )}
            </div>
            <h3 className="font-bold text-base sm:text-lg text-slate-900 line-clamp-1" title={displayName}>
              {displayName}
            </h3>
          </div>
          <StatusBadge status={spot.live_status || spot.status} />
        </div>

        <div className="text-sm text-slate-600 space-y-2 mt-1">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
            <span className="line-clamp-2 text-xs sm:text-sm text-slate-600">{spot.area_name}</span>
          </div>
          
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
            <Clock className="w-4 h-4 shrink-0 text-slate-400" />
            <span>
              {spot.is_recurring_or_time_only ? (
                <>Daily • {spot.start_time} - {spot.end_time}</>
              ) : (
                <>{spot.start_date ? `${spot.start_date} • ` : ''}{spot.start_time} - {spot.end_time}</>
              )}
            </span>
          </div>
        </div>

        {/* Real-time Community Confirmation Box */}
        <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs flex items-center gap-2">
          <CheckCircle2 className={`w-4 h-4 shrink-0 ${confirmation && confirmation.confirmed_count > 0 ? 'text-emerald-600' : 'text-slate-400'}`} />
          <span className={`line-clamp-1 ${confirmation && confirmation.confirmed_count > 0 ? 'font-semibold text-emerald-800' : 'text-slate-500'}`}>
            {confirmation?.confirmation_text || 'No recent updates'}
          </span>
        </div>

        <div className="mt-auto pt-3 flex items-center justify-between border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1" title="People interested">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>{spot.interested_count}</span>
            </div>
            {spot.report_count > 0 && (
              <div className="flex items-center gap-1 text-amber-600 font-medium" title="Reports from people">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{spot.report_count}</span>
              </div>
            )}
          </div>
          <div className="text-[10px] tracking-wider uppercase font-semibold text-slate-400 flex items-center gap-1">
            {spot.source_type === 'imported' ? (
              'Source Verified'
            ) : (
              <span className="text-amber-600 flex items-center gap-1">
                ⚠️ SOURCE NOT VERIFIED
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 divide-x divide-slate-200 border-t border-slate-200 bg-slate-50 text-xs font-semibold">
        <Link 
          to={`/spot/${spot.id}`}
          className="py-3 text-center text-slate-700 hover:bg-slate-100 hover:text-brand-600 transition-colors"
        >
          View Details
        </Link>
        {mapsUrl ? (
          <a 
            href={mapsUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="py-3 text-center text-brand-600 hover:bg-brand-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <Navigation className="w-3.5 h-3.5" />
            Directions
          </a>
        ) : (
          <span className="py-3 text-center text-slate-400 flex items-center justify-center gap-1.5 cursor-not-allowed">
            <Navigation className="w-3.5 h-3.5" />
            No GPS
          </span>
        )}
      </div>
    </div>
  );
}
