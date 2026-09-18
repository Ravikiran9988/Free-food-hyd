import { useState, useEffect } from 'react';
import { fetchUpcomingGrouped } from '../services/api';
import type { UpcomingDateGroup } from '../services/api';
import { SpotCard } from '../components/SpotCard';
import { EmptyState } from '../components/EmptyState';
import { Calendar, Loader2, Sparkles } from 'lucide-react';

export function Upcoming() {
  const [groups, setGroups] = useState<UpcomingDateGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await fetchUpcomingGrouped(50);
        setGroups(data);
      } catch (err) {
        console.error('Failed to load upcoming grouped events:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-slate-900 to-brand-950 text-white p-8 rounded-3xl shadow-sm">
          <div className="inline-flex items-center gap-2 bg-brand-800/80 px-3 py-1 rounded-full text-xs font-semibold text-brand-200 mb-2 border border-brand-700/50">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Scheduled Future Events</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold">Upcoming Free Food Distributions</h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Calendar view of planned community meals, festival Annadhanams, and special food drives across Hyderabad.
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
            <p className="text-slate-500 font-medium">Loading upcoming calendar...</p>
          </div>
        ) : groups.length > 0 ? (
          <div className="space-y-12">
            {groups.map((group) => (
              <section key={group.date} className="space-y-5">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                  <div className="bg-brand-100 text-brand-800 p-2 rounded-xl">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{group.label}</h2>
                    <p className="text-xs text-slate-500">{group.spots.length} event(s) scheduled</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {group.spots.map((spot) => (
                    <SpotCard key={spot.id} spot={spot} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <EmptyState title="No scheduled upcoming events" description="Check back soon as organizers announce new Annadhanams." />
        )}

      </div>
    </div>
  );
}
