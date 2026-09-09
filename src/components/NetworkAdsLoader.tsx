import React, { useEffect, useState } from 'react';
import { fetchPublicAdvertising } from '../lib/api';
import { NetworkAdSettings } from '../types';

const POPUNDER_SCRIPT_URL = 'https://pl31254996.profitableratecpmnetwork.com/85/c9/37/85c937c32293ccdcbc00ae56ab8c5b85.js';
const SOCIAL_BAR_SCRIPT_URL = 'https://pl31254997.profitableratecpmnetwork.com/e9/88/2f/e9882fe202f2bd97d337f8b65ebfb087.js';

const POPUNDER_SCRIPT_ID = 'adsterra-popunder-script';
const SOCIAL_BAR_SCRIPT_ID = 'adsterra-socialbar-script';

/**
 * NetworkAdsLoader handles independent loading and execution
 * of global network ads (Popunder and Social Bar) based on admin configuration.
 *
 * It guarantees:
 * 1. Zero duplicate script injections across route transitions and re-renders.
 * 2. Complete non-execution / DOM removal when disabled.
 * 3. Minimal single cached fetch to avoid unnecessary Firestore/network reads.
 */
export const NetworkAdsLoader: React.FC = () => {
  const [adsConfig, setAdsConfig] = useState<NetworkAdSettings | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchPublicAdvertising().then((settings) => {
      if (isMounted && settings?.ads) {
        setAdsConfig(settings.ads);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!adsConfig) return;

    // 1. Manage Popunder Script
    const existingPopunder = document.getElementById(POPUNDER_SCRIPT_ID);
    if (adsConfig.popunder) {
      if (!existingPopunder) {
        const script = document.createElement('script');
        script.id = POPUNDER_SCRIPT_ID;
        script.src = POPUNDER_SCRIPT_URL;
        script.type = 'text/javascript';
        script.async = true;
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
        document.body.appendChild(script);
      }
    } else if (existingSocialBar) {
      existingSocialBar.remove();
    }
  }, [adsConfig]);

  return null;
};
