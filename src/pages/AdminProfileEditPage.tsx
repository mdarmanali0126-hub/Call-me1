import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
 
 
 
  Heart,
  Image as ImageIcon,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Profile,DEFAULT_AVATAR_PLACEHOLDER } from '../types';
import {
  fetchProfilesFromFirestore,
  saveProfileToFirestore,
  deleteProfileFromFirestore
} from '../lib/firestoreService';
import { syncProfileToServer } from '../lib/api';

const SAMPLE_PORTRAITS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=1000&q=80'
];

export const AdminProfileEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Profile form state
  const [profile, setProfile] = useState<Profile>({
    id: `prof-${Date.now()}`,
    slug: '',
    fullName: '',
    age: 28,
    maritalStatus: 'Never Married',
    city: '',
    state: '',
    country: 'United States',
    profession: '',
    education: '',
    bio: '',
    proposalMessage: '',
    image: SAMPLE_PORTRAITS[0],
    publicContact: {
      phone: '',
      email: '',
      whatsapp: '',
      instagram: '',
      linkedin: '',
      preferredMethod: 'whatsapp'
    },
    published: true,
    featured: false,
    views: 0,
    tags: ['Family-Oriented', 'Career-Focused'],
    religion: '',
    height: "5'10\"",
    motherTongue: 'English',
    hobbies: ['Travel', 'Reading'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Redirect if unauthenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/admin/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Load profile if editing
  useEffect(() => {
    if (!isNew && id) {
      fetchProfilesFromFirestore(false).then((list) => {
        const found = list.find((p) => p.id === id);
        if (found) {
          setProfile(found);
        } else {
          setError('Profile not found.');
        }
        setLoading(false);
      });
    }
  }, [id, isNew]);

  // Auto-generate slug when name changes (if slug was empty or matches old name)
  const handleNameChange = (name: string) => {
    setProfile((prev) => ({
      ...prev,
      fullName: name
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.fullName.trim()) {
      setError('Please provide a Full Name.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const generatedSlug = profile.slug || `${profile.fullName} ${profile.profession || ''}`
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const profileId = profile.id || `prof-${generatedSlug.replace(/[^a-zA-Z0-9-]/g, '') || Date.now()}`;
      
      const updatedProfile = { ...profile, slug: generatedSlug };
      const dataToSave = {
        ...updatedProfile,
        id: profileId,
        updatedAt: new Date().toISOString()
      };

      await saveProfileToFirestore(dataToSave);
      await syncProfileToServer(dataToSave);

      setSuccessToast('Profile saved and synced successfully.');
      setTimeout(() => {
        navigate('/admin');
      }, 1200);
    } catch (err: any) {
      setError('Error saving profile: ' + err.message);
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-20">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/70 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white font-serif-luxury">
                {isNew ? 'Create New Candidate Portfolio' : `Edit: ${profile.fullName}`}
              </h1>
              <p className="text-sm text-slate-400">
                Managed via Firebase Web SDK &amp; Express API
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="px-3.5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-300 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold shadow-md shadow-rose-950/40 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Portfolio</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toasts */}
        {successToast && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">{successToast}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/80 border border-rose-700 text-rose-200 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          {/* SECTION 1: Core Information */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-500" />
                <span>1. Core Profile Details</span>
              </h2>

              <div className="flex items-center gap-4 text-sm font-semibold">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.published}
                    onChange={(e) => setProfile({ ...profile, published: e.target.checked })}
                    className="rounded border-slate-700 text-rose-600 focus:ring-rose-500 w-4 h-4"
                  />
                  <span className={profile.published ? 'text-emerald-400' : 'text-slate-500'}>
                    {profile.published ? 'Published (Live)' : 'Draft (Hidden)'}
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.featured || false}
                    onChange={(e) => setProfile({ ...profile, featured: e.target.checked })}
                    className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 w-4 h-4"
                  />
                  <span className={profile.featured ? 'text-amber-400' : 'text-slate-500'}>
                    Spotlight Featured
                  </span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Candidate Full Name *</label>
                <input
                  type="text"
                  required
                  value={profile.fullName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Elena Vance"
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-rose-500 text-sm"
                />
              </div>

              

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Age</label>
                <input
                  type="number"
                  min={18}
                  max={90}
                  value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || 28 })}
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-rose-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Marital Status</label>
                <select
                  value={profile.maritalStatus}
                  onChange={(e) => setProfile({ ...profile, maritalStatus: e.target.value as any })}
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-rose-500"
                >
                  <option value="Never Married">Never Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Separated">Separated</option>
                  <option value="Single">Single</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">City</label>
                <input
                  type="text"
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  placeholder="e.g. Boston"
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Country</label>
                <input
                  type="text"
                  value={profile.country}
                  onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                  placeholder="e.g. United States"
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Profession / Job Role</label>
                <input
                  type="text"
                  value={profile.profession}
                  onChange={(e) => setProfile({ ...profile, profession: e.target.value })}
                  placeholder="e.g. Pediatric Resident Physician"
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Education / University</label>
                <input
                  type="text"
                  value={profile.education}
                  onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                  placeholder="e.g. M.D., Harvard Medical School"
                  className="w-full px-3.5 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-rose-500"
                />
              </div>

              
            </div>

            {/* Photo Picker */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <label className="block text-slate-300 font-semibold text-sm">Primary Portrait Photo URL</label>
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <img
                  src={profile.image && profile.image.trim() !== '' ? profile.image : DEFAULT_AVATAR_PLACEHOLDER}
                  alt="Portrait preview"
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-rose-500 shrink-0"
                />
                <div className="flex-1 w-full space-y-2">
                  <input
                    type="url"
                    value={profile.image}
                    onChange={(e) => setProfile({ ...profile, image: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white font-mono outline-none focus:border-rose-500"
                  />
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 mr-1">Sample presets:</span>
                    {SAMPLE_PORTRAITS.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setProfile({ ...profile, image: url })}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300"
                      >
                        Preset {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="pt-3 border-t border-slate-800">
              <label className="block text-slate-300 font-semibold mb-1.5">Short Bio</label>
              <textarea
                rows={4}
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Share a short, compelling biography..."
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-rose-500 text-sm leading-relaxed"
              />
            </div>
          </div>

          {/* SECTION 2: Public Contact Channels */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <Heart className="w-4 h-4 text-rose-500" />
              <span>2. Public Contact &amp; Inquiry Channels</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">WhatsApp Number</label>
                <input
                  type="text"
                  value={profile.publicContact?.whatsapp || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      publicContact: { ...profile.publicContact, whatsapp: e.target.value }
                    })
                  }
                  placeholder="+14158902194"
                  className="w-full px-3 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={profile.publicContact?.email || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      publicContact: { ...profile.publicContact, email: e.target.value }
                    })
                  }
                  placeholder="candidate@gmail.com"
                  className="w-full px-3 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-rose-500"
                />
              </div>

              

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Preferred Contact Method</label>
                <select
                  value={profile.publicContact?.preferredMethod || 'whatsapp'}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      publicContact: { ...profile.publicContact, preferredMethod: e.target.value as any }
                    })
                  }
                  className="w-full px-3 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white outline-none focus:border-rose-500"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                  <option value="phone">Direct Phone Call</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bottom Save Bar */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-800">
            <Link
              to="/admin"
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-300 transition-colors"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold shadow-lg shadow-rose-950/50 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Candidate Portfolio</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
