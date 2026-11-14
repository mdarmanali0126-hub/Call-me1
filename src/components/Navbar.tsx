import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShieldCheck, Sparkles, UserCheck, Menu, X } from 'lucide-react';

interface NavbarProps {
  onSearchClick?: () => void;
  onMenuClick?: () => void;
  sidebarLayout?: boolean;
  searchQuery?: string;
  onClearSearch?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onSearchClick,
  onMenuClick,
  sidebarLayout = false,
  searchQuery = '',
  onClearSearch,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isAdminRoute = location.pathname.startsWith('/admin');
  const trimmedQuery = searchQuery.trim();

  return (
    <header className="sticky top-0 z-30 bg-[#09090B]/95 backdrop-blur-md border-b border-[#232329] text-white">
      <div
        className={
          sidebarLayout
            ? 'w-full px-3 min-[390px]:px-4 sm:px-6 lg:px-8'
            : 'max-w-7xl mx-auto px-3 min-[390px]:px-4 sm:px-6 lg:px-8'
        }
      >
        <div className="flex items-center justify-between gap-2 sm:gap-5 h-16">
          {/* Left Zone: Mobile Hamburger + Compact Logo (<lg) / Directory Label (lg+) */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {sidebarLayout && onMenuClick && (
              <button
                type="button"
                onClick={onMenuClick}
                className="lg:hidden min-w-[44px] min-h-[44px] w-10 h-10 -ml-1 flex items-center justify-center rounded-xl text-[#A5A5B5] hover:text-white hover:bg-[#141418] border border-[#232329] transition-colors cursor-pointer shrink-0"
                aria-label="Open navigation drawer"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <Link
              to="/"
              className={`flex items-center group shrink-0 ${sidebarLayout ? 'lg:hidden' : ''}`}
              aria-label="Call Me - Discovery Home"
            >
              <img
                src="https://iili.io/nFUR3HN.png"
                alt="Call Me"
                className="h-6 min-[360px]:h-7 sm:h-8 w-auto object-contain shrink-0 transition-transform duration-200 group-hover:scale-[1.02]"
              />
            </Link>

            {sidebarLayout && (
              <p className="hidden lg:block text-xs font-medium text-[#9A9AA8] tracking-wide whitespace-nowrap truncate">
                Private Member Directory
              </p>
            )}
          </div>

          {/* Center Zone: Standard Nav Links (Detail Pages) OR Refined Search Entry Point (Sidebar Layout) */}
          {!sidebarLayout ? (
            <nav className="hidden md:flex items-center gap-7">
              <Link
                to="/"
                className={`text-xs uppercase tracking-widest font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  location.pathname === '/' ? 'text-white' : 'text-[#9A9AA8] hover:text-white'
                }`}
              >
                Discover
              </Link>

              <a
                href="/?filter=featured#spotlight"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/?filter=featured#spotlight');
                }}
                className="text-xs uppercase tracking-widest font-semibold text-[#9A9AA8] hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FF2878]" />
                <span>Spotlight</span>
              </a>

              <span className="h-4 w-px bg-[#232329]" aria-hidden="true" />

              <span className="flex items-center gap-1.5 text-xs font-medium text-[#9A9AA8] whitespace-nowrap shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span>Bespoke Introductions</span>
              </span>
            </nav>
          ) : (
            onSearchClick && (
              <div className="hidden sm:flex items-center flex-1 max-w-md mx-auto">
                <div className="relative flex items-center w-full h-10 rounded-xl bg-[#111114] border border-[#232329] hover:border-[#34343E] transition-colors">
                  <button
                    type="button"
                    onClick={onSearchClick}
                    className="flex-1 h-full flex items-center justify-between gap-3 px-3.5 text-xs text-left cursor-pointer min-w-0"
                    title="Search candidates (⌘K)"
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <Search className="w-3.5 h-3.5 text-[#FF2878] shrink-0" />
                      <span className={`truncate ${trimmedQuery ? 'text-white font-medium' : 'text-[#9A9AA8]'}`}>
                        {trimmedQuery ? trimmedQuery : 'Search by name, city, or profession...'}
                      </span>
                    </span>
                    {!trimmedQuery && (
                      <kbd className="hidden xl:inline-flex items-center px-1.5 py-0.5 text-[10px] font-sans font-medium text-[#7A7A88] bg-[#09090B] border border-[#232329] rounded shrink-0">
                        ⌘K
                      </kbd>
                    )}
                  </button>
                  {trimmedQuery && onClearSearch && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClearSearch();
                      }}
                      className="pr-3 pl-1 h-full text-[#9A9AA8] hover:text-white transition-colors cursor-pointer shrink-0"
                      aria-label="Clear search query"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )
          )}

          {/* Right Zone: Mobile Search Icon + Compact Private Portal CTA */}
          <div className="flex items-center gap-1.5 min-[360px]:gap-2 sm:gap-2.5 shrink-0">
            {onSearchClick && (
              <button
                type="button"
                onClick={onSearchClick}
                className={`${
                  sidebarLayout ? 'sm:hidden' : 'hidden sm:flex'
                } min-w-[40px] min-h-[40px] sm:h-10 px-2.5 sm:px-3.5 flex items-center justify-center gap-2 text-xs font-medium text-[#A5A5B5] hover:text-white bg-[#111114] hover:bg-[#17171B] rounded-xl transition-colors border border-[#232329] cursor-pointer shrink-0`}
                aria-label="Search candidates"
                title="Search candidates"
              >
                <Search className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-[#FF2878]" />
                <span className={sidebarLayout ? 'sr-only' : 'hidden sm:inline'}>Search Candidates</span>
              </button>
            )}

            <Link
              to={isAdminRoute ? '/' : '/admin'}
              className="h-9 sm:h-10 inline-flex items-center gap-1 sm:gap-1.5 px-2.5 min-[375px]:px-3 sm:px-4 text-[11px] sm:text-xs font-semibold rounded-xl bg-[#141418] hover:bg-[#1C1C22] text-white border border-[#2A2A32] hover:border-[#FF2878]/45 transition-colors whitespace-nowrap shrink-0"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#FF2878] shrink-0" />
              <span>{isAdminRoute ? 'Exit Admin' : 'Private Portal'}</span>
            </Link>

            {!sidebarLayout && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-[#A5A5B5] hover:text-white hover:bg-[#141418] border border-[#232329] cursor-pointer shrink-0"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Standard Mobile dropdown (Detail pages only) */}
        {!sidebarLayout && mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#232329] space-y-2 bg-[#09090B]">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-sm font-medium text-white hover:bg-[#141418]"
            >
              Discover Profiles
            </Link>
            <Link
              to="/?filter=featured#spotlight"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-sm font-medium text-[#9A9AA8] hover:text-white hover:bg-[#141418]"
            >
              Featured Spotlights
            </Link>
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#141418] border border-[#2A2A32]"
            >
              <UserCheck className="w-4 h-4 text-[#FF2878]" />
              <span>Private Portal</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
