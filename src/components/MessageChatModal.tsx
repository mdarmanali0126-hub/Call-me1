import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Sparkles, ArrowRight, ShieldCheck, MapPin, Video } from 'lucide-react';
import { Profile, DEFAULT_AVATAR_PLACEHOLDER } from '../types';
import { logEvent } from '../lib/analytics';
import { VideoCallModal } from './VideoCallModal';
import { CallLimitModal } from './CallLimitModal';
import { AdInterstitialModal } from './AdInterstitialModal';
import { useCallLimit } from '../hooks/useCallLimit';

interface ChatMessage {
  id: string;
  sender: 'user' | 'profile';
  text: string;
  timestamp: string;
  isAutomated?: boolean;
  showCta?: boolean;
}

interface MessageChatModalProps {
  profile: Profile;
  isOpen: boolean;
  onClose: () => void;
}

const AUTOMATED_RESPONSES = [
  "Hi 😊 Thank you for your message. I’ve already found my life partner. Please feel free to explore other profiles. You might find someone special there. ❤️",
  "Thank you for reaching out! I’ve already found the person I was looking for. I hope you find someone special here too. ❤️",
  "Thanks for your message 😊 My journey here has already led me to my life partner. Please feel free to discover other profiles.",
  "Thank you for stopping by. I’ve already found my life partner. I wish you the best in finding your match. ❤️",
];

const FOLLOWUP_RESPONSE = "I hope you find the right person here. ❤️\nExplore more profiles to continue your journey.";

/**
 * Deterministically picks a response based on the candidate's ID or slug.
 * Ensures consistent, predictable responses per profile while offering natural variety.
 */
function getDeterministicResponse(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % AUTOMATED_RESPONSES.length;
  return AUTOMATED_RESPONSES[index];
}

