import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Sparkles } from 'lucide-react';

interface FooterProps {
  sidebarLayout?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ sidebarLayout = false }) => {
  return (
    <footer className="bg-[#08080A] text-[#9A9AA8] border-t border-[#232329] mt-8 sm:mt-14">
      <div className={sidebarLayout ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-9 sm:py-12' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14'}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="inline-block">
              <img
                src="https://iili.io/nFUR3HN.png"
                alt="Call Me - Find Your Perfect Match"
                className="w-[165px] sm:w-[185px] h-auto object-contain"
              />
            </Link>
            <p className="text-sm text-[#9A9AA8] max-w-md leading-relaxed">
              A private introduction and personal discovery platform for accomplished individuals seeking meaningful connections built on mutual respect and discretion.
            </p>
            <div className="flex flex-wrap items-center gap-5 text-xs">
              <span className="flex items-center gap-1.5 text-white font-medium">
                <ShieldCheck className="w-4 h-4 text-[#FF2878]" />
                Verified Candidate Portfolios
              </span>
              <span className="flex items-center gap-1.5 text-[#9A9AA8]">
                <Lock className="w-4 h-4 text-[#8B5CF6]" />
                Private Introductions
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white">Directory</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-[#9A9AA8] hover:text-white transition-colors">
                  Browse Candidates
                </Link>
              </li>
              <li>
                <a href="#spotlight" className="text-[#9A9AA8] hover:text-white transition-colors">
                  Featured Spotlights
                </a>
              </li>
              <li>
                <a href="#discover" className="text-[#9A9AA8] hover:text-white transition-colors">
                  Search by Location
                </a>
              </li>
              <li>
                <Link to="/admin" className="text-white hover:text-[#FF4D8D] transition-colors inline-flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF2878]" />
                  <span>Private Portal</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Privacy & Trust Standards */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white">Trust &amp; Privacy</h4>
            <p className="text-xs text-[#9A9AA8] leading-relaxed">
              We uphold strict discretion standards. Personal details are handled responsibly and shared through verified introduction channels.
            </p>
            <div className="pt-1 text-xs">
              <span className="text-white font-medium">USA &amp; International Introductions</span>
            </div>
          </div>
        </div>

        <div className="border-t border-[#232329] mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#7A7A88] gap-4">
          <p>© {new Date().getFullYear()} Call Me Platform. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-6">
            <span>Confidential Inquiries</span>
            <span>Simulated Video Preview</span>
            <Link to="/admin/login" className="text-[#9A9AA8] hover:text-white transition-colors">
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
