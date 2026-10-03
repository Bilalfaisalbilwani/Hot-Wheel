import { apiUrl } from '../utils/api';
import React, { useState, useEffect } from 'react';
import { PageRoute } from '../types';
import { PageHeader } from '../components/PageHeader';
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
  Share2
} from 'lucide-react';
import { WhatsAppOfficialIcon } from '../components/WhatsAppFloat';

interface ContactPageProps {
  currentRoute: PageRoute;
  setRoute: (route: PageRoute) => void;
}

const TikTokOfficialIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.89 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.3 0 .59.04.86.12V9.43a6.37 6.37 0 0 0-.86-.06A6.34 6.34 0 0 0 3 15.71 6.34 6.34 0 0 0 9.34 22a6.34 6.34 0 0 0 6.34-6.29V8.67a7.7 7.7 0 0 0 3.91 1.05v-3.03a4.87 4.87 0 0 1 0-.01v.01z" />
  </svg>
);

export const ContactPage: React.FC<ContactPageProps> = ({ currentRoute, setRoute }) => {
  const [companyData, setCompanyData] = useState({
    address: 'Shop No. 2, Ground Floor, Malik Saud Abdul Aziz Building, 8th Street, Al Rigga Road, Deira, Dubai, UAE – 125131',
    phones: ['+971 4 222 6182', '+971 55 558 6359'],
    whatsappNumber: '971555586359',
    whatsappDisplay: '+971 55 558 6359',
    email: COMPANY_CONFIG.email || 'info@zonetourism.ae',
    googleMapsUrl: COMPANY_CONFIG.googleMapsUrl,
    googleMapsEmbed: COMPANY_CONFIG.googleMapsEmbed,
    social: COMPANY_CONFIG.social
  });

  useEffect(() => {
    fetch(apiUrl('/api/company-info/public'))
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setCompanyData(prev => ({
            ...prev,
            address: json.data.address ? json.data.address.replace('Near Union Metro Station, Exit 2, ', '') : prev.address,
            phones: (json.data.phones && json.data.phones.length > 0) ? json.data.phones : prev.phones,
            whatsappNumber: '971555586359',
            whatsappDisplay: '+971 55 558 6359',
            email: json.data.email || (json.data.emails && json.data.emails[0]) || prev.email,
            googleMapsUrl: json.data.googleMapsUrl || prev.googleMapsUrl,
            googleMapsEmbed: json.data.googleMapsEmbed || prev.googleMapsEmbed,
            social: json.data.social ? { ...prev.social, ...json.data.social } : prev.social
          }));
        }
      })
      .catch(() => {});
  }, []);

  const cleanWaNumber = '971555586359';
  const whatsappUrl = `https://wa.me/${cleanWaNumber}?text=${encodeURIComponent('Hello Zone Tourism & Hotwheels Car Rental, I have an inquiry.')}`;

  const socialLinks = [
    {
      id: 'instagram',
      name: 'Instagram',
      handle: '@zonetourism.ae',
      url: companyData.social.instagram || 'https://instagram.com/zonetourism.ae',
      icon: Instagram,
      textColor: 'text-[#E1306C]',
      hoverBorder: 'hover:border-[#E1306C]'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      handle: 'Zone Tourism Dubai',
      url: companyData.social.facebook || 'https://facebook.com/zonetourismdubai',
      icon: Facebook,
      textColor: 'text-[#1877F2]',
      hoverBorder: 'hover:border-[#1877F2]'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      handle: 'Zone Tourism UAE',
      url: companyData.social.linkedin || 'https://linkedin.com/company/zone-tourism-uae',
      icon: Linkedin,
      textColor: 'text-[#0A66C2]',
      hoverBorder: 'hover:border-[#0A66C2]'
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      handle: '@zonetourism.ae',
      url: companyData.social.tiktok || 'https://www.tiktok.com/@zonetourism.ae',
      icon: TikTokOfficialIcon,
      textColor: 'text-slate-900',
      hoverBorder: 'hover:border-slate-900'
    }
  ];

  return (
    <div className="bg-[#F5F7FA] min-h-screen pb-12 space-y-5 sm:space-y-6">
      <PageHeader
        title="Contact Us"
        subtitle="Official contact details for Zone Tourism LLC and Hotwheels Car Rental LLC in Dubai, UAE."
        currentRoute={currentRoute}
        setRoute={setRoute}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        
        {/* DIRECT CONTACT DIRECTORY & INTERACTIVE GOOGLE MAP (BALANCED 2-COLUMN LAYOUT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
          
          {/* LEFT COLUMN: CORE CONTACT DETAILS (5 COLS) */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            
            {/* Card 1: Office Address */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#0B4DA2]/10 text-[#0B4DA2] flex items-center justify-center shrink-0 font-bold">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Office Location
                </span>
                <h4 className="text-sm font-extrabold text-[#0A2540]">Dubai Head Office</h4>
                <p className="text-xs font-semibold text-[#0A2540] mt-0.5">Dubai, United Arab Emirates</p>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  {companyData.address}
                </p>
              </div>
            </div>

            {/* Card 2: Official Phone Numbers */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#0B4DA2]/10 text-[#0B4DA2] flex items-center justify-center shrink-0 font-bold">
                <Phone className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Dubai, United Arab Emirates
                </span>
                <h4 className="text-sm font-extrabold text-[#0A2540]">Official Phone Numbers</h4>
                <div className="mt-1.5 space-y-1">
                  <div>
                    <a
                      href="tel:+97142226182"
                      className="block text-sm font-bold text-[#0B4DA2] hover:underline font-mono transition-colors"
                    >
                      +971 4 222 6182
                    </a>
                  </div>
                  <div>
                    <a
                      href="tel:+971555586359"
                      className="block text-sm font-bold text-[#0B4DA2] hover:underline font-mono transition-colors"
                    >
                      +971 55 558 6359
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: WhatsApp Desk */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-2.5">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#25D366]/15 text-[#25D366] flex items-center justify-center shrink-0 font-bold">
                  <WhatsAppOfficialIcon className="w-5 h-5 text-[#25D366]" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Direct Messaging
                  </span>
                  <h4 className="text-sm font-extrabold text-[#0A2540]">WhatsApp Desk</h4>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm font-bold text-[#0A2540] hover:text-[#25D366] mt-0.5 block font-mono transition-colors"
                  >
                    +971 55 558 6359
                  </a>
                </div>
              </div>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors min-h-[40px] cursor-pointer"
              >
                <WhatsAppOfficialIcon className="w-4 h-4 text-white" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>

            {/* Card 4: Official Email */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#0B4DA2]/10 text-[#0B4DA2] flex items-center justify-center shrink-0 font-bold">
                <Mail className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Email Channel
                </span>
                <h4 className="text-sm font-extrabold text-[#0A2540]">Official Inquiries</h4>
                <a 
                  href={`mailto:${companyData.email}`} 
                  className="text-xs font-bold text-[#0B4DA2] hover:underline block mt-0.5 truncate"
                >
                  {companyData.email}
                </a>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: GOOGLE MAPS CARD (7 COLS) */}
          <div className="lg:col-span-7">
            <section className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between h-full space-y-4">
              
              {/* Map Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B4DA2] uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Office Location</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-[#0A2540]">
                    Google Maps
                  </h3>
                </div>

                <a
                  href={companyData.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B4DA2] hover:bg-[#083B7D] text-white text-xs font-bold transition-colors shadow-xs w-full sm:w-auto min-h-[38px]"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Embedded Google Maps Container */}
              <div className="w-full flex-1 min-h-[300px] lg:min-h-[350px] rounded-2xl overflow-hidden border border-slate-200 relative bg-[#F5F7FA]">
                {companyData.googleMapsEmbed ? (
                  <iframe
                    title="Zone Tourism LLC & Hotwheels Car Rental LLC - Dubai Office Map"
                    src={companyData.googleMapsEmbed}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={false}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-full absolute inset-0"
                  ></iframe>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-2">
                    <MapPin className="w-8 h-8 text-[#0B4DA2]" />
                    <p className="font-semibold text-sm text-[#0A2540]">{companyData.address}</p>
                    <a
                      href={companyData.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#0B4DA2] hover:underline font-bold"
                    >
                      Open in Google Maps
                    </a>
                  </div>
                )}
              </div>

            </section>
          </div>

        </div>

        {/* COMPACT & BALANCED SOCIAL MEDIA BAR (4 CHANNELS) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center md:text-left self-center">
            <div className="w-10 h-10 rounded-xl bg-[#0B4DA2]/10 text-[#0B4DA2] flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div className="flex items-center">
              <h4 className="text-sm sm:text-base font-extrabold text-[#0A2540] leading-none">Official Social Media</h4>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full md:w-auto items-center">
            {socialLinks.map((item) => {
              const IconComp = item.icon;
              return (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-white border border-slate-200 ${item.hoverBorder} transition-all text-slate-700 hover:text-[#0A2540] text-xs font-bold shadow-2xs group cursor-pointer`}
                >
                  <IconComp className={`w-4 h-4 ${item.textColor}`} />
                  <span>{item.name}</span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-slate-600 ml-0.5" />
                </a>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
