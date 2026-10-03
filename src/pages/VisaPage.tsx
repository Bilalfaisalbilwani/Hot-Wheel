import React, { useState, useRef } from 'react';
import { PageRoute } from '../types';
import { PageHeader } from '../components/PageHeader';
import { COMPANY_CONFIG, VISA_DISCLAIMER } from '../data/travelData';
import { VisaApplicationForm, APPROVED_UAE_VISA_OPTIONS } from '../components/VisaApplicationForm';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  UploadCloud, 
  Calendar, 
  Phone, 
  Info, 
  Check, 
  ChevronDown, 
  ChevronUp,
  FileCheck2
} from 'lucide-react';
import { WhatsAppOfficialIcon } from '../components/WhatsAppFloat';

interface VisaPageProps {
  currentRoute: PageRoute;
  setRoute: (route: PageRoute) => void;
  onOpenVisaApp?: (visaTypeId?: string) => void;
  onOpenEnquiry?: (type?: 'visa' | 'car-rental', initialDestination?: string) => void;
}

const REQUIRED_DOCUMENTS = [
  { name: 'Passport Copy (Bio-Data Page)', note: 'Minimum 6 months validity from intended travel date', required: true },
  { name: 'Passport Cover Page', note: 'Clear front cover scan or photo', required: true },
  { name: 'Recent Passport Photograph', note: 'White background, clear face view', required: true },
  { name: 'National ID Card (Front & Back)', note: 'If applicable for applicant nationality', required: false },
  { name: 'Confirmed Return / Onward Air Ticket', note: 'If required for immigration clearance', required: false }
];

const ADDITIONAL_DOCUMENTS_GUIDE = [
  'Previous UAE Visa Copy',
  'Previous UAE Entry / Exit Record',
  'Guarantor / Sponsor Documents',
  'UAE Residence Visa & Emirates ID of Relative / Sponsor',
  'Relationship Proof (Affidavit, Family Registration)',
  'Birth Certificate for Children / Minors',
  'Marriage Certificate for Spouse',
  'Hotel Booking / UAE Accommodation Details',
  'Bank Statement or Proof of Funds',
  'Previous Travel History / Visa Copies (UK, USA, Schengen, etc.)'
];

