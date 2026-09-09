import { Profile } from '../types';

export function updateSEO({
  title,
  description,
  image,
  url,
  type = 'website'
}: {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: string;
}) {
  // Update document title
  document.title = title;

  // Helper to set or update meta tag
  const setMeta = (nameOrProperty: string, key: 'name' | 'property', value: string) => {
    let el = document.querySelector(`meta[${key}="${nameOrProperty}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(key, nameOrProperty);
      document.head.appendChild(el);
    }
    el.setAttribute('content', value);
  };

  setMeta('description', 'name', description);
  setMeta('og:title', 'property', title);
  setMeta('og:description', 'property', description);
  setMeta('og:type', 'property', type);

  if (url) {
    setMeta('og:url', 'property', url);
  }

  if (image) {
    setMeta('og:image', 'property', image);
    setMeta('twitter:image', 'property', image);
    setMeta('twitter:card', 'name', 'summary_large_image');
  }

  setMeta('twitter:title', 'name', title);
  setMeta('twitter:description', 'name', description);
}

export function injectProfileJsonLd(profile: Profile) {
  const existing = document.getElementById('jsonld-profile');
  if (existing) {
    existing.remove();
  }

  const script = document.createElement('script');
  script.id = 'jsonld-profile';
  script.type = 'application/ld+json';
  script.text = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.fullName,
    jobTitle: profile.profession,
    description: profile.bio,
    image: profile.image,
    address: {
      '@type': 'PostalAddress',
      addressLocality: profile.city,
      addressRegion: profile.state,
      addressCountry: profile.country
    },
    alumniOf: profile.education
  });
  document.head.appendChild(script);
}
