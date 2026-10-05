import React from 'react';
import { DimabinLogo } from '../../../assets/brand/DimabinLogo';
import { FOOTER_NAVIGATION } from '../../../config/navigation';
import { INSTITUTE_CONFIG } from '../../../config/institute';
import { ROUTES } from '../../../config/routes';

export interface FooterProps {
  className?: string;
}

/**
 * DIMABIN Global Reusable Footer Component
 * Architectural structure supporting:
 * - Institute information & motto
 * - Quick links
 * - Academic programmes overview
 * - Institute portals access
 * - Contact information placeholders
 * - Social media links
 * - Privacy Policy, Terms of Use, and Copyright
 */
export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={`bg-[#122452] text-white border-t-4 border-[#F5B800] pt-14 pb-8 ${className}`}
      role="contentinfo"
      aria-label="Site Footer"
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-white/10">
          {/* Column 1: Institute Info & Brand (Spans 2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <DimabinLogo variant="dark" emblemSize={44} />

            <p className="font-poppins text-xs font-semibold uppercase tracking-wider text-[#F5B800]">
              MOTTO: {INSTITUTE_CONFIG.motto}
            </p>

            <p className="font-poppins text-sm text-slate-300 leading-relaxed max-w-sm">
              An Interdenominational Citadel of Learning built to raise equipped, biblically sound, and ethically outstanding Christian leaders.
            </p>

            {/* Social Links */}
            <div className="pt-2">
              <span className="block text-xs uppercase tracking-wider text-slate-400 font-bold mb-3 font-poppins">
                Connect With Us
              </span>
              <div className="flex items-center gap-3">
                {INSTITUTE_CONFIG.socialLinks.map((social) => (
                  <a
                    key={social.key}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-white/5 hover:bg-[#F5B800] hover:text-[#122452] text-slate-300 flex items-center justify-center text-xs font-bold transition-all duration-200"
                    aria-label={`DIMABIN on ${social.label}`}
                  >
                    {social.label.charAt(0)}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h3 className="font-poppins text-xs font-bold uppercase tracking-widest text-[#F5B800]">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              <li>
                <a href="#hero" className="font-poppins text-sm text-slate-300 hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#welcome" className="font-poppins text-sm text-slate-300 hover:text-white transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#admissions" className="font-poppins text-sm text-slate-300 hover:text-white transition-colors">
                  Admissions
                </a>
              </li>
              <li>
                <a href="#contact" className="font-poppins text-sm text-slate-300 hover:text-white transition-colors">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Academic Studies */}
          <div className="space-y-3">
            <h3 className="font-poppins text-xs font-bold uppercase tracking-widest text-[#F5B800]">
              Academic Studies
            </h3>
            <ul className="space-y-2.5">
              <li>
                <a href="#programs" className="font-poppins text-sm text-slate-300 hover:text-white transition-colors">
                  Diploma in Theology (Dipl.Th.)
                </a>
              </li>
              <li>
                <a href="#programs" className="font-poppins text-sm text-slate-300 hover:text-white transition-colors">
                  Certificate in Ministry
                </a>
              </li>
              <li>
                <a href="#programs" className="font-poppins text-sm text-slate-300 hover:text-white transition-colors">
                  Christian Leadership Studies
                </a>
              </li>
              <li>
                <a href="#programs" className="font-poppins text-sm text-slate-300 hover:text-white transition-colors">
                  Executive Weekend Cohorts
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Portals & Contact Info */}
          <div className="space-y-4" id="contact">
            <div>
              <h3 className="font-poppins text-xs font-bold uppercase tracking-widest text-[#F5B800] mb-3">
                Institute Portals
              </h3>
              <ul className="space-y-2">
                {FOOTER_NAVIGATION.portalLinks.map((portal) => (
                  <li key={portal.href}>
                    <a
                      href={portal.href}
                      className="font-poppins text-sm text-slate-300 hover:text-[#F5B800] transition-colors flex items-center gap-1.5"
                    >
                      <span className="text-[#F5B800] text-xs">›</span>
                      <span>{portal.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t border-white/10">
              <h3 className="font-poppins text-xs font-bold uppercase tracking-widest text-[#F5B800] mb-2">
                Contact Us
              </h3>
              <p className="font-poppins text-xs text-slate-300">
                <span className="text-slate-400">Address:</span> Divine Mandate Bible Institute Campus & Study Centres (Official address placeholder)
              </p>
              <p className="font-poppins text-xs text-slate-300 mt-1">
                <span className="text-slate-400">Phone:</span> +234 (0) 800-DIMABIN (Official phone placeholder)
              </p>
              <p className="font-poppins text-xs text-slate-300 mt-1">
                <span className="text-slate-400">Email:</span> info@dimabin.org (Official email placeholder)
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Legal & Copyright Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-poppins">
          <p>
            © {currentYear} Divine Mandate Bible Institute (DIMABIN). All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href={ROUTES.PRIVACY} className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <a href={ROUTES.TERMS} className="hover:text-white transition-colors">
              Terms of Use
            </a>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <a href={ROUTES.PORTAL_GATEWAY} className="hover:text-[#F5B800] transition-colors">
              Portal Gateway
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
