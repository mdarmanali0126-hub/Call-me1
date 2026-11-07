import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShieldCheck, Sparkles, UserCheck, Menu, X } from 'lucide-react';

interface NavbarProps {
  onSearchClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearchClick }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-40 bg-[#050811]/92 backdrop-blur-md border-b border-amber-200/10 shadow-lg shadow-black/40 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2 min-h-[72px] lg:min-h-[84px]">
          {/* Logo */}
          <Link to="/" className="flex items-center group shrink-0" aria-label="Call Me - Luxury Matchmaking">
            <img 
              src="https://iili.io/nFUR3HN.png" 
              alt="Call Me - Find Your Perfect Match"
              className="w-[140px] sm:w-[180px] lg:w-[220px] h-auto object-contain shrink-0 transition-transform duration-200 group-hover:scale-[1.02]" 
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-7">
            <Link
              to="/"
              className={`text-xs uppercase tracking-widest font-semibold transition-colors ${
                location.pathname === '/' ? 'text-amber-200 font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Discover
            </Link>

            <a
              href="#featured"
              onClick={(e) => {
                if (location.pathname !== '/') {
                  e.preventDefault();
                  navigate('/?filter=featured#featured');
                }
              }}
              className="text-xs uppercase tracking-widest font-semibold text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300/80" />
              <span>Spotlight</span>
            </a>

            <div className="h-4 w-px bg-white/10" />

            <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-100/90 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-400/25">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>Bespoke Introductions</span>
            </div>
          </nav>

          {/* Action buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {onSearchClick && (
              <button
                type="button"
                onClick={onSearchClick}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-300 bg-[#0d1424]/90 hover:bg-[#131d33] rounded-xl transition-colors border border-white/10 hover:border-amber-400/30 cursor-pointer"
                title="Search profiles"
              >
                <Search className="w-3.5 h-3.5 text-amber-300" />
                <span>Search candidates...</span>
              </button>
            )}

            <Link
              to={isAdminRoute ? '/' : '/admin'}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
                isAdminRoute
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-xs'
                  : 'bg-[#0d1424] hover:bg-[#131d33] text-slate-300 hover:text-amber-200 border border-white/10 hover:border-amber-400/30'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAdminRoute ? 'Exit Admin View' : 'Private Portal'}</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#0d1424] border border-white/5"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10 space-y-3 bg-[#050811]">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-[#0d1424]"
            >
              Browse Profiles
            </Link>
            <Link
              to="/?filter=featured"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-[#0d1424]"
            >
              Featured Spotlights
            </Link>
            <div className="pt-2 border-t border-white/10">
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20"
              >
                <UserCheck className="w-4 h-4" />
                <span>Private Admin Portal</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
