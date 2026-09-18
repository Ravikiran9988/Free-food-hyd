import { useState, useEffect } from 'react';
import { fetchTodaySections } from '../services/api';
import type { TodaySections } from '../services/api';
import { SpotCard } from '../components/SpotCard';
import { EmptyState } from '../components/EmptyState';
import { Calendar, Clock, Loader2, MapPin } from 'lucide-react';

export function Today() {
  const [sections, setSections] = useState<TodaySections | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await fetchTodaySections(userLocation || undefined);
        setSections(data);
      } catch (err) {
        console.error('Failed to load today sections:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [userLocation]);

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        (err) => console.warn('Location denied:', err)
      );
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-brand-900 to-slate-900 text-white p-8 rounded-3xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-brand-800/80 px-3 py-1 rounded-full text-xs font-semibold text-brand-200 mb-2 border border-brand-700/50">
              <Calendar className="w-3.5 h-3.5" />
              <span>Today's Meal Schedule</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold">Free Meals Today</h1>
            <p className="text-sm text-brand-100/80 mt-1 max-w-xl">
              Real-time daily food distributions, temple meals, and active Annadhanam spots across Hyderabad.
            </p>
          </div>

          <button
            onClick={requestLocation}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all backdrop-blur-md"
          >
            <MapPin className="w-4 h-4 text-brand-400" />
            <span>{userLocation ? 'Sorted by Proximity' : 'Sort by Distance'}</span>
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
            <p className="text-slate-500 font-medium">Checking live schedule...</p>
          </div>
        ) : sections ? (
          <div className="space-y-12">
            
            {/* 🟢 Serving Now */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    🟢 Serving Now ({sections.serving_now.length})
                  </h2>
                </div>
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                  Currently within scheduled serving hours
                </span>
              </div>

              {sections.serving_now.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {sections.serving_now.map((spot) => (
                    <SpotCard key={spot.id} spot={spot} />
                  ))}
                </div>
              ) : (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">
                  No food spots are currently serving at this exact hour. Check Starting Soon or Later Today.
                </div>
              )}
            </section>

            {/* 🟡 Starting Soon */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-amber-500"></span>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    🟡 Starting Soon ({sections.starting_soon.length})
                  </h2>
                </div>
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                  Starting within the next 90 minutes
                </span>
              </div>

              {sections.starting_soon.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {sections.starting_soon.map((spot) => (
                    <SpotCard key={spot.id} spot={spot} />
                  ))}
                </div>
              ) : (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">
                  No upcoming distributions scheduled in the immediate next 90 minutes.
                </div>
              )}
            </section>

            {/* 🕐 Later Today */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-5 h-5 text-slate-600" />
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    🕐 Later Today ({sections.later_today.length})
                  </h2>
                </div>
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                  Scheduled later in the day or daily afternoon/evening meals
                </span>
              </div>

              {sections.later_today.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {sections.later_today.slice(0, 16).map((spot) => (
                    <SpotCard key={spot.id} spot={spot} />
                  ))}
                </div>
              ) : (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">
                  No additional spots scheduled for today.
                </div>
              )}
            </section>

          </div>
        ) : (
          <EmptyState title="No distributions today" description="Check back tomorrow or explore all upcoming events." />
        )}

      </div>
    </div>
  );
}
