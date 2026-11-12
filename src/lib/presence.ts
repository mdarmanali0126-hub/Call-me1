import { useState, useEffect } from 'react';
import { Profile } from '../types';

// Unique client identifier per browser session
function getOrCreateClientId(): string {
  try {
    let id = sessionStorage.getItem('callme_presence_cid');
    if (!id) {
      id = 'client_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
      sessionStorage.setItem('callme_presence_cid', id);
    }
    return id;
  } catch {
    return 'client_' + Math.random().toString(36).substring(2, 11);
  }
}

class PresenceManager {
  private clientId: string;
  private currentProfileId: string | null = null;
  private onlineProfiles = new Set<string>();
  private listeners = new Set<(onlineIds: Set<string>) => void>();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private isInitialized = false;

  constructor() {
    this.clientId = getOrCreateClientId();
  }

  public init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // Send initial heartbeat
    this.sendHeartbeat();

    // Fetch initial presence list
    this.fetchOnlineStatus();

    // Setup periodic heartbeat every 20s
    this.heartbeatInterval = setInterval(() => {
      if (!document.hidden) {
        this.sendHeartbeat();
      }
    }, 20000);

    // Setup polling for online candidates every 15s
    this.pollInterval = setInterval(() => {
      if (!document.hidden) {
        this.fetchOnlineStatus();
      }
    }, 15000);

    // Window events for active session & disconnect handling
    window.addEventListener('focus', () => {
      this.sendHeartbeat();
      this.fetchOnlineStatus();
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.sendHeartbeat();
        this.fetchOnlineStatus();
      }
    });

    // Send leave signal on tab close / unload
    const handleLeave = () => {
      try {
        const payload = JSON.stringify({ clientId: this.clientId });
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/presence/leave', payload);
        } else {
          fetch('/api/presence/leave', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true
          }).catch(() => {});
        }
      } catch {}
    };

    window.addEventListener('beforeunload', handleLeave);
    window.addEventListener('pagehide', handleLeave);
  }

  public setActiveProfile(profileId: string | null) {
    this.currentProfileId = profileId;
    this.sendHeartbeat();
  }

  public subscribe(callback: (onlineIds: Set<string>) => void): () => void {
    this.listeners.add(callback);
    callback(this.onlineProfiles);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      try {
        listener(new Set(this.onlineProfiles));
      } catch (e) {
        console.error('Presence listener error:', e);
      }
    }
  }

  private async sendHeartbeat() {
    try {
      await fetch('/api/presence/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: this.clientId,
          profileId: this.currentProfileId || undefined
        })
      });
    } catch {
      // Quiet fail on network hiccup
    }
  }

  private async fetchOnlineStatus() {
    try {
      const res = await fetch('/api/presence');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.onlineProfileIds)) {
          this.onlineProfiles = new Set(data.onlineProfileIds);
          this.notify();
        }
      }
    } catch {
      // Quiet fail
    }
  }

  public isProfileOnline(profileIdOrSlug: string, profileObj?: Profile | null): boolean {
    if (!profileIdOrSlug) return false;
    // Check if directly in real-time presence list
    if (this.onlineProfiles.has(profileIdOrSlug)) return true;
    if (profileObj) {
      if (profileObj.id && this.onlineProfiles.has(profileObj.id)) return true;
      if (profileObj.slug && this.onlineProfiles.has(profileObj.slug)) return true;
      // If profile record itself has verified isOnline flag
      if (profileObj.isOnline === true) return true;
    }
    return false;
  }
}

export const presenceManager = new PresenceManager();

// Automatically start presence tracking on client
if (typeof window !== 'undefined') {
  presenceManager.init();
}

/**
 * React Hook for component presence tracking
 */
export function useOnlinePresence(targetProfile?: Profile | null) {
  const [onlineSet, setOnlineSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    return presenceManager.subscribe((set) => {
      setOnlineSet(set);
    });
  }, []);

  useEffect(() => {
    if (targetProfile?.id) {
      presenceManager.setActiveProfile(targetProfile.id);
      return () => {
        presenceManager.setActiveProfile(null);
      };
    }
  }, [targetProfile?.id]);

  const checkIsOnline = (profile: Profile | string | undefined | null): boolean => {
    if (!profile) return false;
    if (typeof profile === 'string') {
      return presenceManager.isProfileOnline(profile);
    }
    return presenceManager.isProfileOnline(profile.id || profile.slug, profile);
  };

  return {
    onlineIds: onlineSet,
    isOnline: targetProfile ? checkIsOnline(targetProfile) : false,
    checkIsOnline,
    setActiveProfile: (id: string | null) => presenceManager.setActiveProfile(id)
  };
}
