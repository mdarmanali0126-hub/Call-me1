import React, { useEffect, useState } from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';
import { AdSlot } from '../types';
import { fetchPublicAdvertising, trackTelemetry } from '../lib/api';

interface AdBannerProps {
  slotName: 'header_banner' | 'profile_inline' | 'story_sponsor' | 'footer_banner';
  profileSlug?: string;
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ slotName, profileSlug, className = '' }) => {
  const [ad, setAd] = useState<AdSlot | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchPublicAdvertising().then((settings) => {
      if (mounted && settings?.slots) {
        const found = settings.slots.find((s) => s.slotName === slotName && s.enabled);
        setAd(found || null);
      }
    });
    return () => {
      mounted = false;
    };
  }, [slotName]);

  if (!ad) return null;

  const handleClick = () => {
    trackTelemetry({
      type: 'ad_click',
      profileSlug,
      metadata: { slotName, sponsor: ad.sponsorName, url: ad.linkUrl },
      timestamp: new Date().toISOString()
    });
  };

  if (slotName === 'header_banner') {
    return (
      <div className={`bg-gradient-to-r from-amber-950 via-slate-900 to-rose-950 text-white py-2.5 px-4 text-xs ${className}`}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border border-amber-500/30 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-amber-400" />
              {ad.badgeText || 'Exclusive Partner'}
            </span>
            <span className="font-semibold text-slate-200">{ad.sponsorName}:</span>
            <span className="text-slate-300 hidden sm:inline">{ad.title}</span>
          </div>
          <a
            href={ad.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200 font-medium hover:underline ml-auto sm:ml-0"
          >
            <span>{ad.ctaText || 'Learn More'}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    );
  }

  if (slotName === 'profile_inline') {
    return (
      <div className={`my-8 p-5 sm:p-6 bg-gradient-to-br from-amber-50/70 via-white to-rose-50/50 rounded-2xl border border-amber-200/80 shadow-xs relative overflow-hidden ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded border border-amber-300/60">
            {ad.badgeText || 'Curated Recommendation'}
          </span>
          <span className="text-[11px] text-slate-500">Sponsored by {ad.sponsorName}</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-5 items-center">
          {ad.imageUrl && ad.imageUrl.trim() !== '' && (
            <img
              src={ad.imageUrl}
              alt={ad.sponsorName}
              referrerPolicy="no-referrer"
              className="w-full sm:w-32 h-24 sm:h-24 object-cover rounded-xl border border-amber-100 shadow-xs"
            />
          )}
          <div className="flex-1 text-center sm:text-left">
            <h4 className="font-bold text-slate-900 text-base leading-snug">{ad.title}</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ad.description}</p>
          </div>
          <a
            href={ad.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-700 to-rose-700 hover:from-amber-800 hover:to-rose-800 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
          >
            <span>{ad.ctaText || 'Discover'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  if (slotName === 'story_sponsor') {
    return (
      <div className={`p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-white text-xs flex items-center justify-between gap-3 ${className}`}>
        <div className="flex items-center gap-2 truncate">
          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-400 text-slate-900 font-bold">
            {ad.badgeText || 'Presented By'}
          </span>
          <span className="font-semibold truncate">{ad.sponsorName}</span>
        </div>
        <a
          href={ad.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="text-amber-300 hover:text-amber-100 underline text-[11px] shrink-0 flex items-center gap-1"
        >
          <span>{ad.ctaText || 'Explore'}</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800/80 border border-slate-700 p-4 rounded-xl text-slate-300 text-xs flex flex-wrap items-center justify-between gap-4 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-[10px] rounded uppercase font-semibold">
          {ad.badgeText || 'Partner'}
        </span>
        <span className="font-semibold text-white">{ad.sponsorName}</span>
        <span className="text-slate-400 hidden sm:inline">— {ad.title}</span>
      </div>
      <a
        href={ad.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
      >
        <span>{ad.ctaText || 'Visit Partner'}</span>
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
};
