import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchPublicAdvertising } from '../lib/api';

interface AdsterraBannerProps {
  className?: string;
  slotName?: string;
}

export const AdsterraBanner: React.FC<AdsterraBannerProps> = ({ className = '', slotName }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    fetchPublicAdvertising().then((settings) => {
      if (isMounted) {
        setIsEnabled(!!settings?.ads?.banner);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  if (!isEnabled) {
    return null;
  }

  // Use location.pathname as part of the key so the iframe re-renders when route changes.
  // This ensures the Adsterra script inside the iframe gets executed again on page navigations.
  const iframeKey = `adsterra-${slotName || 'default'}-${location.pathname}`;

  return (
    <div
      className={`w-full max-w-full flex flex-col items-center justify-center my-4 ${className}`}
      id={`adsterra-banner-container-${slotName || 'default'}`}
    >
      <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-1 text-center select-none">
        Advertisement
      </div>
      <div className="w-[320px] max-w-full min-h-[50px] flex items-center justify-center bg-slate-900/5 rounded-lg border border-slate-200/50">
        <iframe
          key={iframeKey}
          title={`Sponsored Network Ad (320x50) - ${slotName || 'default'}`}
          width={320}
          height={50}
          style={{
            width: '320px',
            height: '50px',
            maxWidth: '100%',
            border: 'none'
          }}
          scrolling="no"
          src="/adsterra.html"
        />
      </div>
    </div>
  );
};
