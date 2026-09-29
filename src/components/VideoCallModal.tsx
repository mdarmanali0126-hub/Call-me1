import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Camera,
  CameraOff,
  PhoneOff,
  Maximize2,
  Minimize2,
  Play,
  ShieldAlert,
  Sparkles,
  Phone,
  RefreshCw,
  Clock,
  ArrowRight,
  VideoOff
} from 'lucide-react';
import { Profile, DEFAULT_AVATAR_PLACEHOLDER } from '../types';
import { logEvent } from '../lib/analytics';

interface VideoCallModalProps {
  profile: Profile;
  isOpen: boolean;
  onClose: () => void;
  onOpenContact?: (profile: Profile) => void;
  onCallCompleted?: () => void;
}

type CameraPermissionState =
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'unsupported'
  | 'in_use'
  | 'not_found'
  | 'error';

type CallPhase = 'permission' | 'connecting' | 'active' | 'ended';

const CALL_DURATION_LIMIT_SECONDS = 10;
const CONNECTING_DURATION_MS = 2500; // 2.5 seconds connecting preview

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  profile,
  isOpen,
  onClose,
  onOpenContact,
  onCallCompleted,
}) => {
  const [callPhase, setCallPhase] = useState<CallPhase>('permission');
  const [cameraState, setCameraState] = useState<CameraPermissionState>('requesting');
  const [cameraErrorMessage, setCameraErrorMessage] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [videoPlaybackError, setVideoPlaybackError] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(CALL_DURATION_LIMIT_SECONDS);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasRecordedCompletionRef = useRef<boolean>(false);

  // Stop camera tracks safely
  const stopCameraStream = () => {
    if (localStreamRef.current) {
      try {
        localStreamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      } catch (err) {
        console.error('Error stopping camera tracks:', err);
      }
      localStreamRef.current = null;
    }
  };

  // Start transition to connecting state and then active call
  const startConnectingTransition = (hasLocalStream: boolean) => {
    setCallPhase('connecting');
    if (connectingTimerRef.current) {
      clearTimeout(connectingTimerRef.current);
    }

    connectingTimerRef.current = setTimeout(() => {
      setCallPhase('active');
      setSecondsRemaining(CALL_DURATION_LIMIT_SECONDS);

      // Attach local stream if one exists
      if (hasLocalStream && localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
        localVideoRef.current.play().catch((err) => {
          console.warn('Local video play notice:', err);
        });
      }
    }, CONNECTING_DURATION_MS);
  };

  // Request browser camera preview (video only, NO audio)
  const requestCamera = async () => {
    setCameraState('requesting');
    setCameraErrorMessage('');

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState('unsupported');
      setCameraErrorMessage('Camera preview is not supported by this browser. You can still preview the simulated video call.');
      setCallPhase('permission');
      return;
    }

    try {
      // Strictly request video ONLY. No audio/microphone permission is requested.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      localStreamRef.current = stream;
      setCameraState('granted');
      setIsCameraActive(true);

      // Transition to Connecting state for 2.5 seconds with live stream
      startConnectingTransition(true);
    } catch (err: any) {
      console.warn('Camera access result:', err);
      const errName = err?.name || '';
      const errMsg = String(err?.message || '').toLowerCase();

      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setCameraState('denied');
        setCameraErrorMessage('Camera access was denied. You can try again or continue without your camera preview.');
      } else if (
        errName === 'NotFoundError' ||
        errName === 'DevicesNotFoundError' ||
        errName === 'OverconstrainedError' ||
        errMsg.includes('device not found') ||
        errMsg.includes('not found') ||
        errMsg.includes('could not start video source')
      ) {
        setCameraState('not_found');
        setCameraErrorMessage('No camera was detected on this device. You can still preview the simulated video call.');
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        setCameraState('in_use');
        setCameraErrorMessage('Camera is currently being used by another application. You can close other camera apps or continue without camera.');
      } else {
        setCameraState('error');
        setCameraErrorMessage('Could not access camera preview. You can still preview the simulated video call.');
      }

      setCallPhase('permission');
    }
  };

  // Continue without camera feed (for no-camera devices, AI Studio preview, or denied permissions)
  const handleContinueWithoutCamera = () => {
    setIsCameraActive(false);
    startConnectingTransition(false);
  };

  // Active call 10-second countdown lifecycle
  useEffect(() => {
    if (callPhase === 'active') {
      logEvent('video_call_active_start', 'CallMe', profile.slug);

      // Attach stream to local preview if available
      if (localStreamRef.current && localVideoRef.current && isCameraActive) {
        localVideoRef.current.srcObject = localStreamRef.current;
        localVideoRef.current.play().catch(() => {});
      }

      // 10-second countdown
      countdownTimerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            // Automatically complete call at 10 seconds!
            handleCallComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
      };
    }
  }, [callPhase, profile.slug, isCameraActive]);

  // Handle call completion (timeout or manual end while active)
  const handleCallComplete = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (connectingTimerRef.current) {
      clearTimeout(connectingTimerRef.current);
      connectingTimerRef.current = null;
    }

    // Stop streams
    stopCameraStream();

    if (remoteVideoRef.current) {
      try {
        remoteVideoRef.current.pause();
      } catch (e) {}
    }

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    // Consume call count only if active call was reached and not already counted
    if (!hasRecordedCompletionRef.current) {
      hasRecordedCompletionRef.current = true;
      if (onCallCompleted) {
        onCallCompleted();
      }
    }

    setCallPhase('ended');
    onClose();
  };

  // Manual End Call (or close during active call)
  const handleManualEndCall = () => {
    if (callPhase === 'active') {
      handleCallComplete();
    } else {
      // User closed before call started -> do not consume call count
      stopCameraStream();
      if (connectingTimerRef.current) {
        clearTimeout(connectingTimerRef.current);
        connectingTimerRef.current = null;
      }
      onClose();
    }
  };

  // Modal open/close lifecycle
  useEffect(() => {
    if (isOpen) {
      hasRecordedCompletionRef.current = false;
      setCallPhase('permission');
      setVideoPlaybackError(false);
      setIsVideoPlaying(false);
      setSecondsRemaining(CALL_DURATION_LIMIT_SECONDS);
      logEvent('video_call_open', 'CallMe', profile.slug);

      requestCamera();

      const handleBeforeUnload = () => {
        stopCameraStream();
      };
      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    } else {
      stopCameraStream();
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      if (connectingTimerRef.current) {
        clearTimeout(connectingTimerRef.current);
        connectingTimerRef.current = null;
      }
    }
  }, [isOpen, profile.slug]);

  // Unmount cleanup
  useEffect(() => {
    return () => {
      stopCameraStream();
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
      if (connectingTimerRef.current) {
        clearTimeout(connectingTimerRef.current);
      }
    };
  }, []);

  // Keyboard Escape listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleManualEndCall();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, callPhase]);

  // Toggle local camera preview on/off
  const handleToggleCamera = () => {
    if (!localStreamRef.current) {
      setIsCameraActive(!isCameraActive);
      return;
    }
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      const nextActive = !videoTrack.enabled;
      videoTrack.enabled = nextActive;
      setIsCameraActive(nextActive);
    }
  };

  // Fullscreen toggle
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Manual tap-to-play if autoplay was blocked
  const handlePlayRemoteVideo = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.play().then(() => {
        setIsVideoPlaying(true);
      }).catch((err) => {
        console.warn('Manual play failed:', err);
        setVideoPlaybackError(true);
      });
    }
  };

  // Format countdown string 00:SS
  const formatCountdown = (seconds: number) => {
    return `00:${seconds.toString().padStart(2, '0')}`;
  };

  const hasConfiguredVideo = !!(profile.callVideoUrl && profile.callVideoUrl.trim() !== '');

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Video Call Preview with ${profile.fullName}`}
          className="fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-4 bg-black/95 backdrop-blur-md"
        >
          {/* Ambient Glow */}
          <div
            className="absolute inset-0 pointer-events-none opacity-25 blur-3xl"
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(244, 63, 94, 0.28) 0%, rgba(0, 0, 0, 0.95) 80%)',
            }}
          />

          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="relative w-full h-full sm:h-[92vh] sm:max-w-4xl bg-black rounded-none sm:rounded-3xl shadow-[0_0_60px_rgba(244,63,94,0.25)] border-0 sm:border border-white/10 sm:border-pink-500/25 flex flex-col overflow-hidden text-white"
          >
            {/* Top Bar / Header */}
            <div className="absolute top-0 inset-x-0 z-30 p-4 sm:p-5 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between">
              {/* Profile details */}
              <div className="flex items-center gap-3">
                <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 shrink-0">
                  <img
                    src={profile.image || DEFAULT_AVATAR_PLACEHOLDER}
                    alt={profile.fullName}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover border-2 border-black"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-black" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base font-serif-luxury leading-tight truncate">
                    {profile.fullName}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="text-pink-400 font-medium">Video Call Preview</span>
                    {callPhase === 'active' && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-pink-300 font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatCountdown(secondsRemaining)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Center subtle label: Video Call Preview */}
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/75 border border-pink-500/40 text-pink-300 text-[11px] font-semibold tracking-wider uppercase backdrop-blur-md shadow-xs select-none">
                <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
                <span>Video Call Preview</span>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleManualEndCall}
                className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="End & Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Stage */}
            <div className="relative flex-1 w-full h-full bg-zinc-950 flex items-center justify-center overflow-hidden">
              {/* 1. CONNECTING STATE SCREEN */}
              {callPhase === 'connecting' && (
                <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center bg-radial from-zinc-900 to-black z-20 space-y-6">
                  {/* Subtle portrait background */}
                  <img
                    src={profile.image || DEFAULT_AVATAR_PLACEHOLDER}
                    alt={profile.fullName}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover opacity-15 filter blur-2xl"
                  />

                  {/* Profile Avatar with pulsing ring */}
                  <div className="relative z-10">
                    <div className="relative inline-block p-1 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 shadow-[0_0_35px_rgba(244,63,94,0.35)]">
                      <img
                        src={profile.image || DEFAULT_AVATAR_PLACEHOLDER}
                        alt={profile.fullName}
                        referrerPolicy="no-referrer"
                        className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-black"
                      />
                      <span className="absolute bottom-1 right-2 w-5 h-5 rounded-full bg-emerald-500 border-2 border-black" />
                    </div>
                  </div>

                  {/* Connecting Label & Animated Dots */}
                  <div className="relative z-10 space-y-3">
                    <h4 className="text-2xl sm:text-3xl font-bold font-serif-luxury text-white">
                      Connecting...
                    </h4>
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-bounce" />
                    </div>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      Video Call Preview with {profile.fullName}
                    </p>
                  </div>
                </div>
              )}

              {/* 2. ACTIVE CALL SCREEN */}
              {callPhase === 'active' && (
                <>
                  {hasConfiguredVideo && !videoPlaybackError ? (
                    <>
                      <video
                        ref={remoteVideoRef}
                        src={profile.callVideoUrl}
                        autoPlay
                        playsInline
                        loop
                        onPlay={() => setIsVideoPlaying(true)}
                        onError={() => setVideoPlaybackError(true)}
                        className="w-full h-full object-cover"
                      />

                      {/* Manual tap to play overlay if autoplay was blocked */}
                      {!isVideoPlaying && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-10 space-y-3">
                          <button
                            type="button"
                            onClick={handlePlayRemoteVideo}
                            className="p-5 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-xl shadow-rose-950/50 transform hover:scale-105 active:scale-95 transition-all cursor-pointer"
                          >
                            <Play className="w-8 h-8 fill-white ml-1" />
                          </button>
                          <p className="text-sm font-semibold text-white">Tap to Start Video Call</p>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Fallback View when profile has no MP4 URL or video fails */
                    <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center bg-radial from-zinc-900 to-black">
                      <img
                        src={profile.image || DEFAULT_AVATAR_PLACEHOLDER}
                        alt={profile.fullName}
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover opacity-20 filter blur-xl"
                      />

                      <div className="relative z-10 max-w-md space-y-4">
                        <div className="relative inline-block p-1 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 shadow-xl shadow-rose-950/40">
                          <img
                            src={profile.image || DEFAULT_AVATAR_PLACEHOLDER}
                            alt={profile.fullName}
                            referrerPolicy="no-referrer"
                            className="w-24 h-24 rounded-full object-cover border-4 border-black"
                          />
                          <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-black" />
                        </div>

                        <div>
                          <h4 className="text-xl font-bold font-serif-luxury text-white">
                            {profile.fullName}
                          </h4>
                          <p className="text-xs text-pink-400 font-medium mt-0.5">
                            {videoPlaybackError
                              ? 'Configured video link could not be loaded'
                              : 'Video Call Preview Unavailable'}
                          </p>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                          {videoPlaybackError
                            ? 'The configured MP4 URL for this profile encountered a playback error.'
                            : 'This profile does not have a simulated test video URL uploaded yet.'}
                        </p>

                        {onOpenContact && (
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                handleManualEndCall();
                                onOpenContact(profile);
                              }}
                              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:via-pink-600 hover:to-rose-700 text-white text-xs font-bold shadow-md shadow-rose-950/30 inline-flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                            >
                              <Phone className="w-3.5 h-3.5 fill-white text-white" />
                              <span>View Direct Contact Channels</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Floating Visitor Camera Preview (Corner window) */}
                  <div className="absolute bottom-24 right-4 sm:bottom-24 sm:right-6 z-20 w-28 h-36 sm:w-36 sm:h-48 rounded-2xl overflow-hidden shadow-2xl border-2 border-pink-500/80 bg-zinc-950 flex items-center justify-center select-none">
                    {cameraState === 'granted' && isCameraActive && localStreamRef.current ? (
                      <>
                        <video
                          ref={localVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover -scale-x-100"
                        />
                        <div className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[10px] font-semibold text-white flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>You</span>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-zinc-900/95 text-slate-400 space-y-1.5 border border-white/5">
                        <div className="p-2 rounded-full bg-zinc-800 text-pink-400">
                          <CameraOff className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <span className="text-[10px] font-semibold text-slate-200">
                          {cameraState === 'not_found' || cameraState === 'unsupported'
                            ? 'Camera Unavailable'
                            : 'Camera Off'}
                        </span>
                        <span className="text-[9px] text-slate-500">Your Preview</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* 3. CAMERA PERMISSION / DEVICE AVAILABILITY NOTICE (Polished Non-Fatal State) */}
              {callPhase === 'permission' && cameraState !== 'granted' && cameraState !== 'requesting' && (
                <div className="relative z-30 max-w-md w-full mx-4 p-6 sm:p-7 rounded-3xl bg-zinc-950/95 border border-pink-500/30 shadow-[0_0_50px_rgba(244,63,94,0.22)] backdrop-blur-xl text-center space-y-5">
                  <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center mx-auto">
                    {cameraState === 'not_found' || cameraState === 'unsupported' ? (
                      <VideoOff className="w-7 h-7" />
                    ) : (
                      <ShieldAlert className="w-7 h-7" />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <h5 className="text-lg font-bold font-serif-luxury text-white">
                      {cameraState === 'not_found' || cameraState === 'unsupported'
                        ? 'Camera Unavailable'
                        : cameraState === 'denied'
                        ? 'Camera Access Denied'
                        : cameraState === 'in_use'
                        ? 'Camera In Use'
                        : 'Camera Notice'}
                    </h5>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xs mx-auto">
                      {cameraErrorMessage}
                    </p>
                  </div>

                  <div className="space-y-2 pt-1">
                    {/* Primary action: Continue Without Camera */}
                    <button
                      type="button"
                      onClick={handleContinueWithoutCamera}
                      className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:via-pink-600 hover:to-rose-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-950/30 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                    >
                      <span>Continue Without Camera</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    {/* Secondary action: Try Again if denied or in use */}
                    {(cameraState === 'denied' || cameraState === 'in_use') && (
                      <button
                        type="button"
                        onClick={requestCamera}
                        className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-slate-200 hover:text-white border border-white/10 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Try Again</span>
                      </button>
                    )}

                    {/* Close action */}
                    <button
                      type="button"
                      onClick={handleManualEndCall}
                      className="w-full py-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Floating Call Controls */}
            {callPhase === 'active' && (
              <div className="absolute bottom-0 inset-x-0 z-30 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex flex-col items-center gap-2.5">
                <div className="bg-zinc-950/90 backdrop-blur-md border border-white/10 px-5 sm:px-7 py-3 rounded-full flex items-center gap-4 sm:gap-6 shadow-2xl">
                  {/* Camera Toggle Button */}
                  <button
                    type="button"
                    onClick={handleToggleCamera}
                    className={`p-3 rounded-full transition-all cursor-pointer ${
                      isCameraActive && localStreamRef.current
                        ? 'bg-zinc-800 hover:bg-zinc-700 text-white'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                    title={
                      !localStreamRef.current
                        ? 'Camera not connected'
                        : isCameraActive
                        ? 'Turn Camera Off'
                        : 'Turn Camera On'
                    }
                  >
                    {isCameraActive && localStreamRef.current ? (
                      <Camera className="w-5 h-5" />
                    ) : (
                      <CameraOff className="w-5 h-5" />
                    )}
                  </button>

                  {/* End Call Button */}
                  <button
                    type="button"
                    onClick={handleManualEndCall}
                    className="w-13 h-13 rounded-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white flex items-center justify-center shadow-lg shadow-rose-900/50 transform active:scale-95 transition-all cursor-pointer"
                    title="End Video Call"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </button>

                  {/* Fullscreen Toggle */}
                  <button
                    type="button"
                    onClick={handleToggleFullscreen}
                    className="p-3 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white transition-all cursor-pointer"
                    title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                  >
                    {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </button>
                </div>

                {/* Subtle countdown badge on mobile and desktop */}
                <div className="flex items-center gap-2 text-[11px] text-pink-300 font-medium select-none bg-black/60 px-3 py-1 rounded-full border border-pink-500/20 backdrop-blur-xs">
                  <Clock className="w-3 h-3 text-pink-400" />
                  <span>Auto-ends in {secondsRemaining}s • Video Call Preview</span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
