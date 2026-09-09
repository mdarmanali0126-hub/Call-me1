import React, { useEffect, useState } from 'react';
import { fetchPublicAdvertising } from '../lib/api';

interface AdsterraBannerProps {
  className?: string;
}

export const AdsterraBanner: React.FC<AdsterraBannerProps> = ({ className = '' }) => {
  const [isEnabled, setIsEnabled] = useState(false);

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

  const iframeContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { box-sizing: border-box; }
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            overflow: hidden;
          }
        </style>
      </head>
      <body>
        <script type="text/javascript">
          atOptions = {
            'key' : 'b500723919ac3824a49427b2994c2dfd',
            'format' : 'iframe',
            'height' : 50,
            'width' : 320,
            'params' : {}
          };
        </script>
        <script type="text/javascript" src="https://www.highrevenueformat.com/b500723919ac3824a49427b2994c2dfd/invoke.js"></script>
      </body>
    </html>
  `;

  return (
    <div
      className={`w-full max-w-full flex flex-col items-center justify-center my-4 overflow-hidden ${className}`}
      id="adsterra-banner-container"
    >
      <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-1 text-center select-none">
        Advertisement
      </div>
      <div className="w-[320px] max-w-full h-[50px] overflow-hidden flex items-center justify-center bg-slate-900/5 rounded-lg border border-slate-200/50">
        <iframe
          title="Sponsored Network Ad (320x50)"
          width={320}
          height={50}
          style={{
            width: '320px',
            height: '50px',
            maxWidth: '100%',
            border: 'none',
            overflow: 'hidden',
          }}
          scrolling="no"
          srcDoc={iframeContent}
        />
      </div>
    </div>
  );
};
