// Call Me — Simulated Video Call Usage & Limit Management
// Stores local test call counts in browser localStorage (no sensitive data).

const STORAGE_KEY = 'call_me_usage_v1';
const INITIAL_CALL_ALLOWANCE = 3;
const POST_AD_CALL_ALLOWANCE = 5;

export interface CallUsageState {
  callsUsed: number;
  callsRemaining: number;
  hasCompletedFirstAd: boolean;
  totalCallsCompleted: number;
}

const DEFAULT_STATE: CallUsageState = {
  callsUsed: 0,
  callsRemaining: INITIAL_CALL_ALLOWANCE,
  hasCompletedFirstAd: false,
  totalCallsCompleted: 0,
};

// Dispatch custom event so all mounted components stay in sync
const dispatchUsageChange = (state: CallUsageState) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('call_me_usage_updated', { detail: state }));
  }
};

export const getCallUsage = (): CallUsageState => {
  if (typeof window === 'undefined') return DEFAULT_STATE;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STATE));
      return DEFAULT_STATE;
    }
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.callsRemaining === 'number' &&
      typeof parsed?.callsUsed === 'number'
    ) {
      return {
        callsUsed: Math.max(0, parsed.callsUsed),
        callsRemaining: Math.max(0, parsed.callsRemaining),
        hasCompletedFirstAd: !!parsed.hasCompletedFirstAd,
        totalCallsCompleted: typeof parsed.totalCallsCompleted === 'number' ? parsed.totalCallsCompleted : parsed.callsUsed,
      };
    }
  } catch (err) {
    console.warn('Failed to read call usage from localStorage:', err);
  }

  return DEFAULT_STATE;
};

export const canMakeCall = (): boolean => {
  const usage = getCallUsage();
  return usage.callsRemaining > 0;
};

export const recordCallCompleted = (): CallUsageState => {
  const current = getCallUsage();
  const nextRemaining = Math.max(0, current.callsRemaining - 1);
  const nextUsed = current.callsUsed + 1;
  const nextTotal = current.totalCallsCompleted + 1;

  const nextState: CallUsageState = {
    ...current,
    callsUsed: nextUsed,
    callsRemaining: nextRemaining,
    totalCallsCompleted: nextTotal,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  } catch (err) {
    console.warn('Failed to save call usage:', err);
  }

  dispatchUsageChange(nextState);
  return nextState;
};

export const resetAllowanceAfterAd = (): CallUsageState => {
  const current = getCallUsage();
  const nextState: CallUsageState = {
    ...current,
    callsUsed: 0,
    callsRemaining: POST_AD_CALL_ALLOWANCE,
    hasCompletedFirstAd: true,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  } catch (err) {
    console.warn('Failed to reset call allowance:', err);
  }

  dispatchUsageChange(nextState);
  return nextState;
};
