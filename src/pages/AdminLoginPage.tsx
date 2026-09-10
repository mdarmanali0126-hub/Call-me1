import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Heart,
  Lock,
  Mail,
  Key,
  ShieldCheck,
  ArrowLeft,
  AlertCircle,
  LogOut,
  ArrowRight,
  HelpCircle,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  ExternalLink,
  Globe
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { parseAuthError, AuthErrorDetails } from '../lib/firestoreService';

export const AdminLoginPage: React.FC = () => {
  const { user, login, loginWithGoogle, logout, isAuthenticated, isAuthorizedAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/admin';

  const [email, setEmail] = useState('mdarmanali0126@gmail.com');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [errorDetails, setErrorDetails] = useState<AuthErrorDetails | null>(null);
  const [logoutMessage, setLogoutMessage] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsGoogleSubmitting(true);
    setErrorDetails(null);
    setLogoutMessage(null);

    try {
      const loggedUser = await loginWithGoogle();
      if (loggedUser.email?.toLowerCase() !== 'mdarmanali0126@gmail.com') {
        setErrorDetails({
          category: 'unauthorized',
          message: `Signed in as ${loggedUser.email}, but this account is not recognized as the authorized administrator. Please choose mdarmanali0126@gmail.com in the Google prompt.`,
          originalCode: 'auth/unauthorized-admin'
        });
        await logout();
        return;
      }
      navigate(redirectTarget);
    } catch (err: any) {
      console.error('Firebase Google Auth error:', err);
      const parsed = parseAuthError(err);
      setErrorDetails(parsed);
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorDetails({
        category: 'wrong_credentials',
        message: 'Please provide both administrator email and password.',
        originalCode: 'validation/empty-fields'
      });
      return;
    }

    setIsSubmitting(true);
    setErrorDetails(null);
    setLogoutMessage(null);

    try {
      await login(email.trim(), password);
      navigate(redirectTarget);
    } catch (err: any) {
      console.error('Firebase Auth error:', err);
      const parsed = parseAuthError(err);
      setErrorDetails(parsed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setLogoutMessage('You have been signed out of the administrator session.');
      setErrorDetails(null);
    } catch (err: any) {
      setErrorDetails({
        category: 'general',
        message: 'Failed to sign out: ' + (err.message || 'Unknown error'),
        originalCode: 'auth/logout-error'
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Public Directory</span>
        </Link>
        <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/80 px-3 py-1 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Google Authentication • Primary Admin Login</span>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md mx-auto my-8 bg-slate-950/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 via-amber-600 to-rose-500 mx-auto flex items-center justify-center shadow-lg shadow-rose-900/30">
            <Heart className="w-6 h-6 fill-white text-white" />
          </div>
          <h1 className="text-2xl font-bold font-serif-luxury text-white">Call Me Admin Portal</h1>
          <p className="text-xs text-slate-400">
            Primary 1-click Google administrator sign-in for{' '}
            <span className="text-rose-300 font-medium font-mono">mdarmanali0126@gmail.com</span>.
          </p>
        </div>

        {/* Feedback Messages */}
        {logoutMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-700/80 text-emerald-200 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{logoutMessage}</span>
          </div>
        )}

        {errorDetails && (
          <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block uppercase tracking-wider text-[10px] text-rose-300">
                  {errorDetails.category === 'wrong_credentials' && 'Invalid Credentials'}
                  {errorDetails.category === 'user_not_found' && 'Administrator Not Found'}
                  {errorDetails.category === 'unauthorized' && 'Unauthorized Access'}
                  {errorDetails.category === 'network' && 'Network Connection Error'}
                  {errorDetails.category === 'provider_disabled' && 'Provider Setup Required'}
                  {errorDetails.category === 'too_many_requests' && 'Account Temporarily Locked'}
                  {errorDetails.category === 'popup_blocked' && 'Browser Popup Blocked'}
                  {errorDetails.category === 'cancelled' && 'Authentication Cancelled'}
                  {errorDetails.category === 'unauthorized_domain' && 'Authorized Domain Required'}
                  {errorDetails.category === 'general' && 'Authentication Error'}
                </span>
                <p className="leading-relaxed">{errorDetails.message}</p>
              </div>
            </div>

            {errorDetails.category === 'unauthorized_domain' && (
              <div className="mt-2 pt-2 border-t border-rose-900/60 text-[11px] text-rose-300/95 leading-relaxed bg-rose-900/30 p-3 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-white">
                  <Globe className="w-3.5 h-3.5 text-amber-400" />
                  <span>How to authorize call-me1.vercel.app in Firebase:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-200">
                  <li>
                    Open{' '}
                    <a
                      href="https://console.firebase.google.com/project/lexical-layout-8pthm/authentication/settings"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-rose-300 hover:text-white underline font-medium inline-flex items-center gap-1"
                    >
                      Firebase Console &gt; Authentication &gt; Settings
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>Click the <strong>Authorized domains</strong> tab.</li>
                  <li>Click <strong>Add domain</strong>.</li>
                  <li>Enter exactly: <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300 font-mono font-bold">call-me1.vercel.app</code> (without https://).</li>
                  <li>Click <strong>Save</strong> / <strong>Done</strong>.</li>
                </ol>
              </div>
            )}

            {errorDetails.category === 'popup_blocked' && (
              <div className="mt-2 pt-2 border-t border-rose-900/60 text-[11px] text-rose-300/90 leading-relaxed bg-rose-900/20 p-2.5 rounded-xl">
                <p className="font-semibold text-white mb-1">Tip for browser popup blockers:</p>
                <p>Allow popups in your browser address bar or click the button again.</p>
              </div>
            )}
          </div>
        )}

        {/* Existing Active Session View */}
        {isAuthenticated && user ? (
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              {user.photoURL && user.photoURL.trim() !== '' ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Admin'}
                  className="w-10 h-10 rounded-full border border-rose-600 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-rose-900/60 border border-rose-700 flex items-center justify-center text-rose-300 font-bold text-sm">
                  {user.email?.charAt(0).toUpperCase() || 'A'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  {isAuthorizedAdmin ? 'Authorized Master Administrator' : 'Authenticated User'}
                </span>
                <p className="text-xs font-semibold text-white truncate">{user.email}</p>
                <p className="text-[10px] text-slate-500 font-mono">UID: {user.uid.slice(0, 14)}...</p>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              {isAuthorizedAdmin ? (
                <Link
                  to="/admin"
                  className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-950/50 flex items-center justify-center gap-2 transition-all"
                >
                  <span>Enter Admin Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleSubmitting}
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <span>Switch to mdarmanali0126@gmail.com</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-slate-700"
              >
                <LogOut className="w-4 h-4 text-slate-400" />
                <span>Log Out of Current Session</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* PRIMARY: GOOGLE SIGN-IN */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/80 shadow-inner space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Primary Sign-In</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                  Recommended
                </span>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleSubmitting || isSubmitting || authLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-900 text-xs font-bold shadow-lg shadow-white/5 flex items-center justify-center gap-3 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isGoogleSubmitting ? (
                  <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign In with Google (mdarmanali0126@gmail.com)</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>Instant 1-click access</span>
                <span className="text-emerald-400 font-medium">Automatic Admin Recognition</span>
              </div>
            </div>

            {/* SECONDARY / OPTIONAL: EMAIL & PASSWORD */}
            <div className="pt-1">
              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-slate-800 w-full" />
                <button
                  type="button"
                  onClick={() => setShowEmailForm(!showEmailForm)}
                  className="bg-slate-950 px-3 text-[11px] text-slate-400 hover:text-slate-200 font-medium tracking-wide flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <span>or use Email &amp; Password</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showEmailForm ? 'rotate-180' : ''}`} />
                </button>
                <div className="border-t border-slate-800 w-full" />
              </div>

              {showEmailForm && (
                <form onSubmit={handleEmailSubmit} className="space-y-3.5 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Administrator Email Address
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="mdarmanali0126@gmail.com"
                        required
                        autoComplete="email"
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Administrator Password
                    </label>
                    <div className="relative flex items-center">
                      <Key className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        autoComplete="current-password"
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || isGoogleSubmitting || authLoading}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Sign In with Email &amp; Password</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-slate-500 text-center">
                    Requires Email/Password provider enabled in Firebase Console.
                  </p>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="pt-4 border-t border-slate-800 space-y-2 text-slate-400 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Firebase Security Notice</span>
            </span>
            <span className="text-[10px] bg-slate-800 text-emerald-400 border border-emerald-900/50 px-2 py-0.5 rounded font-mono">
              Google Verified
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500">
            Google Authentication provides cryptographically signed OAuth identity tokens. No passwords need to be created or stored.
          </p>
        </div>
      </div>

      <div className="text-center text-xs text-slate-500">
        Call Me Matrimonial Platform • Protected by Firebase Authentication &amp; Firestore ABAC Rules
      </div>
    </div>
  );
};

