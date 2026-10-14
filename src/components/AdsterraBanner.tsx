import React, { useEffect, useState } from 'react';
import { fetchPublicAdvertising } from '../lib/api';

interface AdsterraBannerProps {
  className?: string;
  slotName?: string;
}

/**
 * AdsterraBanner renders the 320x50 network ad inside a dedicated, responsive container.
 *
 * Optimizations:
 * 1. Dedicated, reserved dimensions (min-h-[50px], max-w-[320px]) to eliminate Cumulative Layout Shift (CLS).
 * 2. Solid dark background (bg-zinc-950) and overflow-hidden to prevent artifacts or bleed-through.
 * 3. Proper vertical spacing (my-6 sm:my-8) preventing overlap with filters or profile cards.
 * 4. Preserves full integration with admin toggle settings and Firestore.
 */
export const AdsterraBanner: React.FC<AdsterraBannerProps> = ({ className = '', slotName }) => {
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetchPublicAdvertising()
      .then((settings) => {
        if (isMounted && settings?.ads) {
          setIsEnabled(!!settings.ads.banner);
        }
      })
      .catch(() => {
        // Fallback: keep enabled if API check encounters network errors
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (!isEnabled) {
    return null;
  }

  return (
    <aside
      role="region"
      aria-label="Advertisement"
      className={`w-full max-w-full flex flex-col items-center justify-center my-6 sm:my-8 px-3 select-none relative z-10 isolate ${className}`}
      id={`banner-container-${slotName || 'default'}`}
    >
      <div className="w-full max-w-[340px] flex flex-col items-center bg-zinc-950/90 border border-white/10 rounded-2xl p-2.5 sm:p-3 shadow-lg shadow-black/50">
        <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-2 text-center select-none">
          Advertisement
        </span>

        {/* Dedicated responsive container with reserved 320x50 dimensions to prevent layout shifts and overflow */}
        <div className="w-[320px] max-w-full h-[50px] min-h-[50px] flex items-center justify-center bg-zinc-900 rounded-lg border border-white/5 overflow-hidden">
          <iframe
            title={`Sponsored Ad (320x50) - ${slotName || 'default'}`}
            width={320}
            height={50}
            style={{
              width: '320px',
              height: '50px',
              maxWidth: '100%',
              border: 'none',
              display: 'block',
              overflow: 'hidden',
              backgroundColor: '#09090b',
            }}
            scrolling="no"
            src="/adsterra.html"
          />
        </div>
      </div>
    </aside>
  );
};
