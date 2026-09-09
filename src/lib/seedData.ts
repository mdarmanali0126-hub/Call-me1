import { Profile, AdvertisingSettings } from '../types';

export const INITIAL_PROFILES: Profile[] = [
  {
    id: 'prof-aarav-sharma',
    slug: 'aarav-sharma-tech-lead',
    fullName: 'Aarav Sharma',
    age: 29,
    maritalStatus: 'Never Married',
    city: 'San Francisco',
    state: 'California',
    country: 'United States',
    profession: 'Senior Software Architect',
    education: 'M.S. in Computer Science, Stanford University',
    bio: 'Passionate technologist, weekend marathon runner, and amateur jazz pianist. I value intellectual curiosity, kind humor, and honest communication. Looking for an authentic partner to build a joyful, purpose-driven life together.',
    proposalMessage: 'I believe marriage is a lifelong partnership built on shared values, mutual respect, and waking up excited to support each other’s dreams. If you appreciate spontaneous weekend road trips, thoughtful late-night conversations over espresso, and deep family bonds, I would love to connect.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=1000&q=80',
    ],
    publicContact: {
      phone: '+1 (415) 890-2194',
      email: 'aarav.sharma.connect@gmail.com',
      whatsapp: '+14158902194',
      linkedin: 'https://linkedin.com',
      instagram: '@aarav.s.sound',
      preferredMethod: 'whatsapp'
    },
    published: true,
    featured: true,
    views: 1420,
    tags: ['Tech', 'Marathon', 'Jazz', 'Stanford Alumni', 'Family-Oriented'],
    religion: 'Hindu / Progressive',
    height: "5'11\"",
    motherTongue: 'Hindi / English',
    hobbies: ['Marathon Running', 'Jazz Piano', 'Trail Hiking', 'Coffee Roasting'],
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-03-01T14:30:00.000Z',
    story: {
      title: 'A Life in Rhythm & Code',
      subtitle: 'From Silicon Valley trails to quiet Sunday mornings',
      slides: [
        {
          id: 'slide-1',
          title: 'Roots & Foundations',
          text: 'Raised in a warm household where education and family dinners were sacred. Learned that ambition means nothing without character.',
          mediaUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1000&q=80',
          quote: '"Success is how comfortably you can sleep knowing you treated people right."',
          bgGradient: 'from-amber-900/80 via-slate-900 to-black',
        },
        {
          id: 'slide-2',
          title: 'The Professional Craft',
          text: 'Currently designing distributed AI infrastructure at scale. Work gives me technical challenges, but human relationships give me real meaning.',
          mediaUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=1000&q=80',
          quote: '"Building systems taught me patience; running marathons taught me endurance."',
          bgGradient: 'from-blue-950 via-slate-900 to-black',
        },
        {
          id: 'slide-3',
          title: 'Beyond the Screen',
          text: 'You will often find me exploring mountain trails at sunrise, perfecting pour-over coffee, or jamming on the keyboard to classic Bill Evans standards.',
          mediaUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1000&q=80',
          caption: 'Early morning Half Moon Bay coastal run',
          bgGradient: 'from-emerald-950 via-slate-900 to-black',
        },
        {
          id: 'slide-4',
          title: 'What I Envision Together',
          text: 'A marriage rooted in laughter, shared growth, mutual respect, and creating a peaceful sanctuary of a home for each other.',
          mediaUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=80',
          quote: '"Looking for a best friend, confidante, and partner in every season of life."',
          ctaText: 'Reach Out Directly',
          ctaAction: 'contact',
          bgGradient: 'from-rose-950 via-slate-900 to-black',
        }
      ]
    }
  },
  {
    id: 'prof-elena-vance',
    slug: 'dr-elena-vance-pediatrician',
    fullName: 'Dr. Elena Vance',
    age: 28,
    maritalStatus: 'Never Married',
    city: 'Boston',
    state: 'Massachusetts',
    country: 'United States',
    profession: 'Pediatric Resident Physician',
    education: 'M.D., Harvard Medical School',
    bio: 'Dedicated pediatrician with an endless love for watercolor sketching, historical fiction, and coastal sailing. I believe kindness is the highest form of intelligence and look forward to building a loving family filled with warmth.',
    proposalMessage: 'I am looking for a partner with a generous spirit, strong ethical compass, and an open heart. Someone who enjoys deep conversations, laughter during cooking experiments, and values both family traditions and progressive thinking.',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80',
    ],
    publicContact: {
      phone: '+1 (617) 555-0142',
      email: 'dr.elena.vance@gmail.com',
      whatsapp: '+16175550142',
      instagram: '@elena.vance.md',
      preferredMethod: 'email'
    },
    published: true,
    featured: true,
    views: 1890,
    tags: ['Physician', 'Harvard', 'Sailing', 'Arts', 'Book Lover'],
    religion: 'Christian / Contemporary',
    height: "5'7\"",
    motherTongue: 'English',
    hobbies: ['Watercolor Painting', 'Ocean Sailing', 'Baking Sourdough', 'Book Clubs'],
    createdAt: '2026-01-20T09:00:00.000Z',
    updatedAt: '2026-03-02T11:15:00.000Z',
    story: {
      title: 'Healing, Art & Devotion',
      subtitle: 'A journey of heart, medicine, and quiet coastal moments',
      slides: [
        {
          id: 'slide-e1',
          title: 'The Calling',
          text: 'Working in pediatric care has taught me grace under pressure and never taking simple health and happiness for granted.',
          mediaUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1000&q=80',
          quote: '"Children remind us daily that joy lives in the smallest moments."',
          bgGradient: 'from-sky-950 via-slate-900 to-black',
        },
        {
          id: 'slide-e2',
          title: 'Coastal Balance',
          text: 'Whenever I have a free Saturday, I head to the harbor with my sketchbook and a thermos of Earl Grey.',
          mediaUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80',
          caption: 'New England harbor sketches on brisk autumn afternoons',
          bgGradient: 'from-teal-950 via-slate-900 to-black',
        },
        {
          id: 'slide-e3',
          title: 'My Heart’s Intention',
          text: 'Seeking a calm, dependable man who values family unity, emotional honesty, and mutual encouragement in both our careers.',
          mediaUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=80',
          quote: '"A true companion makes the heavy burdens light and the simple moments unforgettable."',
          ctaText: 'View Proposal & Connect',
          ctaAction: 'contact',
          bgGradient: 'from-pink-950 via-slate-900 to-black',
        }
      ]
    }
  },
  {
    id: 'prof-tariq-mansoor',
    slug: 'tariq-mansoor-urban-architect',
    fullName: 'Tariq Mansoor',
    age: 32,
    maritalStatus: 'Never Married',
    city: 'London',
    state: 'Greater London',
    country: 'United Kingdom',
    profession: 'Sustainable Urban Architect & Partner',
    education: 'M.Arch, The Bartlett, UCL',
    bio: 'Architect designing regenerative eco-cities and historical restorations. Passionate about sustainable urbanism, gallery openings, tennis, and culinary exploration across Europe.',
    proposalMessage: 'Looking for a thoughtful, driven woman who carries herself with grace and self-assurance. Someone who appreciates design, cultural heritage, traveling to historic towns, and building a secure, peaceful home together.',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1000&q=80',
    publicContact: {
      email: 'tariq.mansoor.architect@outlook.com',
      whatsapp: '+447911123456',
      linkedin: 'https://linkedin.com',
      preferredMethod: 'whatsapp'
    },
    published: true,
    featured: false,
    views: 980,
    tags: ['Architecture', 'Urban Design', 'UCL', 'London', 'Art Collector'],
    religion: 'Muslim / Moderate',
    height: "6'1\"",
    motherTongue: 'English / Urdu',
    hobbies: ['Architectural Photography', 'Tennis', 'Modern Art', 'Wine Tasting'],
    createdAt: '2026-02-01T15:00:00.000Z',
    updatedAt: '2026-03-04T16:00:00.000Z',
    story: {
      title: 'Spaces, Heritage & Vision',
      subtitle: 'Designing sustainable futures across continents',
      slides: [
        {
          id: 'slide-t1',
          title: 'The Blueprint',
          text: 'Believing that spaces shape our emotions and daily well-being. I bring the same intentionality to my personal life.',
          mediaUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1000&q=80',
          quote: '"Architecture is frozen music, and a good marriage is its warmest melody."',
          bgGradient: 'from-stone-900 via-neutral-900 to-black',
        },
        {
          id: 'slide-t2',
          title: 'Shared Horizons',
          text: 'Hoping to find a life partner who values deep connection, mutual respect, and family gatherings filled with storytelling.',
          mediaUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=1000&q=80',
          ctaText: 'Send Personal Message',
          ctaAction: 'contact',
          bgGradient: 'from-slate-900 via-zinc-900 to-black',
        }
      ]
    }
  },
  {
    id: 'prof-priya-patel',
    slug: 'priya-patel-creative-director',
    fullName: 'Priya Patel',
    age: 27,
    maritalStatus: 'Never Married',
    city: 'New York',
    state: 'New York',
    country: 'United States',
    profession: 'Creative Brand Strategist & Designer',
    education: 'B.F.A., Rhode Island School of Design (RISD)',
    bio: 'Visual storyteller and brand director based in Manhattan. Coffee connoisseur, classical kathak dancer, and museum enthusiast. Looking for an ambitious, empathetic partner who loves laughter and deep conversations.',
    proposalMessage: 'Marriage to me is two independent minds choosing to build an extraordinary shared story. If you appreciate good design, Sunday farmers markets, genuine friendships, and ambition with humility, let’s talk.',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80',
    publicContact: {
      email: 'priya.patel.design@gmail.com',
      whatsapp: '+12125559821',
      instagram: '@priyapatel.studio',
      preferredMethod: 'whatsapp'
    },
    published: true,
    featured: false,
    views: 1120,
    tags: ['Design', 'RISD', 'Manhattan', 'Dance', 'Strategy'],
    religion: 'Hindu / Cultural',
    height: "5'6\"",
    motherTongue: 'Gujarati / English',
    hobbies: ['Kathak Dance', 'Typography', 'Ceramics', 'Vinyl Record Hunting'],
    createdAt: '2026-02-10T12:00:00.000Z',
    updatedAt: '2026-03-05T08:00:00.000Z',
    story: {
      title: 'Colors of Culture & Modernity',
      subtitle: 'Living at the intersection of creative heritage and modern life',
      slides: [
        {
          id: 'slide-p1',
          title: 'Expressive Living',
          text: 'From branding leading global startups to classical Indian dance recitals, my days are rich with color and discipline.',
          mediaUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80',
          quote: '"Tradition is not worshipping ashes, but preserving the fire."',
          bgGradient: 'from-amber-950 via-rose-950 to-black',
        },
        {
          id: 'slide-p2',
          title: 'The Ideal Match',
          text: 'Someone thoughtful, driven, warm with family, and capable of both serious career focus and playful spontaneity.',
          mediaUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=80',
          ctaText: 'Connect with Priya',
          ctaAction: 'contact',
          bgGradient: 'from-purple-950 via-slate-900 to-black',
        }
      ]
    }
  }
];

