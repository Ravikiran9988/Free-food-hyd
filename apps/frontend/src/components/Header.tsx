import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, MapPin, User as UserIcon, LogOut, Bookmark, LayoutDashboard, UserCircle } from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, role, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Explore Map', path: '/explore' },
    { name: 'Today', path: '/today' },
    { name: 'Upcoming', path: '/upcoming' },
    { name: 'Add a Place', path: '/add' },
    { name: 'Saved', path: '/saved' },
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="bg-brand-600 p-2 rounded-xl text-white shadow-xs group-hover:bg-brand-700 transition-colors">
              <MapPin className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              Free Food<span className="text-brand-600">Hyd</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-sm font-medium transition-all',
                  location.pathname === link.path
                    ? 'bg-brand-50 text-brand-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                {link.name}
              </Link>
            ))}

            <div className="h-4 w-px bg-slate-200 mx-1"></div>

            {!isAuthenticated ? (
              <Link
                to="/signin"
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:text-brand-600 hover:bg-slate-100 transition-all"
              >
                Sign In
              </Link>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-brand-100 text-brand-800 font-bold text-xs border border-brand-200 hover:ring-2 hover:ring-brand-500/20 transition-all shadow-xs"
                  title={user?.email}
                >
                  {user?.email ? user.email.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-1 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                      <p className="text-xs text-slate-500">Signed in as</p>
                      <p className="text-sm font-semibold text-slate-900 truncate">{user?.email}</p>
                      <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-brand-100 text-brand-800">
                        {role}
                      </span>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/account"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <UserCircle className="w-4 h-4 text-slate-400" />
                        My Account
                      </Link>
                      <Link
                        to="/saved"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Bookmark className="w-4 h-4 text-slate-400" />
                        Saved Places
                      </Link>
                      
                      {role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-brand-700 font-semibold hover:bg-brand-50 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-brand-600" />
                          Admin Dashboard
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-slate-100 py-1">
                      <button
                        onClick={logout}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      </header>

      {/* Mobile Navigation Drawer Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] md:hidden transition-opacity duration-300"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Mobile Navigation Drawer */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 w-4/5 max-w-sm bg-white shadow-2xl z-[100] md:hidden transform transition-transform duration-300 ease-in-out flex flex-col",
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="bg-brand-500 p-1.5 rounded-lg text-white">
              <MapPin className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">
              Free Food<span className="text-brand-600">Hyd</span>
            </span>
          </div>
          <button
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"
            onClick={() => setIsMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <nav className="flex flex-col px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  'block px-3 py-2 rounded-md text-base font-semibold',
                  location.pathname === link.path
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                {link.name}
              </Link>
            ))}
            
            <div className="border-t border-slate-100 my-2 pt-2"></div>
            
            {!isAuthenticated ? (
              <Link
                to="/signin"
                onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-bold text-brand-600 hover:bg-brand-50"
              >
                Sign In
              </Link>
            ) : (
              <>
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-slate-900">{user?.email}</p>
                </div>
                <Link
                  to="/account"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <UserCircle className="w-5 h-5" /> My Account
                </Link>
                {role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-bold text-brand-700 hover:bg-brand-50"
                  >
                    <LayoutDashboard className="w-5 h-5" /> Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-2 px-3 py-2 w-full text-left rounded-md text-base font-semibold text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-5 h-5" /> Sign Out
                </button>
              </>
            )}
          </nav>
        </div>
      </div>
    </>
  );
}
