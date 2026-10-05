/**
 * Divine Mandate Bible Institute (DIMABIN)
 * Asset Architecture & Storage Contracts
 *
 * Separates assets into structured categories:
 * - Logos
 * - Icons
 * - Hero Images
 * - Programme Images
 * - Gallery Images
 * - General Images
 * - Admin-Managed Dynamic Images
 *
 * Ready to integrate with Firebase Storage / CDN in future phases
 * without hardcoding or structural rewrites.
 */

export type AssetCategory =
  | 'logos'
  | 'icons'
  | 'hero'
  | 'programmes'
  | 'gallery'
  | 'general'
  | 'admin_managed';

export interface ImageAssetRef {
  id: string;
  category: AssetCategory;
  altText: string;
  title?: string;
  storagePath?: string; // e.g. "institute/programmes/theology_diploma.webp"
  fallbackUrl: string;
  aspectRatio: '16:9' | '4:3' | '1:1' | '3:2' | '2:3';
  width?: number;
  height?: number;
  caption?: string;
}

export interface AssetStorageProvider {
  resolveImageUrl(asset: ImageAssetRef): string;
}
