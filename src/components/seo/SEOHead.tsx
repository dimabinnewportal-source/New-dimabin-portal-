import React, { useEffect } from 'react';
import { INSTITUTE_CONFIG } from '../../config/institute';

export interface SEOHeadProps {
  title?: string;
  description?: string;
  canonicalPath?: string;
  ogType?: 'website' | 'article';
}

/**
 * DIMABIN SEO Head Controller
 * Manages document title, meta descriptions, canonical URLs, and Open Graph tags.
 */
export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description = INSTITUTE_CONFIG.mission,
  canonicalPath = '/',
  ogType = 'website',
}) => {
  const fullTitle = title
    ? `${title} | ${INSTITUTE_CONFIG.name}`
    : `${INSTITUTE_CONFIG.name} | ${INSTITUTE_CONFIG.shortName}`;

  useEffect(() => {
    // Update Document Title
    document.title = fullTitle;

    // Update Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // Update OG Title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', fullTitle);
    }

    // Update OG Description
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) {
      ogDesc.setAttribute('content', description);
    }

    // Update OG Type
    let ogTypeTag = document.querySelector('meta[property="og:type"]');
    if (ogTypeTag) {
      ogTypeTag.setAttribute('content', ogType);
    }

    // Update Canonical URL
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', canonicalPath);
  }, [fullTitle, description, canonicalPath, ogType]);

  return null;
};
