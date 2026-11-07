import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Sparkles, Mail, Compass } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#03060d] text-slate-400 border-t border-amber-200/10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="inline-block">
              <img 
                src="https://iili.io/nFUR3HN.png" 
                alt="Call Me - Find Your Perfect Match"
                className="w-[180px] sm:w-[210px] h-auto object-contain" 
              />
            </Link>
            <p className="text-sm text-slate-300 max-w-md leading-relaxed font-normal">
              A bespoke luxury matrimonial and personal introduction platform for accomplished individuals seeking genuine, lifelong companionship. Designed with absolute privacy, discretion, and mutual respect.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 text-amber-200">
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                Verified Candidate Portfolios
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <Lock className="w-4 h-4 text-slate-400" />
                End-to-End Private Introductions
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-amber-200">Directory</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-slate-300 hover:text-amber-200 transition-colors">Browse Candidates</Link>
              </li>
              <li>
                <Link to="/?filter=featured" className="text-slate-300 hover:text-amber-200 transition-colors">Featured Spotlights</Link>
              </li>
              <li>
                <a href="#discover" className="text-slate-300 hover:text-amber-200 transition-colors">Search by Location</a>
              </li>
              <li>
                <Link to="/admin" className="text-amber-300/90 hover:text-amber-200 transition-colors flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Private Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Privacy & Trust Standards */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-amber-200">Trust &amp; Privacy</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              We uphold strict privacy standards. Contact details are never sold or shared without mutual verification and candidate consent.
            </p>
            <div className="pt-2 text-xs text-slate-400">
              <span className="inline-block px-2.5 py-1 rounded-lg bg-[#0d1424] border border-amber-200/10 text-amber-100/80">
                USA &amp; International Introductions
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} Call Me Platform. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-6">
            <span>Confidential Inquiries</span>
            <span>Simulated Video Preview</span>
            <Link to="/admin/login" className="text-slate-400 hover:text-amber-200 transition-colors">
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
