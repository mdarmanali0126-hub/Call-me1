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
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-white/10 shadow-xs text-white">
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
                location.pathname === '/' ? 'text-pink-500 font-semibold' : 'text-slate-300 hover:text-white'
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
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-pink-400" />
              Featured Spotlights
            </a>

            <div className="h-4 w-px bg-white/10" />

            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified Portfolios</span>
            </div>
          </nav>

          {/* Action buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {onSearchClick && (
              <button
                type="button"
                onClick={onSearchClick}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-300 bg-zinc-900/90 hover:bg-zinc-800 rounded-xl transition-colors border border-white/10 hover:border-pink-500/30 cursor-pointer"
                title="Search profiles"
              >
                <Search className="w-3.5 h-3.5 text-pink-400" />
                <span>Search by name, city, role...</span>
              </button>
            )}

            <Link
              to={isAdminRoute ? '/' : '/admin'}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                isAdminRoute
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-xs'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-slate-300 hover:text-white border border-white/10'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-pink-400" />
              <span>{isAdminRoute ? 'Exit Admin View' : 'Admin Portal'}</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-zinc-900"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10 space-y-3 bg-slate-950">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-base font-medium text-slate-200 hover:bg-zinc-900"
            >
              Browse Profiles
            </Link>
            <Link
              to="/?filter=featured"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-base font-medium text-slate-200 hover:bg-zinc-900"
            >
              Featured Spotlights
            </Link>
            <div className="pt-2 border-t border-white/10">
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-pink-400 bg-pink-500/10 border border-pink-500/20"
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
