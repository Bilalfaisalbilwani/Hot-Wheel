import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, Car, ChevronLeft, ChevronRight, 
  Image as ImageIcon, Users, Briefcase, 
  Settings2, LayoutGrid
} from 'lucide-react';
import { WhatsAppOfficialIcon } from './WhatsAppFloat';
import { COMPANY_CONFIG } from '../data/travelData';
import { buildWhatsAppLink, PRIMARY_WHATSAPP_NUMBER } from '../utils/whatsapp';

export interface MediaVehicle {
  id?: string | number;
  make?: string;
  model?: string;
  category?: string;
  image?: string;
  gallery?: string[];
  images?: string[] | Array<{ imageUrl: string }>;
  videoUrl?: string;
  video?: string;
  transmission?: string;
  dailyPriceAED?: number;
  dailyPriceUSD?: number;
  weeklyPriceAED?: number;
  weeklyPriceUSD?: number;
  monthlyPriceAED?: number;
  monthlyPriceUSD?: number;
  yearlyPriceAED?: number;
  yearlyPriceUSD?: number;
  dailyPrice?: number;
  weeklyPrice?: number;
  monthlyPrice?: number;
  seats?: number;
  luggage?: string | number;
  luggageCapacity?: string;
  description?: string;
  isMercedesChauffeur?: boolean;
  serviceType?: string;
  rentalType?: string;
}

interface CarMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: MediaVehicle | null;
  initialMode?: 'photo' | 'video';
  onOpenEnquiry?: (type: 'visa' | 'car-rental', item?: string) => void;
}

// Generate matching multi-angle gallery photos for any car
function getVehicleGallery(car: MediaVehicle): string[] {
  if (car.gallery && Array.isArray(car.gallery) && car.gallery.length > 0) {
    const list = car.gallery.filter(Boolean);
    if (list.length > 0) return list;
  }
  if (car.images && Array.isArray(car.images) && car.images.length > 0) {
    const list = car.images.map((img: any) => typeof img === 'string' ? img : img.imageUrl).filter(Boolean);
    if (list.length > 0) return list;
  }
  if (car.image) {
    return [car.image];
  }
  return ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80'];
}

