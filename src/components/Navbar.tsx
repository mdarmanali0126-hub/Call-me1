import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Heart, Search, ShieldCheck, Sparkles, UserCheck, Menu, X, ShieldAlert } from 'lucide-react';

interface NavbarProps {
  onSearchClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearchClick }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2 min-h-[72px] lg:min-h-[88px]">
          {/* Logo */}
          <Link to="/" className="flex items-center group shrink-0">
            <img 
              src="https://iili.io/nFUR3HN.png" 
              alt="Call Me - Find Your Perfect Match"
              className="w-[140px] sm:w-[185px] lg:w-[240px] h-auto object-contain shrink-0 transition-transform duration-200 group-hover:scale-105" 
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-7">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors ${
                location.pathname === '/' ? 'text-rose-600 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Browse Profiles
            </Link>

            <a
              href="#featured"
              onClick={(e) => {
                if (location.pathname !== '/') {
                  e.preventDefault();
                  navigate('/?filter=featured#featured');
                }
              }}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              Featured Spotlights
            </a>

            <div className="h-4 w-px bg-slate-200" />

            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/70">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Portfolios</span>
            </div>
          </nav>

          {/* Action buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {onSearchClick && (
              <button
                type="button"
                onClick={onSearchClick}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-500 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors border border-slate-200"
                title="Search profiles"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search by name, city, role...</span>
              </button>
            )}

            <Link
              to={isAdminRoute ? '/' : '/admin'}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                isAdminRoute
                  ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{isAdminRoute ? 'Exit Admin View' : 'Admin Portal'}</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 space-y-3">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
            >
              Browse Profiles
            </Link>
            <Link
              to="/?filter=featured"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
            >
              Featured Spotlights
            </Link>
            <div className="pt-2 border-t border-slate-100">
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold text-rose-700 bg-rose-50"
              >
                <UserCheck className="w-4 h-4" />
                <span>Admin Management Dashboard</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
