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
          <div className="grid grid-cols-3 gap-3">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 transition-colors border border-emerald-200/60"
            >
              <MessageCircle className="w-6 h-6 text-emerald-600" />
              <span className="text-[11px] font-semibold">WhatsApp</span>
            </a>

            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 transition-colors border border-slate-200"
            >
              <Twitter className="w-6 h-6 text-slate-900" />
              <span className="text-[11px] font-semibold">X (Twitter)</span>
            </a>

            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-blue-50 hover:bg-blue-100/80 text-blue-800 transition-colors border border-blue-200/60"
            >
              <Linkedin className="w-6 h-6 text-blue-700" />
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
