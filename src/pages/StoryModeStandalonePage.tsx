import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Profile } from '../types';
import { fetchPublicProfileBySlug } from '../lib/api';
import { StoryViewerModal } from '../components/StoryViewerModal';
import { ContactModal } from '../components/ContactModal';
import { ArrowLeft } from 'lucide-react';

export const StoryModeStandalonePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isContactOpen, setIsContactOpen] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetchPublicProfileBySlug(slug).then((data) => {
      setProfile(data);
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h2 className="text-2xl font-bold font-serif-luxury">Story Not Found</h2>
        <p className="text-sm text-slate-400">The story portfolio you are looking for does not exist.</p>
        <Link
          to="/"
          className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold"
        >
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <StoryViewerModal
        profile={profile}
        isOpen={true}
        onClose={() => navigate(`/profile/${profile.slug}`)}
        onOpenContact={() => setIsContactOpen(true)}
      />

      {isContactOpen && (
        <ContactModal
          profile={profile}
          isOpen={isContactOpen}
          onClose={() => setIsContactOpen(false)}
        />
      )}
    </div>
  );
};
