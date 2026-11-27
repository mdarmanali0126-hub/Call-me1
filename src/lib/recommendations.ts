import { Profile, isProfileActive } from '../types';

export interface ScoredProfile {
  profile: Profile;
  score: number;
  sharedSignals: number;
  sameCity: boolean;
}

function normalizeString(value?: string | null): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function normalizeMaritalStatus(value?: string | null): string {
  const norm = normalizeString(value);
  if (!norm) return '';
  if (norm === 'single' || norm === 'never married' || norm === 'unmarried') {
    return 'unmarried';
  }
  return norm;
}

function normalizeStringList(list?: string[] | null): Set<string> {
  if (!Array.isArray(list)) return new Set();
  const out = new Set<string>();
  for (const item of list) {
    const norm = normalizeString(item);
    if (norm) out.add(norm);
  }
  return out;
}

function countOverlap(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let count = 0;
  for (const item of a) {
    if (b.has(item)) count++;
  }
  return count;
}

/**
 * Deterministic client-side similarity scorer using existing Profile attributes:
 * - Profession: +30
 * - Shared Tags: +25
 * - Shared Hobbies: +15
 * - Same Country: +15
 * - Same Marital Status: +10
 * - Similar Age (within 5 years): +5
 *
 * Missing or empty fields on either profile never receive points.
 */
export function scoreProfileSimilarity(
  current: Profile,
  candidate: Profile
): ScoredProfile {
  let score = 0;
  let sharedSignals = 0;

  const currProf = normalizeString(current.profession);
  const candProf = normalizeString(candidate.profession);
  if (currProf && candProf && currProf === candProf) {
    score += 30;
    sharedSignals++;
  }

  const currTags = normalizeStringList(current.tags);
  const candTags = normalizeStringList(candidate.tags);
  const tagOverlap = countOverlap(currTags, candTags);
  if (tagOverlap > 0) {
    score += 25;
    sharedSignals += tagOverlap;
  }

  const currHobbies = normalizeStringList(current.hobbies);
  const candHobbies = normalizeStringList(candidate.hobbies);
  const hobbyOverlap = countOverlap(currHobbies, candHobbies);
  if (hobbyOverlap > 0) {
    score += 15;
    sharedSignals += hobbyOverlap;
  }

  const currCountry = normalizeString(current.country);
  const candCountry = normalizeString(candidate.country);
  if (currCountry && candCountry && currCountry === candCountry) {
    score += 15;
    sharedSignals++;
  }

  const currMarital = normalizeMaritalStatus(current.maritalStatus);
  const candMarital = normalizeMaritalStatus(candidate.maritalStatus);
  if (currMarital && candMarital && currMarital === candMarital) {
    score += 10;
    sharedSignals++;
  }

  if (
    typeof current.age === 'number' &&
    typeof candidate.age === 'number' &&
    Number.isFinite(current.age) &&
    Number.isFinite(candidate.age) &&
    current.age > 0 &&
    candidate.age > 0 &&
    Math.abs(current.age - candidate.age) <= 5
  ) {
    score += 5;
    sharedSignals++;
  }

  const currCity = normalizeString(current.city);
  const candCity = normalizeString(candidate.city);
  const sameCity = Boolean(currCity && candCity && currCity === candCity);

  return {
    profile: candidate,
    score,
    sharedSignals,
    sameCity,
  };
}

/**
 * Returns up to `limit` deterministic, deduplicated recommended profiles
 * excluding the currently viewed candidate.
 */
export function getSimilarProfiles(
  current: Profile | null | undefined,
  allProfiles: Profile[],
  limit = 3
): Profile[] {
  if (!current || !Array.isArray(allProfiles) || allProfiles.length === 0) {
    return [];
  }

  const seen = new Set<string>();
  const eligible: Profile[] = [];

  for (const candidate of allProfiles) {
    if (!candidate) continue;
    // Never recommend the currently viewed candidate
    if (
      (current.id && candidate.id === current.id) ||
      (current.slug && candidate.slug === current.slug)
    ) {
      continue;
    }

    // Only include eligible published profiles
    if (!isProfileActive(candidate) && candidate.published === false) {
      continue;
    }
    if (!candidate.slug || !candidate.fullName?.trim()) continue;

    const dedupeKey = candidate.id || candidate.slug;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    eligible.push(candidate);
  }

  const scored = eligible.map((candidate) =>
    scoreProfileSimilarity(current, candidate)
  );

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.sharedSignals !== a.sharedSignals) return b.sharedSignals - a.sharedSignals;
    if (a.sameCity !== b.sameCity) return a.sameCity ? -1 : 1;

    const aFeatured = a.profile.featured ? 1 : 0;
    const bFeatured = b.profile.featured ? 1 : 0;
    if (bFeatured !== aFeatured) return bFeatured - aFeatured;

    const viewsDiff = (b.profile.views || 0) - (a.profile.views || 0);
    if (viewsDiff !== 0) return viewsDiff;

    return (a.profile.slug || '').localeCompare(b.profile.slug || '');
  });

  return scored.slice(0, limit).map((item) => item.profile);
}
