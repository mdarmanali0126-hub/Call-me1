import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { logPageView } from '../lib/analytics';

export function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    // Send a pageview event whenever the route changes
    logPageView(location.pathname + location.search);
  }, [location]);

  return null;
}
