import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MapComponent } from '../components/MapComponent';
import { SpotCard } from '../components/SpotCard';
import { SearchBar } from '../components/SearchBar';
import { FilterBar } from '../components/FilterBar';
import { BottomSheet } from '../components/BottomSheet';
import { EmptyState } from '../components/EmptyState';
import { Footer } from '../components/Footer';
import { useSpots } from '../hooks/useSpots';
import { 
  Map as MapIcon, 
  List, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Calendar, 
  Clock, 
  ArrowUpDown,
  Compass,
  Filter
} from 'lucide-react';

export function Explore() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'all';
  const initialStatus = searchParams.get('status') || (searchParams.get('filter') === 'near_me' ? 'near_me' : 'all');
  const initialSort = searchParams.get('sort') || '';

  const [viewMode, setViewMode] = useState<'list' | 'map' | 'split'>('split');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>(initialSort);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'locating' | 'granted' | 'denied'>('idle');

  // Debounce search timer
  const [searchInput, setSearchInput] = useState(initialSearch);
  const debounceTimerRef = useRef<any>(null);

  const { 
    spots, 
    mapPoints,
    total,
    page,
    pages,
    setPage,
    setSearch, 
    category, 
    setCategory,
    categories,
    isLoading,
    error,
    userLocation,
    requestLocation
  } = useSpots({ 
    initialSearch, 
    initialCategory, 
    initialStatus,
    initialPage: 1,
    limit: 24
  });

  // Handle Debounced Search
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 350);
  };

  // Location handling
  const handleNearMeClick = () => {
    setLocationStatus('locating');
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        setLocationStatus('granted');
        setSortBy('nearest');
        requestLocation();
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setLocationStatus('denied');
        alert('Location access was denied. You can still search for your area manually (e.g. Ameerpet, Secunderabad).');
      }
    );
  };

  // Responsive view mode effect
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setViewMode(prev => prev === 'split' ? 'list' : prev);
      } else {
        setViewMode('split');
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll card into view when selected on map
  useEffect(() => {
    if (selectedSpotId && window.innerWidth >= 1024) {
      const el = document.getElementById(`spot-card-${selectedSpotId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedSpotId]);

  const categoryIcons: Record<string, string> = {
    'Annadhanam': '🍛',
    'Temple Meals': '🛕',
    'Community Meals': '🤝',
    'Daily Free Food': '🍱',
    'Free Meal Distribution': '🥗',
    'Special Events': '🎉',
    'Unverified Places': '⚠️',
  };

  const filterOptions = [
    { label: 'All Categories', value: 'all' },
    ...categories.map(c => ({ 
      label: `${categoryIcons[c.name] || '🍲'} ${c.name} (${c.count})`, 
      value: c.name 
    }))
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      
      {/* Top Search & Filter Bar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-3 sm:p-4 shrink-0 shadow-[0_4px_24px_-12px_rgba(0,0,0,0.1)] sticky top-0 z-20 space-y-3">
        <div className="max-w-7xl mx-auto flex flex-col gap-3">
          
          <div className="flex items-center gap-3">
            <div className="flex-grow">
              <SearchBar 
                value={searchInput} 
                onChange={handleSearchChange} 
                placeholder="Search area (e.g. Ameerpet, Kukatpally, Charminar, Temple)..." 
                onGeoLocation={handleNearMeClick}
              />
            </div>
            
            {/* Mobile View Toggle */}
            <div className="lg:hidden flex bg-slate-100 p-1 rounded-2xl shrink-0 border border-slate-200">
              <button 
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white shadow-xs text-brand-700' : 'text-slate-500'}`}
                title="List View"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">List</span>
              </button>
              <button 
                onClick={() => setViewMode('map')}
                className={`px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all ${viewMode === 'map' ? 'bg-white shadow-xs text-brand-700' : 'text-slate-500'}`}
                title="Map View"
              >
                <MapIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Map</span>
              </button>
            </div>
          </div>
          
          {/* Primary Action Pills - Desktop */}
          <div className="hidden md:flex flex-row items-center justify-between gap-3 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar w-auto">
              <button
                onClick={handleNearMeClick}
                disabled={locationStatus === 'locating'}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                  sortBy === 'nearest' || userLocation
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                {locationStatus === 'locating' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <MapPin className="w-3.5 h-3.5" />
                )}
                <span>{locationStatus === 'locating' ? 'Locating...' : 'Near Me'}</span>
              </button>

              <button
                onClick={() => navigate('/today')}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 hover:border-slate-300 text-slate-700 flex items-center gap-1.5 transition-all shrink-0"
              >
                <Calendar className="w-3.5 h-3.5 text-brand-600" />
                <span>Today</span>
              </button>

              <button
                onClick={() => navigate('/upcoming')}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 hover:border-slate-300 text-slate-700 flex items-center gap-1.5 transition-all shrink-0"
              >
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Upcoming</span>
              </button>

              <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block"></div>

              {/* Category Pills */}
              <FilterBar 
                options={filterOptions} 
                activeValue={category} 
                onChange={(c) => {
                  setCategory(c);
                  setPage(1);
                }} 
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 outline-none shadow-2xs focus:border-brand-500"
              >
                <option value="">Default (Serving First)</option>
                <option value="nearest">📍 Nearest First</option>
                <option value="starting_soon">⏰ Starting Soon</option>
                <option value="recently_confirmed">👍 Recently Confirmed</option>
              </select>
            </div>
          </div>

          {/* Mobile Filter & Sort Buttons */}
          <div className="flex md:hidden items-center gap-3 pt-3 border-t border-slate-100">
            <button 
              onClick={() => setIsFiltersOpen(true)}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Filter className="w-4 h-4" /> Filters
              {(category !== 'all' || initialStatus !== 'all') && (
                <span className="w-2 h-2 rounded-full bg-brand-500"></span>
              )}
            </button>
            <button 
              onClick={() => setIsSortOpen(true)}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <ArrowUpDown className="w-4 h-4" /> Sort
            </button>
          </div>

          <BottomSheet isOpen={isFiltersOpen} onClose={() => setIsFiltersOpen(false)} title="Filters">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-3">Quick Actions</h4>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => { handleNearMeClick(); setIsFiltersOpen(false); }}
                    className="w-full px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-between bg-slate-50 border border-slate-200 text-slate-700"
                  >
                    <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Near Me</span>
                    {locationStatus === 'locating' && <Loader2 className="w-4 h-4 animate-spin text-brand-600" />}
                  </button>
                  <button
                    onClick={() => { navigate('/today'); setIsFiltersOpen(false); }}
                    className="w-full px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-700"
                  >
                    <Calendar className="w-4 h-4 text-brand-600" /> Today
                  </button>
                  <button
                    onClick={() => { navigate('/upcoming'); setIsFiltersOpen(false); }}
                    className="w-full px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-700"
                  >
                    <Clock className="w-4 h-4 text-amber-600" /> Upcoming
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-3">Categories</h4>
                <div className="flex flex-col gap-2">
                  {filterOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setCategory(opt.value);
                        setPage(1);
                        setIsFiltersOpen(false);
                      }}
                      className={`w-full px-4 py-3 rounded-xl text-sm font-bold text-left transition-all ${
                        category === opt.value 
                          ? 'bg-brand-600 text-white shadow-sm' 
                          : 'bg-slate-50 border border-slate-200 text-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </BottomSheet>

          <BottomSheet isOpen={isSortOpen} onClose={() => setIsSortOpen(false)} title="Sort By">
            <div className="flex flex-col gap-2">
              {[
                { value: '', label: 'Default (Serving First)' },
                { value: 'nearest', label: '📍 Nearest First' },
                { value: 'starting_soon', label: '⏰ Starting Soon' },
                { value: 'recently_confirmed', label: '👍 Recently Confirmed' }
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setSortBy(opt.value);
                    setPage(1);
                    setIsSortOpen(false);
                  }}
                  className={`w-full px-4 py-3 rounded-xl text-sm font-bold text-left transition-all ${
                    sortBy === opt.value 
                      ? 'bg-brand-600 text-white shadow-sm' 
                      : 'bg-slate-50 border border-slate-200 text-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </BottomSheet>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col lg:flex-row gap-6 flex-1">
        
        {/* List View */}
        <div className={`
          flex-col w-full lg:w-[460px] xl:w-[520px] shrink-0
          ${(viewMode === 'list' || viewMode === 'split') ? 'flex' : 'hidden'}
        `}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
                  {isLoading 
                    ? 'Loading food spots...' 
                    : error 
                      ? 'Error loading spots'
                      : total > 0 
                        ? `${total.toLocaleString()} Food Spots Found` 
                        : 'No Food Spots'}
                </h2>
                {userLocation && (
                  <p className="text-xs text-brand-600 font-semibold flex items-center gap-1 mt-0.5">
                    <Compass className="w-3.5 h-3.5" />
                    Distances calculated from your live coordinates
                  </p>
                )}
              </div>
            </div>

            {error ? (
              <EmptyState 
                title="Couldn't load food spots" 
                description="Please try again."
              >
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-xl font-bold text-sm hover:bg-brand-700 shadow-xs"
                >
                  Try Again
                </button>
              </EmptyState>
            ) : isLoading ? (
              <div className="flex flex-col justify-center items-center py-24 gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
                <span className="text-sm font-medium">Searching verified listings...</span>
              </div>
            ) : spots.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-5">
                  {spots.map((spot) => (
                    <div 
                      key={spot.id}
                      id={`spot-card-${spot.id}`}
                      onClick={() => {
                        setSelectedSpotId(spot.id);
                        if (window.innerWidth < 1024) setViewMode('map');
                      }}
                      className={`cursor-pointer transition-all rounded-2xl ${
                        selectedSpotId === spot.id ? 'ring-2 ring-brand-500 shadow-md' : ''
                      }`}
                    >
                      <SpotCard spot={spot} />
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {pages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-200 pt-4 mt-6">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed bg-white hover:bg-slate-50 shadow-sm"
                    >
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </button>
                    <span className="text-xs text-slate-500 font-medium">
                      Page {page} of {pages}
                    </span>
                    <button
                      onClick={() => setPage(Math.min(pages, page + 1))}
                      disabled={page === pages}
                      className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed bg-white hover:bg-slate-50 shadow-sm"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <EmptyState 
                title="No food spots found" 
                description="Try another area or remove some filters."
              >
                <button 
                  onClick={() => {
                    setSearch('');
                    setSearchInput('');
                    setCategory('all');
                  }}
                  className="mt-4 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold text-sm hover:bg-slate-200 border border-slate-200"
                >
                  Clear Filters
                </button>
              </EmptyState>
            )}
          </div>
        </div>

        {/* Map View */}
        <div className={`
          w-full lg:flex-1 relative
          ${(viewMode === 'map' || viewMode === 'split') ? 'block' : 'hidden'}
        `}>
          <div className="lg:sticky lg:top-28 h-[calc(100vh-16rem)] lg:h-[calc(100vh-8rem)] min-h-[400px] max-h-[800px] rounded-2xl overflow-hidden shadow-sm border border-slate-200 z-0">
            <MapComponent 
              spots={mapPoints as any} 
              className="h-full w-full z-0" 
              selectedSpotId={selectedSpotId}
              onSelectSpot={(id) => {
                setSelectedSpotId(id);
                if (window.innerWidth < 1024) setViewMode('list');
              }}
              autoFitBounds={!!searchInput || !!userLocation || initialStatus !== 'all'}
            />
          </div>
        </div>
      </div>
      
      {/* Footer is now reachable via scrolling */}
      <Footer />
    </div>
  );
}