export const VisaPage: React.FC<VisaPageProps> = ({
  currentRoute,
  setRoute
}) => {
  const [selectedVisaCard, setSelectedVisaCard] = useState('30 Days – Single Entry');
  const [showGuidelines, setShowGuidelines] = useState(false);
  const applicationPortalRef = useRef<HTMLDivElement>(null);

  const scrollToApplication = (visaLabel?: string) => {
    if (visaLabel) {
      setSelectedVisaCard(visaLabel);
    }
    if (applicationPortalRef.current) {
      applicationPortalRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const whatsappGeneralUrl = `https://wa.me/${COMPANY_CONFIG.whatsappNumber}?text=${encodeURIComponent(
    'Hello Zone Tourism, I would like to inquire about UAE Visit Visa services in Dubai.'
  )}`;

  return (
    <div className="bg-[#F5F7FA] min-h-screen space-y-12 sm:space-y-16 pb-20">
      
      {/* 1. Page Header */}
      <PageHeader
        title="UAE Visa Services & Online Application"
        subtitle="Zone Tourism LLC • Official UAE Visit Visa Processing, Document Verification & Application Desk in Dubai."
        currentRoute={currentRoute}
        setRoute={setRoute}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        
        {/* 2. APPROVED UAE VISA OPTIONS CARDS (4 EXACT APPROVED TYPES) */}
        <section id="approved-visa-types-section" className="space-y-6">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0B4DA2]/10 text-[#0B4DA2] text-xs font-bold uppercase tracking-wider">
              Approved Visa Categories
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0A2540] tracking-tight">
              UAE Visit Visa Options
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Select your required visa category to begin your official application with document uploads.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {APPROVED_UAE_VISA_OPTIONS.map((item) => {
              const isSelected = selectedVisaCard === item.label;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-3xl p-6 border-2 transition-all flex flex-col justify-between space-y-4 hover:shadow-lg ${
                    isSelected ? 'border-[#0B4DA2] ring-2 ring-[#0B4DA2]/20' : 'border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-[#0B4DA2] px-2.5 py-1 rounded-lg">
                        {item.duration}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        {item.entry}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-[#0A2540]">
                        {item.label}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Official tourist & visit permit for Dubai and all 7 Emirates of the UAE.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F5F7FA] border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[#0A2540]">
                        <Clock className="w-3.5 h-3.5 text-[#0B4DA2]" />
                        <span>Processing Time</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Subject to nationality and UAE Immigration approval.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <button
                      type="button"
                      onClick={() => scrollToApplication(item.label)}
                      className="w-full py-2.5 px-3 rounded-xl bg-[#0B4DA2] hover:bg-[#083B7D] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px]"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Apply for {item.duration}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. DEDICATED MULTI-STEP VISA APPLICATION FORM */}
        <section id="visa-online-application-portal" ref={applicationPortalRef} className="scroll-mt-8">
          <VisaApplicationForm initialVisaType={selectedVisaCard} />
        </section>

        {/* 4. DOCUMENT REQUIREMENTS & REGULATORY GUIDELINES ACCORDION */}
        <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B4DA2] uppercase tracking-wider mb-1">
                <FileCheck2 className="w-4 h-4" />
                <span>Documentation Checklist</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[#0A2540]">
                Required & Additional Documents Guide
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setShowGuidelines(!showGuidelines)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors self-start sm:self-auto cursor-pointer"
            >
              <span>{showGuidelines ? 'Hide Details' : 'View Detailed Guidelines'}</span>
              {showGuidelines ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Core Documents Box */}
            <div className="p-5 rounded-2xl bg-[#F5F7FA] border border-slate-200/90 space-y-3">
              <h4 className="font-extrabold text-[#0A2540] text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Mandatory Documents for All Applicants</span>
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-600">
                {REQUIRED_DOCUMENTS.map((doc, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0B4DA2] mt-1.5 shrink-0" />
                    <div>
                      <span className="font-bold text-[#0A2540]">{doc.name}</span>
                      {doc.required && <span className="text-rose-500 font-bold ml-1">*</span>}
                      <p className="text-[11px] text-slate-500">{doc.note}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Additional Documents Box */}
            <div className="p-5 rounded-2xl bg-[#F5F7FA] border border-slate-200/90 space-y-3">
              <h4 className="font-extrabold text-[#0A2540] text-sm flex items-center gap-2">
                <Info className="w-4 h-4 text-[#0B4DA2]" />
                <span>Additional Documents — If Required</span>
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Additional documents may be requested depending on nationality, age, gender, and immigration profile:
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                {ADDITIONAL_DOCUMENTS_GUIDE.map((doc, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                    <span className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Expanded Regulatory Disclaimers */}
          {showGuidelines && (
            <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-slate-700 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Important UAE Immigration Guidelines & Compliance</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 pl-1 leading-relaxed">
                <li><strong>Approval Authority:</strong> Visa approval, rejection, security clearance and processing timelines are strictly determined by the relevant UAE Immigration Authorities.</li>
                <li><strong>No Guarantee:</strong> Submission of documents or payment of service fees does not guarantee visa approval.</li>
                <li><strong>Passport Validity:</strong> Passports must be valid for at least 6 months from the date of intended entry into the UAE.</li>
                <li><strong>Non-Refundable Policy:</strong> Visa fees and service charges are non-refundable once the application has been lodged with immigration.</li>
              </ul>
            </div>
          )}

          {/* Quick Support Desk Banner */}
          <div className="p-4 rounded-2xl bg-[#0A2540] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#C9A227] shrink-0 font-bold">
                <WhatsAppOfficialIcon className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Have a question regarding UAE Visas?</h4>
                <p className="text-xs text-slate-300">Connect with our Dubai visa operations desk for instant assistance.</p>
              </div>
            </div>

            <a
              href={whatsappGeneralUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shrink-0"
            >
              <WhatsAppOfficialIcon className="w-4 h-4 fill-current" />
              <span>Contact Visa Desk</span>
            </a>
          </div>

        </section>

      </div>
    </div>
  );
};
