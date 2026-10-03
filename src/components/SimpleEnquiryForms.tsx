import { apiUrl, readApiJson } from '../utils/api';
import React, { useState, useEffect } from 'react';
import { COMPANY_CONFIG } from '../data/travelData';
import { CarRentalEnquiryPayload, EnquirySubmissionResult } from '../types';
import { 
  formatCarRentalEnquiryWhatsApp, 
  buildWhatsAppLink, 
  openWhatsAppDirectly, 
  PRIMARY_WHATSAPP_NUMBER 
} from '../utils/whatsapp';
import { sendCarRentalEnquiryEmail } from '../utils/emailjsService';
import { ProfessionalDatePicker } from './ProfessionalDatePicker';
import { PhoneNumberField, buildPhoneNumber } from './PhoneNumberField';
import { 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Car, 
  MapPin, 
  Phone, 
  RefreshCw,
  Check,
  X
} from 'lucide-react';
import { WhatsAppOfficialIcon } from './WhatsAppFloat';

const PICKUP_LOCATIONS = [
  'Dubai International Airport (DXB) - Terminal 1',
  'Dubai International Airport (DXB) - Terminal 2',
  'Dubai International Airport (DXB) - Terminal 3',
  'Al Maktoum International Airport (DWC)',
  'Downtown Dubai / Burj Khalifa',
  'Dubai Marina / JBR',
  'Business Bay',
  'Hotel / Doorstep Delivery',
  'Hotwheels Car Rental Main Office'
];

const VEHICLE_TYPES = [
  'Sedan',
  'SUV',
  'Luxury',
  '7-Seater / MPV'
];

const getTodayDateString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

/* =========================================================================
   CAR RENTAL ENQUIRY FORM
   Client-Specified Fields:
   - Pickup Location
   - Pickup Date
   - Return Date
   - Self Drive / Chauffeur
   - Vehicle Type
   - WhatsApp Number
   Button: Submit Enquiry
   ========================================================================= */
export interface CarRentalEnquiryFormProps {
  onSuccess?: (result: EnquirySubmissionResult) => void;
  className?: string;
  defaultServiceType?: 'Self Drive' | 'Chauffeur';
  defaultVehicleType?: string;
  initialVehicleType?: string;
}

