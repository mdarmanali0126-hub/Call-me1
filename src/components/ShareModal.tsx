import React, { useState } from 'react';
import { X, Copy, Check, MessageCircle, Twitter, Linkedin, Share2 } from 'lucide-react';
import { Profile } from '../types';

interface ShareModalProps {
  profile: Profile;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ profile, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}/profile/${profile.slug}`;
  const shareText = `View ${profile.fullName}'s matrimonial portfolio & proposal on Call Me:`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-slate-900 text-base">Share Profile Portfolio</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Share this matrimonial profile link directly with family members, matchmakers, or prospective candidates.
          </p>

          {/* Social share options */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 transition-colors border border-emerald-200/60"
            >
              <MessageCircle className="w-5 h-5 text-emerald-600" />
              <span className="text-[11px] font-semibold">WhatsApp</span>
            </a>

            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-blue-50 hover:bg-blue-100/80 text-blue-900 transition-colors border border-blue-200/60"
            >
              <svg className="w-5 h-5 fill-[#1877F2]" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="text-[11px] font-semibold">Facebook</span>
            </a>

            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 transition-colors border border-slate-200"
            >
              <Twitter className="w-5 h-5 text-slate-900" />
              <span className="text-[11px] font-semibold">X (Twitter)</span>
            </a>

            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-sky-50 hover:bg-sky-100/80 text-sky-800 transition-colors border border-sky-200/60"
            >
              <Linkedin className="w-5 h-5 text-[#0A66C2]" />
              <span className="text-[11px] font-semibold">LinkedIn</span>
            </a>
          </div>

          {/* Direct link copy */}
          <div className="pt-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">
              Direct Link
            </label>
            <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="bg-transparent text-xs text-slate-700 flex-1 outline-none truncate font-mono px-1"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
