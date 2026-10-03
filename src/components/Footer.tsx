import React from 'react';
import { PageRoute } from '../types';
import { COMPANY_CONFIG } from '../data/travelData';
import { 
  Phone, 
  Mail, 
  MapPin, 
  ExternalLink, 
  Instagram, 
  Facebook,
  Linkedin,
  Navigation, 
  CreditCard, 
  ShieldCheck, 
  FileText,
  Building2,
  Car
} from 'lucide-react';
import { WhatsAppOfficialIcon } from './WhatsAppFloat';

interface FooterProps {
  setRoute: (route: PageRoute) => void;
  onOpenVisaApp: () => void;
  onOpenEnquiry?: (type?: 'visa' | 'car-rental') => void;
}

export const Footer: React.FC<FooterProps> = ({ setRoute }) => {
  const handleNav = (route: PageRoute) => {
    setRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const whatsappUrl = `https://wa.me/${(COMPANY_CONFIG.whatsappNumber || '971555586359').replace(/\D/g, '')}?text=${encodeURIComponent('Hello Zone Tourism & Hotwheels Car Rental, I have an enquiry.')}`;

  const displayEmail = COMPANY_CONFIG.email || 'info@zonetourism.ae';
  const displayPhone = COMPANY_CONFIG.phone || (COMPANY_CONFIG.phones && COMPANY_CONFIG.phones[0]) || '+971 4 222 6182';

  return (
    <footer className="bg-[#0A2540] text-slate-300 pt-14 pb-10 border-t border-[#12375C]" id="site-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        
        {/* Main Grid: 4 Dedicated Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-12 border-b border-white/10">
          
          {/* Column 1 (4 cols): Dual Corporate Entities & Social Media */}
          <div className="lg:col-span-4 space-y-5">
            {/* Corporate Entity Names */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0B4DA2] shrink-0" />
                <h4 className="font-extrabold text-white text-base tracking-tight">
                  Zone Tourism LLC
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-[#C9A227] shrink-0" />
                <h4 className="font-extrabold text-white text-base tracking-tight">
                  Hotwheels Car Rental LLC
                </h4>
              </div>
            </div>

            {/* Social Media Channels */}
            <div className="pt-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Follow & Connect:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={COMPANY_CONFIG.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-[#E1306C] text-slate-200 hover:text-white text-xs font-semibold transition-colors"
                >
                  <Instagram className="w-3.5 h-3.5" />
                  <span>Instagram</span>
                </a>
                <a
                  href={COMPANY_CONFIG.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-[#1877F2] text-slate-200 hover:text-white text-xs font-semibold transition-colors"
                >
                  <Facebook className="w-3.5 h-3.5" />
                  <span>Facebook</span>
                </a>
                <a
                  href={COMPANY_CONFIG.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-[#0A66C2] text-slate-200 hover:text-white text-xs font-semibold transition-colors"
                >
                  <Linkedin className="w-3.5 h-3.5" />
                  <span>LinkedIn</span>
                </a>
                <a
                  href={COMPANY_CONFIG.social.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-[#000000] text-slate-200 hover:text-white text-xs font-semibold transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.89 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.3 0 .59.04.86.12V9.43a6.37 6.37 0 0 0-.86-.06A6.34 6.34 0 0 0 3 15.71 6.34 6.34 0 0 0 9.34 22a6.34 6.34 0 0 0 6.34-6.29V8.67a7.7 7.7 0 0 0 3.91 1.05v-3.03a4.87 4.87 0 0 1 0-.01v.01z" />
                  </svg>
                  <span>TikTok</span>
                </a>
              </div>
            </div>
          </div>

          {/* Column 2 (4 cols): Official Contact Details, Office Address & Google Maps */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="text-white font-bold text-sm tracking-wide uppercase border-b border-white/10 pb-2">
              Official Contact & Office
            </h4>

            <ul className="space-y-3.5 text-xs sm:text-sm text-slate-300">
              {/* Office Address */}
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#C9A227] shrink-0 mt-0.5" />
                <div>
                  <span className="text-white font-bold block text-xs uppercase tracking-wide">
                    Office Address:
                  </span>
                  <p className="text-slate-300 text-xs sm:text-sm mt-0.5 leading-relaxed">
                    {COMPANY_CONFIG.address}
                  </p>
                </div>
              </li>

              {/* Google Maps Link */}
              <li className="flex items-start gap-3">
                <Navigation className="w-4 h-4 text-[#C9A227] shrink-0 mt-0.5" />
                <div>
                  <span className="text-white font-bold block text-xs uppercase tracking-wide">
                    Google Maps:
                  </span>
                  <a
                    href={COMPANY_CONFIG.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#C9A227] hover:underline font-semibold mt-0.5"
                  >
                    <span>View Location on Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </li>

              {/* Dubai, United Arab Emirates */}
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#C9A227] shrink-0 mt-0.5" />
                <div>
                  <span className="text-white font-bold block text-xs uppercase tracking-wide">
                    Dubai, United Arab Emirates
                  </span>
                  <a
                    href="tel:+97142226182"
                    className="text-white hover:text-[#C9A227] transition-colors block text-xs sm:text-sm font-mono font-bold mt-0.5"
                  >
                    +971 4 222 6182
                  </a>
                </div>
              </li>

              {/* WhatsApp */}
              <li className="flex items-start gap-3">
                <WhatsAppOfficialIcon className="w-4 h-4 text-[#C9A227] shrink-0 mt-0.5" />
                <div>
                  <span className="text-white font-bold block text-xs uppercase tracking-wide">
                    WhatsApp:
                  </span>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white hover:underline font-semibold mt-0.5"
                  >
                    <span>Chat on WhatsApp ({COMPANY_CONFIG.whatsappDisplay || '+971 WhatsApp Desk'})</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </li>

              {/* Email */}
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#C9A227] shrink-0 mt-0.5" />
                <div>
                  <span className="text-white font-bold block text-xs uppercase tracking-wide">
                    Email:
                  </span>
                  <a
                    href={`mailto:${displayEmail}`}
                    className="text-slate-300 hover:text-white transition-colors text-xs font-mono block mt-0.5"
                  >
                    {displayEmail}
                  </a>
                </div>
              </li>
            </ul>
          </div>

          {/* Column 3 (2 cols): Legal & Quick Policies */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-white font-bold text-sm tracking-wide uppercase border-b border-white/10 pb-2">
              Legal & Policy
            </h4>

            <ul className="space-y-3 text-sm">
              <li>
                <button 
                  type="button"
                  onClick={() => handleNav('privacy')} 
                  className="hover:text-white transition-colors cursor-pointer text-left flex items-center gap-2 text-xs sm:text-sm"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <span>Privacy Policy</span>
                </button>
              </li>
              <li>
                <button 
                  type="button"
                  onClick={() => handleNav('terms')} 
                  className="hover:text-white transition-colors cursor-pointer text-left flex items-center gap-2 text-xs sm:text-sm"
                >
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>Terms & Conditions</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4 (2 cols): Make a Payment */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-white font-bold text-sm tracking-wide uppercase border-b border-white/10 pb-2">
              Payments
            </h4>

            <div>
              <button 
                type="button"
                onClick={() => handleNav('make-payment')} 
                className="w-full py-3 px-4 rounded-xl bg-[#C9A227] hover:bg-[#b08d20] text-slate-950 font-bold text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                <CreditCard className="w-4 h-4" />
                <span>Make a Payment</span>
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright, Links & Currency Switcher */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
          <p className="text-center md:text-left">
            © {new Date().getFullYear()} <strong className="text-slate-300">ZONE TOURISM LLC</strong> & <strong className="text-slate-300">HOTWHEELS CAR RENTAL LLC</strong>. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <button 
              type="button"
              onClick={() => handleNav('privacy')} 
              className="hover:text-white transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button 
              type="button"
              onClick={() => handleNav('terms')} 
              className="hover:text-white transition-colors cursor-pointer"
            >
              Terms & Conditions
            </button>
            <button 
              type="button"
              onClick={() => handleNav('make-payment')} 
              className="hover:text-[#C9A227] text-slate-200 transition-colors cursor-pointer font-semibold"
            >
              Make a Payment
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