export const INITIAL_ADVERTISING_SETTINGS: AdvertisingSettings = {
  slots: [
    {
      id: 'ad-header',
      slotName: 'header_banner',
      enabled: true,
      sponsorName: 'The Royal Heritage Club',
      title: 'Exclusive Matrimonial Concierge for Distinguished Professionals',
      description: 'Handcrafted introductions, background verification, and private bespoke consultations.',
      linkUrl: 'https://callme-matrimony.com/concierge',
      ctaText: 'Inquire Privately',
      badgeText: 'Curated Partner'
    },
    {
      id: 'ad-profile-inline',
      slotName: 'profile_inline',
      enabled: true,
      sponsorName: 'Elysian Fine Jewelry',
      title: 'Artisanal Engagement & Wedding Bands Crafted in Platinum',
      description: 'Timeless heirlooms certified ethically with private showroom viewings in NY & SF.',
      linkUrl: 'https://elysian-jewelry.example.com',
      ctaText: 'Explore Collection',
      badgeText: 'Featured Sponsor',
      imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'ad-story',
      slotName: 'story_sponsor',
      enabled: true,
      sponsorName: 'Aura Luxury Retreats',
      title: 'Romantic Getaways & Honeymoon Escapes in the Amalfi Coast',
      description: 'Private clifftop villas curated exclusively for memorable beginnings.',
      linkUrl: 'https://aura-retreats.example.com',
      ctaText: 'View Escapes',
      badgeText: 'Story Presented By'
    },
    {
      id: 'ad-footer',
      slotName: 'footer_banner',
      enabled: true,
      sponsorName: 'Silk & Stone Bespoke Tailoring',
      title: 'Couture Wedding & Evening Attire Crafted with Master Italian Cloth',
      description: 'Complimentary private fitting appointment for prospective couples.',
      linkUrl: 'https://silkstone-bespoke.example.com',
      ctaText: 'Book Fitting',
      badgeText: 'Partner'
    }
  ],
  ads: {
    popunder: false,
    socialBar: false,
    banner: false
  },
  updatedAt: new Date().toISOString()
};
