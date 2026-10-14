import React, { useEffect, useState } from 'react';
import { fetchPublicAdvertising } from '../lib/api';
import { NetworkAdSettings } from '../types';

const POPUNDER_SCRIPT_URL = 'https://pl31735759.profitableratecpmnetwork.com/56/d6/87/56d687c8bf806855c65fcd7f05dd3b68.js';
const SOCIAL_BAR_SCRIPT_URL = 'https://pl31735760.profitableratecpmnetwork.com/fa/79/5d/fa795d0dc5e23698c01d56ead908d40e.js';

const POPUNDER_SCRIPT_ID = 'network-popunder-script';
const SOCIAL_BAR_SCRIPT_ID = 'network-socialbar-script';

// Legacy script IDs to clean up if previously injected
const LEGACY_POPUNDER_SCRIPT_ID = 'adsterra-popunder-script';
const LEGACY_SOCIAL_BAR_SCRIPT_ID = 'adsterra-socialbar-script';

// Global execution guards to strictly guarantee one-time loading per application lifecycle
let hasPopunderInitialized = false;
let hasSocialBarInitialized = false;

/**
 * NetworkAdsLoader handles single global initialization of Popunder and Social Bar ad scripts.
 *
 * Optimizations:
 * 1. Loaded once through the top-level application layout in App.tsx.
 * 2. Guaranteed zero duplicate executions on route changes or component re-renders via singleton flags.
 * 3. Does not generate any redundant floating bar UI (relies solely on the official network script).
 * 4. Automatic cleanup of any superseded or legacy script elements in the DOM.
 * 5. Safe error handling if network or ad-blockers prevent script loading.
 */
export const NetworkAdsLoader: React.FC = () => {
  const [adsConfig, setAdsConfig] = useState<NetworkAdSettings>({
    popunder: true,
    socialBar: true,
    banner: true,
  });

  useEffect(() => {
    let isMounted = true;

    fetchPublicAdvertising()
      .then((settings) => {
        if (isMounted && settings?.ads) {
          setAdsConfig(settings.ads);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch advertising settings, maintaining default state:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    // 1. Remove legacy superseded scripts if present in DOM
    const oldPopunder = document.getElementById(LEGACY_POPUNDER_SCRIPT_ID);
    if (oldPopunder) oldPopunder.remove();
    const oldSocialBar = document.getElementById(LEGACY_SOCIAL_BAR_SCRIPT_ID);
    if (oldSocialBar) oldSocialBar.remove();

    // 2. Manage Popunder Script (Load once globally)
    const existingPopunder = document.getElementById(POPUNDER_SCRIPT_ID);
    if (adsConfig.popunder) {
      if (!existingPopunder && !hasPopunderInitialized) {
        hasPopunderInitialized = true;
        const script = document.createElement('script');
        script.id = POPUNDER_SCRIPT_ID;
        script.src = POPUNDER_SCRIPT_URL;
        script.type = 'text/javascript';
        script.async = true;
        script.onerror = (e) => {
          console.warn('Popunder ad script load failed or was blocked:', e);
        };
        document.body.appendChild(script);
      }
    } else if (existingPopunder) {
      existingPopunder.remove();
      hasPopunderInitialized = false;
    }

    // 3. Manage Social Bar Script (Load once globally, no duplicate floating bar created)
    const existingSocialBar = document.getElementById(SOCIAL_BAR_SCRIPT_ID);
    if (adsConfig.socialBar) {
      if (!existingSocialBar && !hasSocialBarInitialized) {
        hasSocialBarInitialized = true;
        const script = document.createElement('script');
        script.id = SOCIAL_BAR_SCRIPT_ID;
        script.src = SOCIAL_BAR_SCRIPT_URL;
        script.type = 'text/javascript';
        script.async = true;
        script.onerror = (e) => {
          console.warn('Social Bar ad script load failed or was blocked:', e);
        };
        document.body.appendChild(script);
      }
    } else if (existingSocialBar) {
      existingSocialBar.remove();
      hasSocialBarInitialized = false;
    }
  }, [adsConfig]);

  return null;
};