export const CarRentalEnquiryForm: React.FC<CarRentalEnquiryFormProps> = ({
  onSuccess,
  className = '',
  defaultServiceType = 'Self Drive',
  defaultVehicleType = '',
  initialVehicleType
}) => {
  const [formData, setFormData] = useState<CarRentalEnquiryPayload>({
    pickupLocation: '',
    dropoffLocation: '',
    pickupDate: '',
    pickupTime: '',
    returnDate: '',
    returnTime: '',
    serviceType: defaultServiceType,
    vehicleType: initialVehicleType || defaultVehicleType || 'Sedan',
    whatsappNumber: ''
  });
  const [whatsappCountryCode, setWhatsappCountryCode] = useState('+92');
  const [whatsappLocalNumber, setWhatsappLocalNumber] = useState('');

  const [availableVehicles, setAvailableVehicles] = useState<string[]>(VEHICLE_TYPES);
  const [errors, setErrors] = useState<Partial<Record<keyof CarRentalEnquiryPayload, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<EnquirySubmissionResult | null>(null);

  // Fetch live active vehicles from database
  useEffect(() => {
    let isMounted = true;
    const fetchFleetOptions = async () => {
      try {
        const res = await fetch(apiUrl('/api/cars'));
        const json = await readApiJson(res);
        if (isMounted && json.success && Array.isArray(json.data) && json.data.length > 0) {
          const dynamicModels = json.data.map((c: any) => `${c.make} ${c.model}`.trim()).filter(Boolean);
          const combined = Array.from(new Set([...dynamicModels, ...VEHICLE_TYPES]));
          setAvailableVehicles(combined);
        }
      } catch (err) {
        // Fallback remains VEHICLE_TYPES
      }
    };
    fetchFleetOptions();
    return () => {
      isMounted = false;
    };
  }, []);

  // Synchronize when initialVehicleType prop changes
  useEffect(() => {
    if (initialVehicleType) {
      setFormData(prev => ({ ...prev, vehicleType: initialVehicleType }));
    }
  }, [initialVehicleType]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CarRentalEnquiryPayload, string>> = {};

    if (!formData.pickupLocation.trim()) {
      newErrors.pickupLocation = 'Please specify a pickup location.';
    }

    if (!formData.dropoffLocation.trim()) {
      newErrors.dropoffLocation = 'Please select a drop-off location.';
    }

    if (!formData.pickupDate) {
      newErrors.pickupDate = 'Please select a pickup date.';
    }

    if (!formData.pickupTime) {
      newErrors.pickupTime = 'Please select a pickup time.';
    }

    if (!formData.returnDate) {
      newErrors.returnDate = 'Please select a return date.';
    } else if (formData.pickupDate && new Date(formData.returnDate) < new Date(formData.pickupDate)) {
      newErrors.returnDate = 'Return date cannot be earlier than pickup date.';
    }

    if (!formData.returnTime) {
      newErrors.returnTime = 'Please select a return time.';
    }

    if (!formData.serviceType) {
      newErrors.serviceType = 'Please select Self Drive or Chauffeur.';
    }

    if (!formData.vehicleType.trim()) {
      newErrors.vehicleType = 'Please select a vehicle type.';
    }

    const cleanPhone = whatsappLocalNumber.replace(/\D/g, '');
    if (!whatsappLocalNumber.trim()) {
      newErrors.whatsappNumber = 'Please enter your WhatsApp number.';
    } else if (cleanPhone.length < 7) {
      newErrors.whatsappNumber = 'Please enter a valid WhatsApp number.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildWhatsAppUrl = (refId: string) => {
    const message = formatCarRentalEnquiryWhatsApp({
      pickupLocation: formData.pickupLocation,
      dropoffLocation: formData.dropoffLocation,
      pickupDate: formData.pickupDate,
      pickupTime: formData.pickupTime,
      returnDate: formData.returnDate,
      returnTime: formData.returnTime,
      serviceType: formData.serviceType,
      vehicleType: formData.vehicleType,
      whatsappNumber: buildPhoneNumber(whatsappCountryCode, whatsappLocalNumber),
      referenceId: refId
    });
    return buildWhatsAppLink(message, COMPANY_CONFIG.whatsappNumber || PRIMARY_WHATSAPP_NUMBER);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) {
      return;
    }

    setIsLoading(true);
    const submittedFormData = { ...formData, whatsappNumber: buildPhoneNumber(whatsappCountryCode, whatsappLocalNumber) };

    try {
      const response = await fetch(apiUrl('/api/enquiries/car-rental'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submittedFormData)
      });

      const data = await readApiJson(response);

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit quote request. Please try again.');
      }

      const refId = data.referenceId || `HWZ-CR-${Math.floor(10000 + Math.random() * 90000)}`;

      const result: EnquirySubmissionResult = {
        success: true,
        referenceId: refId,
        message: data.message || 'Quote request received successfully',
        timestamp: data.timestamp || new Date().toISOString(),
        routedTo: data.routedTo || {
          team: 'Hotwheels Car Rental Dispatch & Operations Team',
          email: COMPANY_CONFIG.email,
          whatsappNumber: COMPANY_CONFIG.whatsappNumber || PRIMARY_WHATSAPP_NUMBER
        }
      };

      setSubmissionResult(result);
      if (onSuccess) onSuccess(result);

      // Instantly open WhatsApp with the complete car rental dataset
      const waMsg = formatCarRentalEnquiryWhatsApp({
        pickupLocation: formData.pickupLocation,
        pickupDate: formData.pickupDate,
        returnDate: formData.returnDate,
        serviceType: formData.serviceType,
        vehicleType: formData.vehicleType,
        whatsappNumber: submittedFormData.whatsappNumber,
        referenceId: refId
      });
      openWhatsAppDirectly(waMsg, COMPANY_CONFIG.whatsappNumber || PRIMARY_WHATSAPP_NUMBER);

      // Send EmailJS email in the background alongside WhatsApp
      try {
        await sendCarRentalEnquiryEmail({
          reference_id: refId,
          pickup_location: formData.pickupLocation,
          dropoff_location: formData.dropoffLocation,
          pickup_date: formData.pickupDate,
          pickup_time: formData.pickupTime,
          return_date: formData.returnDate,
          return_time: formData.returnTime,
          service_type: formData.serviceType,
          vehicle_type: formData.vehicleType,
          whatsapp_number: submittedFormData.whatsappNumber
        });
      } catch (emailErr) {
        console.error('[EmailJS] Car rental enquiry email sending error:', emailErr);
      }
    } catch (err: any) {
      setServerError(err.message || 'Network error while submitting quote request.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      pickupLocation: '',
      dropoffLocation: '',
      pickupDate: '',
      pickupTime: '',
      returnDate: '',
      returnTime: '',
      serviceType: defaultServiceType,
      vehicleType: initialVehicleType || defaultVehicleType || 'Sedan',
      whatsappNumber: ''
    });
    setWhatsappCountryCode('+92');
    setWhatsappLocalNumber('');
    setErrors({});
    setServerError(null);
    setSubmissionResult(null);
  };

  // SUCCESS VIEW: Customer contacts team through WhatsApp
  if (submissionResult) {
    const waUrl = buildWhatsAppUrl(submissionResult.referenceId);

    return (
      <div id="car-enquiry-success" className={`p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm text-center space-y-6 ${className}`}>
        <div className="w-16 h-16 rounded-2xl bg-[#0B4DA2]/10 text-[#0B4DA2] flex items-center justify-center mx-auto border border-[#0B4DA2]/20">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5F7FA] text-[#0A2540] text-xs font-bold uppercase tracking-wider border border-slate-200">
            <span>Enquiry Reference:</span>
            <span className="font-mono text-[#0B4DA2] font-black">{submissionResult.referenceId}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-[#0A2540]">
            Enquiry Received!
          </h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Your enquiry has been received by <strong className="text-[#0A2540]">HOTWHEELS CAR RENTAL LLC</strong>. You can now contact our team directly on WhatsApp regarding your enquiry.
          </p>
        </div>

        {/* Structured Summary of the 6 Submitted Fields */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2.5 text-slate-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="sm:col-span-2">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Pickup Location</span>
              <span className="font-semibold text-[#0A2540]">{formData.pickupLocation}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Drop-off Location</span>
              <span className="font-semibold text-[#0A2540]">{formData.dropoffLocation}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Pickup Date & Time</span>
              <span className="font-semibold text-[#0A2540]">{formData.pickupDate} • {formData.pickupTime}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Return Date & Time</span>
              <span className="font-semibold text-[#0A2540]">{formData.returnDate} • {formData.returnTime}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Self Drive / Chauffeur</span>
              <span className="font-semibold text-[#0A2540]">{formData.serviceType}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Vehicle Type</span>
              <span className="font-semibold text-[#0A2540] truncate block">{formData.vehicleType}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">WhatsApp Number</span>
              <span className="font-semibold text-[#0A2540]">{buildPhoneNumber(whatsappCountryCode, whatsappLocalNumber)}</span>
            </div>
          </div>
        </div>

        {/* Contact Team Through WhatsApp CTA */}
        <div className="space-y-3 pt-2">
          <a
            id="car-whatsapp-continue-btn"
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-6 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <WhatsAppOfficialIcon className="w-5 h-5 fill-current shrink-0" />
            <span>Contact Team on WhatsApp</span>
          </a>

          <button
            id="car-submit-another-btn"
            type="button"
            onClick={handleReset}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:text-[#0A2540] hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Submit Another Enquiry</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <form id="car-rental-enquiry-form" onSubmit={handleSubmit} className={`space-y-4 ${className}`} noValidate>
      {/* Error state */}
      {serverError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Submission Failed</p>
            <p className="mt-0.5 text-rose-700">{serverError}</p>
          </div>
        </div>
      )}

      {/* 1. Pickup Location */}
      <div>
        <label htmlFor="car-field-pickup-location" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          Pickup Location <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            id="car-field-pickup-location"
            type="text"
            list="car-pickup-location-suggestions"
            required
            disabled={isLoading}
            placeholder="Airport, City Center, or Hotel"
            value={formData.pickupLocation}
            onChange={(e) => {
              setFormData({ ...formData, pickupLocation: e.target.value });
              if (errors.pickupLocation) setErrors({ ...errors, pickupLocation: undefined });
            }}
            className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 min-h-[44px] ${
              errors.pickupLocation 
                ? 'border-rose-400 bg-rose-50/40 focus:ring-rose-400 text-rose-900' 
                : 'border-slate-300 bg-white focus:border-[#0B4DA2] focus:ring-[#0B4DA2]/20 text-slate-900'
            }`}
          />
          <datalist id="car-pickup-location-suggestions">
            {PICKUP_LOCATIONS.map(loc => <option key={loc} value={loc} />)}
          </datalist>
        </div>
        {errors.pickupLocation && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.pickupLocation}</p>}
      </div>

      {/* 2. Drop-off Location */}
      <div>
        <label htmlFor="car-field-dropoff-location" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          Drop-off Location <span className="text-rose-500">*</span>
        </label>
        <select
          id="car-field-dropoff-location"
          required
          disabled={isLoading}
          value={formData.dropoffLocation}
          onChange={(e) => {
            setFormData({ ...formData, dropoffLocation: e.target.value });
            if (errors.dropoffLocation) setErrors({ ...errors, dropoffLocation: undefined });
          }}
          className={`w-full px-3.5 py-2.5 rounded-xl border text-sm min-h-[44px] bg-white focus:outline-none focus:ring-2 focus:ring-[#0B4DA2]/20 ${
            errors.dropoffLocation ? 'border-rose-400 bg-rose-50/40' : 'border-slate-300 focus:border-[#0B4DA2]'
          }`}
        >
          <option value="">Select drop-off location</option>
          {PICKUP_LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
        </select>
        {errors.dropoffLocation && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.dropoffLocation}</p>}
      </div>

      {/* 3 & 4. Pickup Date/Time & Return Date/Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <ProfessionalDatePicker
            id="car-field-pickup-date"
            label="Pickup Date"
            required
            disabled={isLoading}
            minDate={getTodayDateString()}
            value={formData.pickupDate}
            error={errors.pickupDate}
            onChange={(val) => {
              setFormData({ ...formData, pickupDate: val });
              if (errors.pickupDate) setErrors({ ...errors, pickupDate: undefined });
            }}
            placeholder="Select Pickup Date"
          />
          <input
            type="time"
            required
            disabled={isLoading}
            value={formData.pickupTime}
            onChange={(e) => {
              setFormData({ ...formData, pickupTime: e.target.value });
              if (errors.pickupTime) setErrors({ ...errors, pickupTime: undefined });
            }}
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm min-h-[44px] focus:outline-none focus:ring-2 ${
              errors.pickupTime ? 'border-rose-400 bg-rose-50/40' : 'border-slate-300 focus:border-[#0B4DA2] focus:ring-[#0B4DA2]/20'
            }`}
            aria-label="Pickup time"
          />
          {errors.pickupTime && <p className="text-[11px] text-rose-600 font-medium">{errors.pickupTime}</p>}
        </div>

        <div className="space-y-2">
          <ProfessionalDatePicker
            id="car-field-return-date"
            label="Return Date"
            required
            disabled={isLoading}
            minDate={formData.pickupDate || getTodayDateString()}
            value={formData.returnDate}
            error={errors.returnDate}
            onChange={(val) => {
              setFormData({ ...formData, returnDate: val });
              if (errors.returnDate) setErrors({ ...errors, returnDate: undefined });
            }}
            placeholder="Select Return Date"
          />
          <input
            type="time"
            required
            disabled={isLoading}
            value={formData.returnTime}
            onChange={(e) => {
              setFormData({ ...formData, returnTime: e.target.value });
              if (errors.returnTime) setErrors({ ...errors, returnTime: undefined });
            }}
            className={`w-full px-3.5 py-2.5 rounded-xl border text-sm min-h-[44px] focus:outline-none focus:ring-2 ${
              errors.returnTime ? 'border-rose-400 bg-rose-50/40' : 'border-slate-300 focus:border-[#0B4DA2] focus:ring-[#0B4DA2]/20'
            }`}
            aria-label="Return time"
          />
          {errors.returnTime && <p className="text-[11px] text-rose-600 font-medium">{errors.returnTime}</p>}
        </div>
      </div>

      {/* 4. Self Drive / Chauffeur */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          Service Type <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            id="car-service-self-drive"
            type="button"
            disabled={isLoading}
            onClick={() => {
              setFormData({ ...formData, serviceType: 'Self Drive' });
              if (errors.serviceType) setErrors({ ...errors, serviceType: undefined });
            }}
            className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px] ${
              formData.serviceType === 'Self Drive'
                ? 'border-[#0B4DA2] bg-[#0B4DA2] text-white shadow-xs'
                : 'border-slate-200 bg-[#F5F7FA] text-slate-700 hover:bg-slate-100'
            }`}
          >
            {formData.serviceType === 'Self Drive' && <Check className="w-3.5 h-3.5" />}
            <span>Self Drive</span>
          </button>
          <button
            id="car-service-chauffeur"
            type="button"
            disabled={isLoading}
            onClick={() => {
              setFormData({ ...formData, serviceType: 'Chauffeur' });
              if (errors.serviceType) setErrors({ ...errors, serviceType: undefined });
            }}
            className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px] ${
              formData.serviceType === 'Chauffeur'
                ? 'border-[#0B4DA2] bg-[#0B4DA2] text-white shadow-xs'
                : 'border-slate-200 bg-[#F5F7FA] text-slate-700 hover:bg-slate-100'
            }`}
          >
            {formData.serviceType === 'Chauffeur' && <Check className="w-3.5 h-3.5" />}
            <span>Chauffeur</span>
          </button>
        </div>
        {errors.serviceType && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.serviceType}</p>}
      </div>

      {/* 5. Vehicle Type */}
      <div>
        <label htmlFor="car-field-vehicle-type" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          Vehicle Type / Model <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <Car className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            id="car-field-vehicle-type"
            type="text"
            list="car-vehicle-type-suggestions"
            required
            disabled={isLoading}
            placeholder="Select or enter vehicle model"
            value={formData.vehicleType}
            onChange={(e) => {
              setFormData({ ...formData, vehicleType: e.target.value });
              if (errors.vehicleType) setErrors({ ...errors, vehicleType: undefined });
            }}
            className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 min-h-[44px] ${
              errors.vehicleType 
                ? 'border-rose-400 bg-rose-50/40 focus:ring-rose-400 text-rose-900' 
                : 'border-slate-300 bg-white focus:border-[#0B4DA2] focus:ring-[#0B4DA2]/20 text-slate-900'
            }`}
          />
          <datalist id="car-vehicle-type-suggestions">
            {availableVehicles.map(vt => <option key={vt} value={vt} />)}
          </datalist>
        </div>
        {errors.vehicleType && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.vehicleType}</p>}
      </div>

      {/* 7. WhatsApp Number */}
      <PhoneNumberField
        id="car-field-whatsapp"
        label="WhatsApp Number"
        required
        countryCode={whatsappCountryCode}
        number={whatsappLocalNumber}
        onCountryCodeChange={(value) => {
          setWhatsappCountryCode(value);
          if (errors.whatsappNumber) setErrors({ ...errors, whatsappNumber: undefined });
        }}
        onNumberChange={(value) => {
          setWhatsappLocalNumber(value);
          if (errors.whatsappNumber) setErrors({ ...errors, whatsappNumber: undefined });
        }}
        error={errors.whatsappNumber}
        helperText={`Full number: ${buildPhoneNumber(whatsappCountryCode, whatsappLocalNumber)}`}
        placeholder="331 5424466"
      />

      {/* Submit Enquiry Button */}
      <div className="pt-2">
        <button
          id="car-submit-enquiry-btn"
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 px-6 rounded-xl bg-[#0B4DA2] hover:bg-[#083B7D] active:bg-[#062c5e] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed min-h-[48px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing Request...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Submit Enquiry</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

/* =========================================================================
   CAR RENTAL ENQUIRY SECTION
   ========================================================================= */
interface SimpleEnquirySectionProps {
  initialType?: string;
  defaultType?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

export const SimpleEnquirySection: React.FC<SimpleEnquirySectionProps> = ({
  title = 'Car Rental Enquiry',
  subtitle = 'Self Drive and Chauffeur Driven service enquiries for Hotwheels Car Rental LLC.',
  className = ''
}) => {
  return (
    <div id="quick-enquiry-section" className={`bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-5 sm:p-6 bg-[#0A2540] text-white border-b border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              {subtitle}
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 text-white border border-white/15 text-xs font-bold shrink-0 self-start sm:self-center shadow-xs">
            <Car className="w-4 h-4 text-[#C9A227]" />
            <span>Hotwheels Car Rental LLC</span>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6 sm:p-8">
        <CarRentalEnquiryForm />
      </div>
    </div>
  );
};

/* =========================================================================
   ENQUIRY MODAL POPUP
   ========================================================================= */
export interface EnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'visa' | 'car-rental';
  initialDestination?: string;
  initialVehicleType?: string;
}

export const EnquiryModal: React.FC<EnquiryModalProps> = ({
  isOpen,
  onClose,
  initialVehicleType
}) => {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      id="enquiry-modal-backdrop" 
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto bg-[#0A2540]/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div 
        id="enquiry-modal-dialog"
        className="relative w-full max-w-xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[94vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-5 bg-[#0A2540] text-white flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#C9A227] shrink-0">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                Car Rental Enquiry
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-300">
                Hotwheels Car Rental LLC • Direct Dubai Fleet
              </p>
            </div>
          </div>
          <button
            id="close-enquiry-modal-btn"
            onClick={onClose}
            aria-label="Close enquiry modal"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain flex-1">
          <CarRentalEnquiryForm initialVehicleType={initialVehicleType} />
        </div>
      </div>
    </div>
  );
};
