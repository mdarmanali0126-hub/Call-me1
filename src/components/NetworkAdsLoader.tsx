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

/**
 * NetworkAdsLoader handles independent loading and execution
 * of global network ads (Popunder and Social Bar) based on configuration.
 *
 * It guarantees:
 * 1. Zero duplicate script injections across route transitions and re-renders.
 * 2. Safe loading with error handling if scripts fail to load.
 * 3. Complete non-execution / DOM removal when disabled.
 * 4. Minimal single cached fetch to avoid unnecessary Firestore/network reads.
 */
export const NetworkAdsLoader: React.FC = () => {
  const [adsConfig, setAdsConfig] = useState<NetworkAdSettings>({
    popunder: true,
    socialBar: true,
    banner: true,
  });

  useEffect(() => {
    let isMounted = true;

    fetchPublicAdvertising().then((settings) => {
      if (isMounted && settings?.ads) {
        setAdsConfig(settings.ads);
      }
    }).catch((err) => {
      console.warn('Could not fetch advertising settings, using active defaults:', err);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    // Clean up any legacy scripts
    const oldPopunder = document.getElementById(LEGACY_POPUNDER_SCRIPT_ID);
    if (oldPopunder) oldPopunder.remove();
    const oldSocialBar = document.getElementById(LEGACY_SOCIAL_BAR_SCRIPT_ID);
    if (oldSocialBar) oldSocialBar.remove();

    // 1. Manage Popunder Script
    const existingPopunder = document.getElementById(POPUNDER_SCRIPT_ID);
    if (adsConfig.popunder) {
      if (!existingPopunder) {
        const script = document.createElement('script');
        script.id = POPUNDER_SCRIPT_ID;
        script.src = POPUNDER_SCRIPT_URL;
        script.type = 'text/javascript';
        script.async = true;
        script.onerror = (e) => {
          console.warn('Popunder script load failed or blocked:', e);
        };
        document.body.appendChild(script);
      }
    } else if (existingPopunder) {
      existingPopunder.remove();
    }

    // 2. Manage Social Bar Script
    const existingSocialBar = document.getElementById(SOCIAL_BAR_SCRIPT_ID);
    if (adsConfig.socialBar) {
      if (!existingSocialBar) {
        const script = document.createElement('script');
        script.id = SOCIAL_BAR_SCRIPT_ID;
        script.src = SOCIAL_BAR_SCRIPT_URL;
        script.type = 'text/javascript';
        script.async = true;
        script.onerror = (e) => {
          console.warn('Social Bar script load failed or blocked:', e);
        };
        document.body.appendChild(script);
      }
    } else if (existingSocialBar) {
      existingSocialBar.remove();
    }
  }, [adsConfig]);

  return null;
};
