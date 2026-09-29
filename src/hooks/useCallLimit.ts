import { useState, useEffect, useCallback } from 'react';
import {
  getCallUsage,
  recordCallCompleted,
  resetAllowanceAfterAd,
  CallUsageState,
} from '../lib/callLimit';

export const useCallLimit = () => {
  const [usage, setUsage] = useState<CallUsageState>(getCallUsage);

  useEffect(() => {
    // Initial sync
    setUsage(getCallUsage());

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<CallUsageState>;
      if (customEvent.detail) {
        setUsage(customEvent.detail);
      } else {
        setUsage(getCallUsage());
      }
    };

    window.addEventListener('call_me_usage_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('call_me_usage_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const consumeCall = useCallback(() => {
    return recordCallCompleted();
  }, []);

  const grantAdReward = useCallback(() => {
    return resetAllowanceAfterAd();
  }, []);

  return {
    callsUsed: usage.callsUsed,
    callsRemaining: usage.callsRemaining,
    hasCompletedFirstAd: usage.hasCompletedFirstAd,
    canCall: usage.callsRemaining > 0,
    consumeCall,
    grantAdReward,
  };
};
