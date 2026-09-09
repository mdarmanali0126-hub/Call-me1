import React, { useState } from 'react';
import {
  X,
  Phone,
  Mail,
  MessageCircle,
  Copy,
  Check,
  ShieldCheck,
  Instagram,
  Linkedin,
  Globe,
  ExternalLink
} from 'lucide-react';
import { Profile } from '../types';
import { trackTelemetry } from '../lib/api';

interface ContactModalProps {
  profile: Profile;
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ profile, isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const contact = profile.publicContact || {};

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleActionClick = (method: string) => {
    trackTelemetry({
      type: 'contact_click',
      profileSlug: profile.slug,
      metadata: { method, name: profile.fullName },
      timestamp: new Date().toISOString()
    });
  };

  const whatsappCleanNumber = contact.whatsapp ? contact.whatsapp.replace(/[^0-9]/g, '') : '';
  const prefilledWhatsAppMessage = encodeURIComponent(
    `Hello ${profile.fullName}, I viewed your matrimonial portfolio and personal proposal on Call Me. I would love to connect and introduce myself.`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-rose-600 via-rose-700 to-amber-700 text-white flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <img
              src={profile.image}
              alt={profile.fullName}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-2xl object-cover border-2 border-white/80 shadow-md"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xl font-bold font-serif-luxury">{profile.fullName}</h3>
                <ShieldCheck className="w-4 h-4 text-emerald-300 fill-emerald-400/20" />
              </div>
              <p className="text-xs text-rose-100 mt-0.5">{profile.profession} • {profile.city}, {profile.country}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200/70 text-xs text-rose-800 leading-relaxed">
            <span className="font-semibold block mb-0.5">Matrimonial Etiquette Notice</span>
            Please be respectful, authentic, and clear about your background and intentions when initiating contact.
          </div>

          <div className="space-y-3">
            {/* WhatsApp */}
            {contact.whatsapp && (
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-emerald-900 block">WhatsApp Direct</span>
                    <span className="text-xs text-emerald-700 font-mono">{contact.whatsapp}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(contact.whatsapp!, 'wa')}
                    className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-white transition-colors"
                    title="Copy number"
                  >
                    {copiedKey === 'wa' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <a
                    href={`https://wa.me/${whatsappCleanNumber}?text=${prefilledWhatsAppMessage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleActionClick('whatsapp')}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs flex items-center gap-1 transition-colors"
                  >
                    <span>Message</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {/* Email */}
            {contact.email && (
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-900 block">Email Introduction</span>
                    <span className="text-xs text-slate-600 font-mono truncate max-w-[180px] sm:max-w-xs block">
                      {contact.email}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(contact.email!, 'email')}
                    className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-white transition-colors"
                    title="Copy email"
                  >
                    {copiedKey === 'email' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <a
                    href={`mailto:${contact.email}?subject=${encodeURIComponent(`Matrimonial Introduction - Call Me Platform (${profile.fullName})`)}`}
                    onClick={() => handleActionClick('email')}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 shadow-xs flex items-center gap-1 transition-colors"
                  >
                    <span>Send Email</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {/* Phone */}
            {contact.phone && (
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-900 block">Direct Telephone</span>
                    <span className="text-xs text-slate-600 font-mono">{contact.phone}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(contact.phone!, 'phone')}
                    className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-white transition-colors"
                    title="Copy telephone"
                  >
                    {copiedKey === 'phone' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <a
                    href={`tel:${contact.phone}`}
                    onClick={() => handleActionClick('phone')}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-700 shadow-xs flex items-center gap-1 transition-colors"
                  >
                    <span>Call</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {/* Social profiles */}
            <div className="flex flex-wrap gap-2 pt-2">
              {contact.instagram && (
                <a
                  href={`https://instagram.com/${contact.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleActionClick('instagram')}
                  className="px-3 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                  <span>{contact.instagram}</span>
                </a>
              )}

              {contact.linkedin && (
                <a
                  href={contact.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleActionClick('linkedin')}
                  className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                  <span>Professional Profile</span>
                </a>
              )}

              {contact.website && (
                <a
                  href={contact.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleActionClick('website')}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  <span>Personal Website</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition-colors"
          >
            Close Contact Window
          </button>
        </div>
      </div>
    </div>
  );
};