export const MessageChatModal: React.FC<MessageChatModalProps> = ({
  profile,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userMessageCount, setUserMessageCount] = useState(0);

  // Call Limit & Video Call States (Shares same global call-limit counter)
  const { callsUsed, canCall, consumeCall } = useCallLimit();
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [isAdInterstitialOpen, setIsAdInterstitialOpen] = useState(false);

  // Initialize with the standard automated welcome message
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      sender: 'profile',
      text: "Hi! Thanks for reaching out. Feel free to leave a message here. ❤️",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAutomated: true,
      showCta: false,
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset or initialize state when opening a new profile chat
  useEffect(() => {
    if (isOpen) {
      setUserMessageCount(0);
      setIsTyping(false);
      setMessages([
        {
          id: `welcome-${profile.id}`,
          sender: 'profile',
          text: "Hi! Thanks for reaching out. Feel free to leave a message here. ❤️",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isAutomated: true,
          showCta: false,
        },
      ]);
      logEvent('chat_open', 'Chat', profile.slug);

      // Auto-focus input after modal transition
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, profile.id, profile.slug]);

  // Clean up any pending typing timers on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, []);

  // Keyboard Escape handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Start Video Call from inside Chat (Respects global call limits)
  const handleStartCall = () => {
    if (!canCall) {
      setIsLimitModalOpen(true);
    } else {
      logEvent('chat_video_call_click', 'Chat', profile.slug);
      setIsVideoCallOpen(true);
    }
  };

  const handleAdInterstitialComplete = () => {
    setIsAdInterstitialOpen(false);
    setIsVideoCallOpen(true);
  };

  // Auto-scroll to bottom of messages container
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isTyping) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: time,
      isAutomated: false,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    logEvent('message_sent', 'Chat', profile.slug);

    const newCount = userMessageCount + 1;
    setUserMessageCount(newCount);

    // Show simulated typing indicator
    setIsTyping(true);

    // Realistic delay between 900ms - 1100ms
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);

      const replyText = newCount === 1
        ? getDeterministicResponse(profile.slug || profile.id)
        : FOLLOWUP_RESPONSE;

      const replyMsg: ChatMessage = {
        id: `reply-${Date.now()}`,
        sender: 'profile',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAutomated: true,
        showCta: true,
      };

      setMessages((prev) => [...prev, replyMsg]);
      logEvent('automated_reply_shown', 'Chat', profile.slug);
    }, 1000);
  };

  const handleExploreOtherProfiles = () => {
    logEvent('explore_profiles_click', 'Chat', profile.slug);
    onClose();
    navigate('/');
    setTimeout(() => {
      const browseSection = document.getElementById('featured') || document.querySelector('main');
      browseSection?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Message inquiry with ${profile.fullName}`}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          {/* Subtle Pink Ambient Glow */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30 blur-3xl"
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(244, 63, 94, 0.3) 0%, rgba(0, 0, 0, 0.9) 70%)',
            }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 25 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full sm:max-w-md bg-slate-950 text-white rounded-t-3xl sm:rounded-3xl shadow-[0_0_50px_rgba(244,63,94,0.22)] border border-white/10 sm:border-rose-500/25 flex flex-col h-[88vh] sm:h-[620px] max-h-[92vh] overflow-hidden z-10"
          >
            {/* Header: Reuses Active Stories & Profile Card visual language */}
            <div className="px-4 py-3.5 bg-black/95 text-white flex items-center justify-between border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {/* Profile Avatar with Pink Gradient Ring (Active Stories style) */}
                <div className="relative shrink-0 p-0.5 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400">
                  <img
                    src={profile.image || DEFAULT_AVATAR_PLACEHOLDER}
                    alt={profile.fullName}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover border-2 border-black"
                  />
                  {/* Active Status Dot */}
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-black" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-white text-base font-serif-luxury truncate">
                      {profile.fullName}
                    </h3>
                    {profile.verified !== false && (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                    <span className="text-pink-400 font-semibold">{profile.age} yrs</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400 truncate flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-rose-400 inline" />
                      {profile.city}, {profile.country}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Video Call + Close */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleStartCall}
                  className="px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:via-pink-600 hover:to-rose-700 text-white font-bold text-xs shadow-md shadow-rose-950/30 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                  title={`Call ${profile.fullName}`}
                  aria-label={`Start simulated video call with ${profile.fullName}`}
                >
                  <Video className="w-3.5 h-3.5 fill-white text-white" />
                  <span>Call</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 sm:p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Close message window"
                  title="Close (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Subtle Status Notice */}
            <div className="bg-slate-900/60 border-b border-white/5 px-4 py-1.5 flex items-center justify-between text-[11px] text-slate-400 shrink-0 select-none">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500" />
                </span>
                <span className="font-medium text-slate-300">Call Me Direct Inquiry</span>
              </div>
              <span className="text-[10px] text-pink-400/90 font-medium">Verified Portfolio</span>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-950 via-black to-slate-950">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  {/* Automated Response Subtle Indicator */}
                  {msg.isAutomated && (
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 mb-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[10px] font-semibold tracking-wider uppercase select-none">
                      <Sparkles className="w-2.5 h-2.5 text-pink-400" />
                      <span>Automated response</span>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 text-white rounded-br-xs font-medium shadow-rose-950/40'
                        : 'bg-zinc-900/95 border border-white/10 text-slate-100 rounded-bl-xs shadow-black/50'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>

                  {/* Timestamp */}
                  <span className="text-[10px] text-slate-500 mt-1 px-1">
                    {msg.timestamp}
                  </span>

                  {/* CTA Action: Explore Other Profiles */}
                  {msg.showCta && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="mt-3 pt-1 flex items-center gap-2"
                    >
                      <button
                        type="button"
                        onClick={handleExploreOtherProfiles}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:via-pink-600 hover:to-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-950/50 active:scale-95 transition-all cursor-pointer"
                      >
                        <span>Explore Other Profiles →</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-start"
                >
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 mb-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[10px] font-semibold tracking-wider uppercase select-none">
                    <Sparkles className="w-2.5 h-2.5 text-pink-400" />
                    <span>Automated response</span>
                  </div>
                  <div className="bg-zinc-900/95 border border-white/10 rounded-2xl rounded-bl-xs px-4 py-3 flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-bounce" />
                    <span className="text-[11px] text-slate-400 ml-1.5 font-medium">Typing…</span>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer: Dark Call Me theme with hot pink send button */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 sm:p-3.5 bg-black/95 border-t border-white/10 flex items-center gap-2 shrink-0"
            >
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Write a message..."
                  disabled={isTyping}
                  className="w-full pl-4 pr-3 py-2.5 sm:py-3 rounded-xl bg-zinc-900 border border-white/10 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:bg-zinc-900 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500/40 transition-all disabled:opacity-60"
                />
              </div>

              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                className="p-2.5 sm:px-4 sm:py-3 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 hover:from-rose-600 hover:via-pink-600 hover:to-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 shrink-0 cursor-pointer"
                aria-label="Send message"
                title="Send"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </motion.div>

          {/* Simulated Video Call Modal launched from Chat */}
          {isVideoCallOpen && (
            <VideoCallModal
              profile={profile}
              isOpen={isVideoCallOpen}
              onClose={() => setIsVideoCallOpen(false)}
              onCallCompleted={() => consumeCall()}
            />
          )}

          {/* Call Limit Reached Modal */}
          {isLimitModalOpen && (
            <CallLimitModal
              isOpen={isLimitModalOpen}
              callsUsed={callsUsed}
              onClose={() => setIsLimitModalOpen(false)}
              onWatchAd={() => {
                setIsLimitModalOpen(false);
                setIsAdInterstitialOpen(true);
              }}
            />
          )}

          {/* 10-Second Sponsor Ad Interstitial */}
          {isAdInterstitialOpen && (
            <AdInterstitialModal
              isOpen={isAdInterstitialOpen}
              onComplete={handleAdInterstitialComplete}
            />
          )}
        </div>
      )}
    </AnimatePresence>
  );
};
