import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SearchBar } from '../components/SearchBar';
import { CategoryCard } from '../components/CategoryCard';
import { SpotCard } from '../components/SpotCard';
import { fetchEventSection, fetchCategories, fetchSpots } from '../services/api';
import type { CategoryItem, SpotSummary } from '../services/api';
import { MapPin, Calendar, Clock, HandHeart, Loader2, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

export function Home() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState('');
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [activeSpots, setActiveSpots] = useState<SpotSummary[]>([]);
  const [upcomingSpots, setUpcomingSpots] = useState<SpotSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New states for category selection
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categorySpots, setCategorySpots] = useState<SpotSummary[]>([]);
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  const categorySectionRef = useRef<HTMLElement>(null);

  const viewAllCategory = searchParams.get('view_all_category');
  const viewAllStatus = searchParams.get('view_all_status');
  const isViewingFullList = !!viewAllCategory || !!viewAllStatus;

  // States for the full list view
  const [fullListSpots, setFullListSpots] = useState<SpotSummary[]>([]);
  const [fullListLoading, setFullListLoading] = useState(false);
  const [fullListPage, setFullListPage] = useState(1);
  const [fullListPages, setFullListPages] = useState(1);
  const [fullListTotal, setFullListTotal] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const [cats, active, upcoming] = await Promise.all([
          fetchCategories(),
          fetchEventSection('serving-now', 8),
          fetchEventSection('starting-soon', 8),
        ]);
        setCategories(cats);
        setActiveSpots(active);
        setUpcomingSpots(upcoming);
      } catch (err) {
        console.error('Failed to load home page data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const categoryIcons: Record<string, string> = {
    'Annadhanam': '🍛',
    'Temple Meals': '🛕',
    'Community Meals': '🤝',
    'Daily Free Food': '🍱',
    'Free Meal Distribution': '🥗',
    'Special Events': '🎉',
    'Unverified Places': '⚠️',
  };

  useEffect(() => {
    if (isViewingFullList) {
      async function loadFullList() {
        setFullListLoading(true);
        try {
          const res = await fetchSpots({
            category: viewAllCategory || undefined,
            status: viewAllStatus || undefined,
            page: fullListPage,
            limit: 12
          });
          setFullListSpots(res.items);
          setFullListPages(res.pages);
          setFullListTotal(res.total);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
          console.error('Failed to load full list spots:', err);
        } finally {
          setFullListLoading(false);
        }
      }
      loadFullList();
    }
  }, [isViewingFullList, viewAllCategory, viewAllStatus, fullListPage]);

  const handleSearch = (value: string) => {
    setSearchValue(value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchValue)}`);
    }
  };

  const handleCategoryClick = async (category: string) => {
    setSelectedCategory(category);
    setIsCategoryLoading(true);
    try {
      const res = await fetchSpots({ category, limit: 8 });
      setCategorySpots(res.items);
      setTimeout(() => {
        categorySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      console.error('Failed to fetch category spots:', err);
    } finally {
      setIsCategoryLoading(false);
    }
  };

  const clearFullView = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('view_all_category');
    newParams.delete('view_all_status');
    setSearchParams(newParams);
    setFullListPage(1);
  };

  if (isViewingFullList) {
    let title = '';
    let icon = '';
    if (viewAllCategory) {
      title = viewAllCategory === 'Unverified Places' ? 'Unverified Places' : `${viewAllCategory} in Hyderabad`;
      icon = categoryIcons[viewAllCategory] || '🍛';
    } else if (viewAllStatus === 'active') {
      title = 'Serving Now & Daily';
      icon = '🟢';
    } else if (viewAllStatus === 'upcoming') {
      title = 'Starting Soon / Upcoming';
      icon = '🟡';
    }

    return (
      <div className="flex flex-col gap-6 pb-16 pt-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full min-h-screen">
        <div className="flex items-center gap-4 mb-2">
          <button 
            onClick={clearFullView} 
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 font-medium text-sm transition-colors py-1.5 px-2.5 rounded-lg hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
          <div>
             <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
               <span>{icon}</span> {title}
             </h1>
             <p className="text-xs md:text-sm text-slate-500 mt-1">{fullListTotal} food spots available</p>
          </div>
        </div>
        
        {fullListLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          </div>
        ) : fullListSpots.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {fullListSpots.map(spot => (
                <SpotCard key={spot.id} spot={spot} />
              ))}
            </div>

            {/* Pagination Controls */}
            {fullListPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 pt-6 mt-6">
                <button
                  onClick={() => setFullListPage(Math.max(1, fullListPage - 1))}
                  disabled={fullListPage === 1}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed bg-white hover:bg-slate-50 shadow-xs transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <span className="text-xs sm:text-sm text-slate-500 font-medium">
                  Page {fullListPage} of {fullListPages}
                </span>
                <button
                  onClick={() => setFullListPage(Math.min(fullListPages, fullListPage + 1))}
                  disabled={fullListPage === fullListPages}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed bg-white hover:bg-slate-50 shadow-xs transition-colors"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 mt-4 shadow-2xs">
             <p className="text-slate-600 font-medium">No spots found for this category or status.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 md:gap-14 pb-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-slate-950 via-brand-950 to-slate-900 text-white py-12 md:py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500 via-transparent to-transparent pointer-events-none"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 bg-brand-900/70 rounded-full px-3.5 py-1 text-brand-300 text-xs font-semibold mb-4 backdrop-blur-md border border-brand-700/60 shadow-xs">
            <HandHeart className="w-3.5 h-3.5 text-brand-400" />
            <span>Verified Community Food Discovery</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-3 text-white leading-tight">
            Find Free Meals Near You
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto mb-7 md:mb-9 leading-relaxed font-normal">
            Discover Annadhanam, Temple Meals, and daily free food distributions across Hyderabad. Verified by community members.
          </p>
          
          <form onSubmit={handleSearchSubmit} className="w-full max-w-2xl mx-auto">
            <SearchBar 
              value={searchValue} 
              onChange={handleSearch} 
              onGeoLocation={() => navigate('/explore?filter=near_me')}
            />
          </form>
          
          <div className="flex flex-wrap justify-center gap-2.5 mt-6 text-xs sm:text-sm">
            <button 
              onClick={() => navigate('/explore?filter=near_me')} 
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full font-semibold transition-all flex items-center gap-1.5 backdrop-blur-md border border-white/10 hover:border-white/25 shadow-xs"
            >
              <MapPin className="w-3.5 h-3.5 text-brand-400" /> Near Me
            </button>
            <button 
              onClick={() => navigate('/explore?status=active')} 
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full font-semibold transition-all flex items-center gap-1.5 backdrop-blur-md border border-white/10 hover:border-white/25 shadow-xs"
            >
              <Calendar className="w-3.5 h-3.5 text-brand-400" /> Serving Today
            </button>
            <button 
              onClick={() => navigate('/explore?status=upcoming')} 
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full font-semibold transition-all flex items-center gap-1.5 backdrop-blur-md border border-white/10 hover:border-white/25 shadow-xs"
            >
              <Clock className="w-3.5 h-3.5 text-brand-400" /> Upcoming
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-12 md:space-y-16">
        {/* Categories Section */}
        <section>
          <div className="flex items-center justify-between mb-4 md:mb-5">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Browse by Category</h2>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">Explore meals organized by type and distribution style</p>
            </div>
          </div>
          <div className="flex md:grid overflow-x-auto md:overflow-visible pb-2 md:pb-0 no-scrollbar md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 -mx-4 px-4 md:mx-0 md:px-0">
            {categories.map((cat) => (
              <div key={cat.slug} className="shrink-0 w-36 sm:w-40 md:w-auto">
                <CategoryCard 
                  title={`${cat.name} (${cat.count})`} 
                  icon={categoryIcons[cat.name] || '🍛'} 
                  onClick={() => handleCategoryClick(cat.name)} 
                  isActive={selectedCategory === cat.name}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Selected Category Results Section */}
        {selectedCategory && (
          <section ref={categorySectionRef} className="scroll-mt-24">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <span>{categoryIcons[selectedCategory] || '🍛'}</span>
                  {selectedCategory} in Hyderabad
                </h2>
                <p className="text-xs md:text-sm text-slate-500 mt-0.5">Showing top results for this category</p>
              </div>
              <button 
                onClick={() => setSearchParams({ view_all_category: selectedCategory })} 
                className="text-brand-700 font-semibold text-xs sm:text-sm hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-3.5 py-1.5 rounded-xl transition-colors border border-brand-200/60"
              >
                View all {selectedCategory} &rarr;
              </button>
            </div>
            
            {isCategoryLoading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
              </div>
            ) : categorySpots.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {categorySpots.map(spot => (
                  <SpotCard key={spot.id} spot={spot} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/90 shadow-2xs">
                <p className="text-slate-600 font-medium">No active spots found for this category.</p>
              </div>
            )}
          </section>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          </div>
        ) : (
          <>
            {/* Serving Now Section */}
            {activeSpots.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4 md:mb-5">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                      Serving Now
                    </h2>
                    <p className="text-xs md:text-sm text-slate-500 mt-0.5 hidden sm:block">Currently active or recurring daily food spots</p>
                  </div>
                  <button 
                    onClick={() => setSearchParams({ view_all_status: 'active' })} 
                    className="text-brand-700 font-semibold text-xs sm:text-sm hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-3.5 py-1.5 rounded-xl transition-colors border border-brand-200/60 shrink-0"
                  >
                    View all &rarr;
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {activeSpots.slice(0, 4).map(spot => (
                    <SpotCard key={spot.id} spot={spot} />
                  ))}
                </div>
              </section>
            )}

            {/* Upcoming / Starting Soon Section */}
            {upcomingSpots.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4 md:mb-5">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                      Starting Soon
                    </h2>
                    <p className="text-xs md:text-sm text-slate-500 mt-0.5 hidden sm:block">Scheduled upcoming distributions</p>
                  </div>
                  <button 
                    onClick={() => setSearchParams({ view_all_status: 'upcoming' })} 
                    className="text-brand-700 font-semibold text-xs sm:text-sm hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-3.5 py-1.5 rounded-xl transition-colors border border-brand-200/60 shrink-0"
                  >
                    View all &rarr;
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {upcomingSpots.slice(0, 4).map(spot => (
                    <SpotCard key={spot.id} spot={spot} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
