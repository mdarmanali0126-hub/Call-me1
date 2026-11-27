import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  logPageView,
  logReturningVisitor,
  logScrollDepth,
  ScrollPageType,
} from '../lib/analytics';

const SCROLL_MILESTONES: Array<25 | 50 | 75 | 90> = [25, 50, 75, 90];

export function AnalyticsTracker() {
  const location = useLocation();

  // Detect and track returning visitors once per session
  useEffect(() => {
    logReturningVisitor();
  }, []);

  // Send a single GA4 pageview per route change
  useEffect(() => {
    logPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);

  // Track scroll depth milestones (25%, 50%, 75%, 90%) on homepage and profile pages
  useEffect(() => {
    let pageType: ScrollPageType | null = null;
    if (location.pathname === '/') {
      pageType = 'home';
    } else if (location.pathname.startsWith('/profile/')) {
      pageType = 'profile';
    }

    if (!pageType || typeof window === 'undefined') return;

    const triggeredMilestones = new Set<number>();
    let rafId: number | null = null;

    const checkScrollDepth = () => {
      rafId = null;
      const docEl = document.documentElement;
      const scrollableHeight = docEl.scrollHeight - window.innerHeight;
      if (scrollableHeight <= 0) return;

      const currentPercent = Math.min(
        100,
        Math.round((window.scrollY / scrollableHeight) * 100)
      );

      for (const milestone of SCROLL_MILESTONES) {
        if (currentPercent >= milestone && !triggeredMilestones.has(milestone)) {
          triggeredMilestones.add(milestone);
          logScrollDepth({
            pageType,
            percentScrolled: milestone,
          });
        }
      }
    };

    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(checkScrollDepth);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [location.pathname]);

  return null;
}
