import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, ArrowRight, LogIn } from 'lucide-react';
import type { SpotSummary } from '../services/api';
import { SpotCard } from '../components/SpotCard';
import { useAuth } from '../context/AuthContext';

export function SavedSpots() {
  const [savedSpots, setSavedSpots] = useState<SpotSummary[]>([]);
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ffh_saved_spots');
      if (stored) {
        setSavedSpots(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (!isAuthenticated) {
    return (
      <div className="bg-slate-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-xl text-slate-900 mb-2">Sign in to save places</h3>
          <p className="text-slate-500 text-sm mb-8">
            Sign in to save and manage your favorite places. Access them anytime across all your devices.
          </p>
          <Link
            to="/signin"
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
          >
            <LogIn className="w-5 h-5" />
            <span>Sign In</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-brand-100 p-2.5 rounded-xl text-brand-700">
            <Bookmark className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Saved Food Spots</h1>
            <p className="text-slate-500 text-sm">Quick access to your bookmarked free food spots in Hyderabad</p>
          </div>
        </div>

        {savedSpots.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {savedSpots.map((spot) => (
              <SpotCard key={spot.id} spot={spot} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bookmark className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">No Saved Spots Yet</h3>
            <p className="text-slate-500 text-sm mb-6">
              When viewing a food spot, you can bookmark it for quick access later.
            </p>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              <span>Explore Food Spots</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
