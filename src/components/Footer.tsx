import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShieldCheck, Lock, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white">
                <Heart className="w-4 h-4 fill-white text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white font-serif-luxury">CALL ME</span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              A bespoke matrimonial and personal story portfolio platform connecting thoughtful professionals seeking genuine, lifelong companionship. Designed with privacy, dignity, and authentic storytelling.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Verified Candidate Profiles
              </span>
              <span className="flex items-center gap-1">
                <Lock className="w-4 h-4 text-amber-400" />
                End-to-End Direct Contact
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Directory</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition-colors">All Profiles</Link>
              </li>
              <li>
                <Link to="/?filter=featured" className="hover:text-white transition-colors">Featured Spotlights</Link>
              </li>
              <li>
                <a href="#about" className="hover:text-white transition-colors">About the Architecture</a>
              </li>
              <li>
                <Link to="/admin" className="hover:text-white transition-colors flex items-center gap-1 text-rose-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  Admin Console
                </Link>
              </li>
            </ul>
          </div>

          {/* Privacy & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Ethical Standards</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Candidate contact details are shared directly for mutual consent matrimonial discussions. Strictly no unsolicited marketing or data brokering.
            </p>
            <div className="pt-2 text-xs text-slate-400">
              <span className="inline-block px-2 py-1 rounded bg-slate-800 border border-slate-700">
                Powered by Firebase &amp; Express
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} Call Me Platform. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Dynamic Slug Engine</span>
            <span>Story Mode System</span>
            <span>Vercel Deployable</span>
            <Link to="/admin/login" className="text-slate-400 hover:text-slate-200 transition-colors">
              Admin Login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
