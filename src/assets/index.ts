/**
 * Divine Mandate Bible Institute (DIMABIN)
 * Asset Architecture Registry
 *
 * Clean separation of:
 * - Logos
 * - Icons
 * - Hero Images
 * - Programme Images
 * - Gallery Images
 * - General Images
 * - Admin-managed dynamic assets
 */

import { ImageAssetRef, AssetCategory } from '../types/assets';

export * from './brand/DimabinEmblem';
export * from './brand/DimabinLogo';

// Master Asset Manifest definitions (ready for storage bucket URL resolution)
export const ASSET_REGISTRY: Record<string, ImageAssetRef> = {
  // Brand Logos
  'logo-primary': {
    id: 'logo-primary',
    category: 'logos',
    altText: 'Divine Mandate Bible Institute Logo',
    fallbackUrl: '/assets/brand/dimabin-logo.svg',
    aspectRatio: '4:3',
  },
  'emblem-crest': {
    id: 'emblem-crest',
    category: 'logos',
    altText: 'DIMABIN Official Seal & Crest',
    fallbackUrl: '/assets/brand/dimabin-crest.svg',
    aspectRatio: '1:1',
  },

  // Hero Image Slots (Defined for Future Phase 1)
  'hero-campus-banner': {
    id: 'hero-campus-banner',
    category: 'hero',
    altText: 'DIMABIN Students in Biblical Studies and Worship',
    storagePath: 'institute/heroes/campus_worship.webp',
    fallbackUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720"><rect width="100%" height="100%" fill="%23122452"/><path d="M0 500 Q 640 400 1280 500 L 1280 720 L 0 720 Z" fill="%231F3C82" opacity="0.6"/><circle cx="640" cy="300" r="140" fill="%23F5B800" opacity="0.15"/></svg>',
    aspectRatio: '16:9',
  },

  // Academic Programme Asset References
  'programme-theology-diploma': {
    id: 'programme-theology-diploma',
    category: 'programmes',
    altText: 'Diploma in Theology & Christian Ministry',
    storagePath: 'institute/programmes/diploma_theology.webp',
    fallbackUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%231F3C82"/><rect x="40" y="40" width="520" height="320" rx="8" fill="%23122452"/><path d="M300 120v160M240 180h120" stroke="%23F5B800" stroke-width="8" stroke-linecap="round"/></svg>',
    aspectRatio: '4:3',
  },
  'programme-ministry-certificate': {
    id: 'programme-ministry-certificate',
    category: 'programmes',
    altText: 'Certificate in Practical Ministry',
    storagePath: 'institute/programmes/certificate_ministry.webp',
    fallbackUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%231F3C82"/><rect x="40" y="40" width="520" height="320" rx="8" fill="%23122452"/><circle cx="300" cy="200" r="60" stroke="%23F5B800" stroke-width="6" fill="none"/></svg>',
    aspectRatio: '4:3',
  },
  'programme-leadership-degree': {
    id: 'programme-leadership-degree',
    category: 'programmes',
    altText: 'Bachelor of Arts in Christian Leadership',
    storagePath: 'institute/programmes/bachelor_leadership.webp',
    fallbackUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%231F3C82"/><rect x="40" y="40" width="520" height="320" rx="8" fill="%23122452"/><polygon points="300,140 340,240 260,240" fill="%23F5B800"/></svg>',
    aspectRatio: '4:3',
  },
};

/**
 * Resolves an asset URL through CDN/Storage abstraction.
 * Allows effortless transition to Firebase Storage or custom CDN in future phases.
 */
export function resolveAssetUrl(assetId: string): string {
  const asset = ASSET_REGISTRY[assetId];
  if (!asset) {
    return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%23F6F7FB"/></svg>';
  }
  return asset.fallbackUrl;
}

export function getAssetsByCategory(category: AssetCategory): ImageAssetRef[] {
  return Object.values(ASSET_REGISTRY).filter((asset) => asset.category === category);
}
