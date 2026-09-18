import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          <div className="col-span-1 md:col-span-2">
            <span className="font-bold text-xl text-slate-900">
              Free Food<span className="text-brand-600">Hyd</span>
            </span>
            <p className="text-sm text-slate-500 mt-3 max-w-sm">
              Hyderabad's community-driven platform to find and share free meals, Annadhanam, and food distributions.
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-slate-900 text-sm">Navigation</h4>
            <Link to="/explore" className="text-sm text-slate-600 hover:text-brand-600 transition-colors w-fit">Explore Map</Link>
            <Link to="/today" className="text-sm text-slate-600 hover:text-brand-600 transition-colors w-fit">Today</Link>
            <Link to="/upcoming" className="text-sm text-slate-600 hover:text-brand-600 transition-colors w-fit">Upcoming</Link>
            <Link to="/saved" className="text-sm text-slate-600 hover:text-brand-600 transition-colors w-fit">Saved</Link>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-slate-900 text-sm">Contribute</h4>
            <Link to="/add" className="text-sm text-slate-600 hover:text-brand-600 transition-colors w-fit">Add a Place</Link>
            <Link to="/report" className="text-sm text-slate-600 hover:text-brand-600 transition-colors w-fit">Report an Issue</Link>
          </div>
        </div>
        
        <div className="mt-8 md:mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Free Food Hyderabad. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-red-500 fill-current" /> for the community
          </p>
        </div>
      </div>
    </footer>
  );
}