export const CarMediaModal: React.FC<CarMediaModalProps> = ({
  isOpen,
  onClose,
  car,
  onOpenEnquiry
}) => {
  const [activeMedia, setActiveMedia] = useState<'grid' | number>(0);

  const gallery = car ? getVehicleGallery(car) : [];
  const hasMultipleMedia = gallery.length > 1;

  // Initialize active media when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveMedia(0);
    }
  }, [isOpen, car]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        if (typeof activeMedia === 'number' && gallery.length > 1) {
          setActiveMedia(prev => (typeof prev === 'number' ? (prev === 0 ? gallery.length - 1 : prev - 1) : 0));
        }
      } else if (e.key === 'ArrowRight') {
        if (typeof activeMedia === 'number' && gallery.length > 1) {
          setActiveMedia(prev => (typeof prev === 'number' ? (prev === gallery.length - 1 ? 0 : prev + 1) : 0));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeMedia, gallery.length, onClose]);

  if (!isOpen || !car) return null;

  // Next / Previous Photo Nav
  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof activeMedia === 'number') {
      setActiveMedia(prev => (typeof prev === 'number' ? (prev === 0 ? gallery.length - 1 : prev - 1) : 0));
    }
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof activeMedia === 'number') {
      setActiveMedia(prev => {
        if (typeof prev === 'number') {
          return prev === gallery.length - 1 ? 0 : prev + 1;
        }
        return 0;
      });
    }
  };

  const makeModel = `${car.make || ''} ${car.model || ''}`.trim() || 'Vehicle';
  const isChauffeur = car.isMercedesChauffeur || car.serviceType === 'CHAUFFEUR DRIVEN' || car.rentalType === 'Chauffeur Driven';

  const dailyPriceAED = car.dailyPriceAED || car.dailyPrice || 0;
  const weeklyPriceAED = car.weeklyPriceAED || car.weeklyPrice || (dailyPriceAED ? dailyPriceAED * 6 : 0);
  const monthlyPriceAED = car.monthlyPriceAED || car.monthlyPrice || (dailyPriceAED ? dailyPriceAED * 20 : 0);

  const dailyPriceUSD = car.dailyPriceUSD || (dailyPriceAED ? Math.round(dailyPriceAED / 3.67) : 0);
  const weeklyPriceUSD = car.weeklyPriceUSD || (weeklyPriceAED ? Math.round(weeklyPriceAED / 3.67) : 0);
  const monthlyPriceUSD = car.monthlyPriceUSD || (monthlyPriceAED ? Math.round(monthlyPriceAED / 3.67) : 0);

  const transmission = car.transmission || 'Automatic';
  const serviceText = car.serviceType || car.rentalType || (isChauffeur ? 'Chauffeur Driven' : 'Self Drive');

  const waText = isChauffeur
    ? `Hello Hotwheels Car Rental LLC, I am inquiring about the ${makeModel} (${car.category || 'Luxury'} - Chauffeur Driven). Please share rates and availability.`
    : `Hello Hotwheels Car Rental LLC, I am inquiring about the ${makeModel} (${car.category || 'Sedan'} - Self Drive). Please share rates and availability.`;

  const whatsappUrl = buildWhatsAppLink(waText, COMPANY_CONFIG.whatsappNumber || PRIMARY_WHATSAPP_NUMBER);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-5xl bg-[#0A2540] text-white rounded-3xl overflow-hidden shadow-2xl border border-white/15 flex flex-col max-h-[94vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* 1. Header Bar with Direct Media Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/10 bg-slate-900/95 shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0B4DA2] flex items-center justify-center text-white font-bold shadow-md shrink-0">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  {makeModel}
                </h3>
                {car.category && (
                  <span className="px-2 py-0.5 rounded-full bg-white/15 text-slate-200 text-[10px] font-bold uppercase tracking-wider">
                    {car.category}
                  </span>
                )}
                {car.isMercedesChauffeur && (
                  <span className="px-2 py-0.5 rounded-full bg-[#C9A227] text-[#0A2540] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> VIP Chauffeur
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 flex items-center gap-2">
                <span>📸 {gallery.length} High-Resolution Photo{gallery.length > 1 ? 's' : ''}</span>
              </p>
            </div>
          </div>

          {/* Quick Media Mode Toggle Tabs + Close */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
            {/* Photos Switch Tab */}
            <button
              type="button"
              onClick={() => setActiveMedia(0)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                typeof activeMedia === 'number'
                  ? 'bg-white text-[#0A2540] shadow-sm ring-2 ring-white/50'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#0B4DA2]" />
              <span>Photos ({gallery.length})</span>
            </button>

            {/* View All Media Grid Tab (If multiple media) */}
            {hasMultipleMedia && (
              <button
                type="button"
                onClick={() => setActiveMedia('grid')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeMedia === 'grid'
                    ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
                }`}
                title="View all photos in grid"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid View ({gallery.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-1"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Main Media Viewport */}
        <div className="relative w-full bg-black flex items-center justify-center min-h-[260px] sm:min-h-[360px] md:min-h-[420px] max-h-[52vh] overflow-hidden group select-none">
          
          {/* Mode 1: All Media Grid Overview */}
          {activeMedia === 'grid' ? (
            <div className="w-full h-full max-h-[52vh] overflow-y-auto p-4 sm:p-6 bg-slate-950">
              <div className="max-w-4xl mx-auto space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-white/10 pb-2">
                  <span>Click any photo below to view full-size:</span>
                  <span className="text-[#C9A227] font-bold">{gallery.length} Photos</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                  {/* Photo Tiles */}
                  {gallery.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveMedia(idx)}
                      className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-slate-800 border border-white/20 hover:border-[#C9A227] cursor-pointer group/tile shadow-md hover:scale-102 transition-all"
                    >
                      <img
                        src={imgUrl}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover group-hover/tile:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover/tile:opacity-100 transition-opacity flex items-end p-2.5">
                        <div className="flex items-center justify-between w-full text-[11px] font-bold text-white">
                          <span>Photo #{idx + 1}</span>
                          <span className="px-1.5 py-0.5 rounded bg-black/60 text-[9px]">{idx + 1}/{gallery.length}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Mode 2: Photo Display */
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={gallery[activeMedia as number] || car.image}
                alt={`${makeModel} Photo ${Number(activeMedia) + 1}`}
                className="w-full max-h-[52vh] object-contain transition-all duration-300"
              />

              {/* Photo Counter */}
              {gallery.length > 1 && (
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-xs text-white text-xs font-bold border border-white/20 flex items-center gap-2 shadow-md">
                  <ImageIcon className="w-3.5 h-3.5 text-[#C9A227]" />
                  <span>Photo {Number(activeMedia) + 1} of {gallery.length}</span>
                </div>
              )}
            </div>
          )}

          {/* Left / Right Navigation Arrows (Visible only if multiple photos) */}
          {activeMedia !== 'grid' && hasMultipleMedia && (
            <>
              <button
                type="button"
                onClick={handlePrevPhoto}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/65 hover:bg-[#0B4DA2] text-white flex items-center justify-center transition-all cursor-pointer opacity-85 hover:opacity-100 shadow-xl z-20 border border-white/20"
                title="Previous photo"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleNextPhoto}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/65 hover:bg-[#0B4DA2] text-white flex items-center justify-center transition-all cursor-pointer opacity-85 hover:opacity-100 shadow-xl z-20 border border-white/20"
                title="Next photo"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* 3. Interactive Multi-Media Strip (Thumbnails shown only if multiple media exist) */}
        {hasMultipleMedia && (
          <div className="p-3 bg-slate-900/95 border-t border-white/10 overflow-x-auto scrollbar-none shrink-0">
            <div className="flex items-center gap-2.5 max-w-max mx-auto px-2">
              
              {gallery.map((imgUrl, idx) => {
                const isSelected = activeMedia === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveMedia(idx)}
                    className={`relative w-20 sm:w-24 h-12 sm:h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 group text-left ${
                      isSelected 
                        ? 'border-[#C9A227] scale-105 shadow-lg ring-2 ring-[#C9A227]/60' 
                        : 'border-white/20 opacity-60 hover:opacity-100 hover:border-white/50'
                    }`}
                    title={`View Photo ${idx + 1}`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Thumb ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <span className="absolute top-1 right-1 px-1.5 py-0.2 rounded bg-black/70 text-[8px] font-bold text-white">
                      {idx + 1}
                    </span>
                  </button>
                );
              })}

            </div>
          </div>
        )}

        {/* 4. Specifications, Transparent Pricing & Fast Booking Bar */}
        <div className="p-4 sm:p-5 bg-slate-900 border-t border-white/10 flex flex-col space-y-4 shrink-0 overflow-y-auto max-h-[30vh]">
          
          {/* Top row: Specifications Badges */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs">
            <span className="px-3 py-1 rounded-xl bg-white/10 text-white font-bold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#C9A227]" />
              <span>{car.seats || 5} Seats</span>
            </span>

            <span className="px-3 py-1 rounded-xl bg-white/10 text-white font-bold flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-[#C9A227]" />
              <span>{car.luggage || car.luggageCapacity || '2 Bags'}</span>
            </span>

            <span className="px-3 py-1 rounded-xl bg-white/10 text-white font-bold flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5 text-[#C9A227]" />
              <span>{transmission}</span>
            </span>

            <span className="px-3 py-1 rounded-xl bg-white/10 text-slate-200 font-bold">
              {serviceText}
            </span>
          </div>

          {/* Middle row: Rates breakdown (Daily / Weekly / Monthly) */}
          {dailyPriceAED > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
              <div className="p-2 rounded-xl bg-white/5">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Daily Rate</span>
                <span className="text-xs sm:text-sm font-black text-white">د.إ {dailyPriceAED.toLocaleString()}</span>
                {dailyPriceUSD > 0 && <span className="text-[10px] text-slate-400 block">(${dailyPriceUSD})</span>}
              </div>

              <div className="p-2 rounded-xl bg-white/5">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Weekly Rate</span>
                <span className="text-xs sm:text-sm font-black text-white">د.إ {weeklyPriceAED.toLocaleString()}</span>
                {weeklyPriceUSD > 0 && <span className="text-[10px] text-slate-400 block">(${weeklyPriceUSD})</span>}
              </div>

              <div className="p-2 rounded-xl bg-white/5">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Monthly Rate</span>
                <span className="text-xs sm:text-sm font-black text-[#C9A227]">د.إ {monthlyPriceAED.toLocaleString()}</span>
                {monthlyPriceUSD > 0 && <span className="text-[10px] text-amber-200/80 block">(${monthlyPriceUSD})</span>}
              </div>
            </div>
          )}

          {/* Description */}
          {car.description && (
            <p className="text-xs text-slate-300 leading-relaxed">
              {car.description}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2.5 pt-1">
            {onOpenEnquiry && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEnquiry('car-rental', makeModel);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer text-center"
              >
                Instant Enquiry Form
              </button>
            )}

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-center"
            >
              <WhatsAppOfficialIcon className="w-4 h-4 text-white" />
              <span>Book / Enquire on WhatsApp</span>
            </a>
          </div>

        </div>

      </div>
    </div>
  );
};

export const CarVideoModal = CarMediaModal;
export const CarPhotoModal = CarMediaModal;
export default CarMediaModal;
