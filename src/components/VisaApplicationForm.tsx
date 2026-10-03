import { apiUrl } from '../utils/api';
import React, { useState, useRef, useEffect } from 'react';
import { COMPANY_CONFIG, NATIONALITIES, VISA_DISCLAIMER } from '../data/travelData';
import { 
  formatVisaApplicationWhatsApp, 
  openWhatsAppDirectly, 
  buildWhatsAppLink, 
  PRIMARY_WHATSAPP_NUMBER 
} from '../utils/whatsapp';
import { 
  generateVisaApplicationPdf, 
  downloadVisaApplicationPdf,
  VisaApplicationPdfData, 
  UploadedImageData 
} from '../utils/visaPdfGenerator';
import { sendVisaApplicationEmail, buildSecureVisaPdfUrl, buildSecureVisaDocumentUrl } from '../utils/emailjsService';
import { ProfessionalDatePicker } from './ProfessionalDatePicker';
import { 
  User, 
  Globe, 
  Mail, 
  MapPin, 
  Briefcase, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Upload, 
  X, 
  FileCheck, 
  FileText, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Info, 
  RefreshCw, 
  Download, 
  ExternalLink,
  Plus,
  Trash2
} from 'lucide-react';
import { WhatsAppOfficialIcon } from './WhatsAppFloat';
import { PhoneNumberField, buildPhoneNumber } from './PhoneNumberField';

export interface VisaApplicationFormProps {
  initialVisaType?: string;
  className?: string;
  onSuccess?: (refId: string) => void;
}

// Exactly 4 Approved UAE Visa Options
export const APPROVED_UAE_VISA_OPTIONS = [
  { id: '30-days-single', label: '30 Days – Single Entry', duration: '30 Days', entry: 'Single Entry' },
  { id: '60-days-single', label: '60 Days – Single Entry', duration: '60 Days', entry: 'Single Entry' },
  { id: '30-days-multiple', label: '30 Days – Multiple Entry', duration: '30 Days', entry: 'Multiple Entry' },
  { id: '60-days-multiple', label: '60 Days – Multiple Entry', duration: '60 Days', entry: 'Multiple Entry' }
];

const POPULAR_COUNTRIES = [
  'United Arab Emirates', 'Pakistan', 'India', 'United Kingdom', 'United States', 
  'Saudi Arabia', 'Philippines', 'Egypt', 'Canada', 'Australia', 'Russia', 
  'Germany', 'France', 'China', 'Nigeria', 'Bangladesh', 'Oman', 'Qatar', 'Kuwait', 'Bahrain'
];

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const getTodayDateString = () => {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const VisaApplicationForm: React.FC<VisaApplicationFormProps> = ({
  initialVisaType = '30 Days – Single Entry',
  className = '',
  onSuccess
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const formContainerRef = useRef<HTMLDivElement>(null);

  // -------------------------------------------------------------
  // STEP 1: APPLICANT INFORMATION
  // -------------------------------------------------------------
  const [fullName, setFullName] = useState('');
  const [nationality, setNationality] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | ''>('Male');
  const [designation, setDesignation] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappCountryCode, setWhatsappCountryCode] = useState('+92');
  const [email, setEmail] = useState('');
  const [countryOfResidence, setCountryOfResidence] = useState('');
  const fullWhatsappNumber = buildPhoneNumber(whatsappCountryCode, whatsappNumber);

  // -------------------------------------------------------------
  // STEP 2: VISA DETAILS
  // -------------------------------------------------------------
  const [visaType, setVisaType] = useState<string>(() => {
    const found = APPROVED_UAE_VISA_OPTIONS.find(v => v.label === initialVisaType || v.id === initialVisaType);
    return found ? found.label : '30 Days – Single Entry';
  });
  const [intendedTravelDate, setIntendedTravelDate] = useState('');
  const [purposeOfVisit, setPurposeOfVisit] = useState<'Tourism' | 'Visit Family / Friends' | 'Other'>('Tourism');
  const [purposeOfVisitOther, setPurposeOfVisitOther] = useState('');

  // -------------------------------------------------------------
  // STEP 3: REQUIRED & CORE DOCUMENTS
  // -------------------------------------------------------------
  const [passportCopy, setPassportCopy] = useState<UploadedImageData | null>(null);
  const [passportCover, setPassportCover] = useState<UploadedImageData | null>(null);
  const [passportPhoto, setPassportPhoto] = useState<UploadedImageData | null>(null);
  const [nationalIdFront, setNationalIdFront] = useState<UploadedImageData | null>(null);
  const [nationalIdBack, setNationalIdBack] = useState<UploadedImageData | null>(null);
  const [airTicket, setAirTicket] = useState<UploadedImageData | null>(null);

  // -------------------------------------------------------------
  // STEP 4: ADDITIONAL DOCUMENTS (OPTIONAL)
  // -------------------------------------------------------------
  const [previousUaeVisa, setPreviousUaeVisa] = useState<UploadedImageData | null>(null);
  const [entryExitRecord, setEntryExitRecord] = useState<UploadedImageData | null>(null);
  const [guarantorDocs, setGuarantorDocs] = useState<UploadedImageData | null>(null);
  const [uaeResidenceVisaDoc, setUaeResidenceVisaDoc] = useState<UploadedImageData | null>(null);
  const [emiratesIdRelative, setEmiratesIdRelative] = useState<UploadedImageData | null>(null);
  const [relationshipProof, setRelationshipProof] = useState<UploadedImageData | null>(null);
  const [birthCertificate, setBirthCertificate] = useState<UploadedImageData | null>(null);
  const [marriageCertificate, setMarriageCertificate] = useState<UploadedImageData | null>(null);
  const [hotelBooking, setHotelBooking] = useState<UploadedImageData | null>(null);
  const [bankStatement, setBankStatement] = useState<UploadedImageData | null>(null);
  const [travelHistory, setTravelHistory] = useState<UploadedImageData | null>(null);

  // -------------------------------------------------------------
  // STEP 5: ADDITIONAL NOTES & DECLARATION
  // -------------------------------------------------------------
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [declarationAccepted, setDeclarationAccepted] = useState(false);

  // Validation Errors & UI State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<{
    referenceId: string;
    pdfUrl?: string;
    token?: string;
    pdfPayload?: VisaApplicationPdfData;
  } | null>(null);

  // File Inputs Refs
  const passportCopyInputRef = useRef<HTMLInputElement>(null);
  const passportCoverInputRef = useRef<HTMLInputElement>(null);
  const passportPhotoInputRef = useRef<HTMLInputElement>(null);
  const nationalIdFrontInputRef = useRef<HTMLInputElement>(null);
  const nationalIdBackInputRef = useRef<HTMLInputElement>(null);
  const airTicketInputRef = useRef<HTMLInputElement>(null);

  const prevVisaInputRef = useRef<HTMLInputElement>(null);
  const entryExitInputRef = useRef<HTMLInputElement>(null);
  const guarantorInputRef = useRef<HTMLInputElement>(null);
  const uaeResVisaInputRef = useRef<HTMLInputElement>(null);
  const eidRelativeInputRef = useRef<HTMLInputElement>(null);
  const relProofInputRef = useRef<HTMLInputElement>(null);
  const birthCertInputRef = useRef<HTMLInputElement>(null);
  const marriageCertInputRef = useRef<HTMLInputElement>(null);
  const hotelInputRef = useRef<HTMLInputElement>(null);
  const bankInputRef = useRef<HTMLInputElement>(null);
  const historyInputRef = useRef<HTMLInputElement>(null);

  // Synchronize initial prop
  useEffect(() => {
    if (initialVisaType) {
      const found = APPROVED_UAE_VISA_OPTIONS.find(v => v.label === initialVisaType || v.id === initialVisaType);
      if (found) setVisaType(found.label);
    }
  }, [initialVisaType]);

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<UploadedImageData | null>>,
    categoryName: string,
    fieldKey?: string
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    // Clear previous field error
    if (fieldKey && errors[fieldKey]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[fieldKey];
        return next;
      });
    }

    // Validate File Size (5MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert(`File size exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB). Please upload a smaller file.`);
      e.target.value = '';
      return;
    }

    // Validate File Type
    if (!ACCEPTED_FILE_TYPES.includes(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png|webp)$/i)) {
      alert('Invalid file format. Please upload PDF, JPG, JPEG, or PNG.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const dataUrl = loadEvt.target?.result as string | undefined;
      setter({
        name: file.name,
        category: categoryName,
        size: file.size,
        type: file.type || 'application/octet-stream',
        dataUrl
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // -------------------------------------------------------------
  // STEP VALIDATIONS
  // -------------------------------------------------------------
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      newErrors.fullName = 'Please enter applicant full name (minimum 2 characters).';
    }

    if (!nationality.trim()) {
      newErrors.nationality = 'Please specify applicant nationality.';
    }

    if (!dob) {
      newErrors.dob = 'Please select date of birth.';
    } else if (dob > getTodayDateString()) {
      newErrors.dob = 'Date of birth cannot be in the future.';
    }

    if (!gender) {
      newErrors.gender = 'Please select gender.';
    }

    if (!designation.trim()) {
      newErrors.designation = 'Please enter designation / occupation (e.g. Business Owner, Manager, Student).';
    }

    const cleanPhone = whatsappNumber.replace(/\D/g, '');
    if (!whatsappNumber.trim()) {
      newErrors.whatsappNumber = 'Please enter your WhatsApp number.';
    } else if (cleanPhone.length < 7) {
      newErrors.whatsappNumber = 'Please enter a valid WhatsApp number.';
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!countryOfResidence.trim()) {
      newErrors.countryOfResidence = 'Please specify current country of residence.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!visaType) {
      newErrors.visaType = 'Please select a visa type.';
    }

    if (!intendedTravelDate) {
      newErrors.intendedTravelDate = 'Please select intended travel date.';
    } else if (intendedTravelDate < getTodayDateString()) {
      newErrors.intendedTravelDate = 'Travel date cannot be in the past.';
    }

    if (!purposeOfVisit) {
      newErrors.purposeOfVisit = 'Please select purpose of visit.';
    } else if (purposeOfVisit === 'Other' && !purposeOfVisitOther.trim()) {
      newErrors.purposeOfVisitOther = 'Please specify your purpose of visit.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!passportCopy) {
      newErrors.passportCopy = 'Passport Copy (Bio page) is required.';
    }

    if (!passportCover) {
      newErrors.passportCover = 'Passport Cover Page is required.';
    }

    if (!passportPhoto) {
      newErrors.passportPhoto = 'Recent Passport-Size Photograph (white background) is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep5 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!declarationAccepted) {
      newErrors.declaration = 'You must confirm the declaration before submitting your visa application.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const scrollToFormTop = () => {
    requestAnimationFrame(() => {
      if (!formContainerRef.current) return;
      const top = formContainerRef.current.getBoundingClientRect().top + window.scrollY - 24;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    });
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;
    setCurrentStep(prev => Math.min(5, prev + 1));
    scrollToFormTop();
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
    scrollToFormTop();
  };

  const getRequiredDocsList = (): string[] => {
    const list: string[] = [];
    if (passportCopy) list.push(`Passport Copy: ${passportCopy.name}`);
    if (passportCover) list.push(`Passport Cover Page: ${passportCover.name}`);
    if (passportPhoto) list.push(`Photograph: ${passportPhoto.name}`);
    if (nationalIdFront) list.push(`National ID (Front): ${nationalIdFront.name}`);
    if (nationalIdBack) list.push(`National ID (Back): ${nationalIdBack.name}`);
    if (airTicket) list.push(`Air Ticket: ${airTicket.name}`);
    return list;
  };

  const getOptionalDocsList = (): string[] => {
    const list: string[] = [];
    if (previousUaeVisa) list.push(`Previous UAE Visa: ${previousUaeVisa.name}`);
    if (entryExitRecord) list.push(`Entry/Exit Record: ${entryExitRecord.name}`);
    if (guarantorDocs) list.push(`Guarantor Docs: ${guarantorDocs.name}`);
    if (uaeResidenceVisaDoc) list.push(`UAE Residence Visa: ${uaeResidenceVisaDoc.name}`);
    if (emiratesIdRelative) list.push(`Emirates ID Relative: ${emiratesIdRelative.name}`);
    if (relationshipProof) list.push(`Relationship Proof: ${relationshipProof.name}`);
    if (birthCertificate) list.push(`Birth Certificate: ${birthCertificate.name}`);
    if (marriageCertificate) list.push(`Marriage Certificate: ${marriageCertificate.name}`);
    if (hotelBooking) list.push(`Hotel Booking: ${hotelBooking.name}`);
    if (bankStatement) list.push(`Bank Statement: ${bankStatement.name}`);
    if (travelHistory) list.push(`Travel History: ${travelHistory.name}`);
    return list;
  };

  const getAllUploadedDocsList = (): string[] => {
    return [...getRequiredDocsList(), ...getOptionalDocsList()];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validate step 1, 2, 3 and declaration
    if (!validateStep1() || !validateStep2() || !validateStep3() || !validateStep5()) {
      return;
    }

    setIsSubmitting(true);

    // Stage 1: Contact server to initiate application session & obtain unique server reference ID and tokens
    let refId = '';
    let uploadToken = '';
    let documentAccessToken = '';
    let securePdfUrl = '';

    try {
      const initRes = await fetch(apiUrl('/api/visa-applications/initiate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName.trim(),
          nationality: nationality.trim(),
          visaType: visaType.trim()
        })
      });
      const initData = await initRes.json();
      if (!initRes.ok || !initData.success) {
        throw new Error(initData.error || 'Failed to initiate visa application session on server.');
      }
      refId = initData.referenceId;
      uploadToken = initData.uploadToken;
      documentAccessToken = initData.documentAccessToken;
      securePdfUrl = initData.pdfUrl || buildSecureVisaPdfUrl(refId, documentAccessToken);
    } catch (initErr: any) {
      setIsSubmitting(false);
      setSubmitError(initErr.message || 'Could not initiate visa application session. Please check your network and try again.');
      return;
    }

    const requiredDocsList = getRequiredDocsList();
    const optionalDocsList = getOptionalDocsList();
    const uploadedDocsList = getAllUploadedDocsList();

    const additionalFilesList: UploadedImageData[] = [];
    if (previousUaeVisa) additionalFilesList.push({ ...previousUaeVisa, category: previousUaeVisa.category || 'Previous UAE Visa' });
    if (entryExitRecord) additionalFilesList.push({ ...entryExitRecord, category: entryExitRecord.category || 'Entry / Exit Record' });
    if (guarantorDocs) additionalFilesList.push({ ...guarantorDocs, category: guarantorDocs.category || 'Guarantor / Sponsor Documents' });
    if (uaeResidenceVisaDoc) additionalFilesList.push({ ...uaeResidenceVisaDoc, category: uaeResidenceVisaDoc.category || 'Residence Visa' });
    if (emiratesIdRelative) additionalFilesList.push({ ...emiratesIdRelative, category: emiratesIdRelative.category || 'Emirates ID' });
    if (relationshipProof) additionalFilesList.push({ ...relationshipProof, category: relationshipProof.category || 'Relationship Proof' });
    if (birthCertificate) additionalFilesList.push({ ...birthCertificate, category: birthCertificate.category || 'Birth Certificate' });
    if (marriageCertificate) additionalFilesList.push({ ...marriageCertificate, category: marriageCertificate.category || 'Marriage Certificate' });
    if (hotelBooking) additionalFilesList.push({ ...hotelBooking, category: hotelBooking.category || 'Hotel / Accommodation' });
    if (bankStatement) additionalFilesList.push({ ...bankStatement, category: bankStatement.category || 'Bank Statement' });
    if (travelHistory) additionalFilesList.push({ ...travelHistory, category: travelHistory.category || 'Travel History' });

    const pdfPayload: VisaApplicationPdfData = {
      referenceId: refId,
      name: fullName.trim(),
      nationality: nationality.trim(),
      dob,
      gender: gender || 'Male',
      designation: designation.trim(),
      countryOfResidence: countryOfResidence.trim(),
      destination: 'United Arab Emirates (Dubai)',
      visaType: visaType.trim(),
      travelDate: intendedTravelDate,
      whatsappNumber: fullWhatsappNumber,
      email: email.trim() || undefined,
      purposeOfVisit,
      purposeOfVisitOther: purposeOfVisit === 'Other' ? purposeOfVisitOther.trim() : undefined,
      notes: [
        additionalNotes.trim(),
      ].filter(Boolean).join('\n'),
      uploadedDocuments: uploadedDocsList,
      passportCopy,
      passportCover,
      passportPhoto,
      nationalIdFront,
      nationalIdBack,
      airTicket,
      additionalFiles: additionalFilesList
    };

    const fileName = `UAE_Visa_Application_${refId}.pdf`;

    let pdfBase64 = '';
    let saveFunc: ((name?: string) => void) | null = null;
    try {
      const pdfGenResult = await generateVisaApplicationPdf(pdfPayload);
      pdfBase64 = pdfGenResult.pdfBase64;
      saveFunc = pdfGenResult.save;

      // Automatically download genuine PDF to user's device upon submission
      if (saveFunc) {
        saveFunc(fileName);
      }
    } catch (pdfErr) {
      console.warn('[PDF Generation Warning]:', pdfErr);
    }

    // Stage 2A: Upload individual customer documents with authorized uploadToken
    const docUploadPromises: Promise<any>[] = [];
    const filesToUpload: { name: string; file: UploadedImageData | null }[] = [
      { name: 'passport_copy', file: passportCopy },
      { name: 'passport_cover', file: passportCover },
      { name: 'passport_photo', file: passportPhoto },
      { name: 'national_id_front', file: nationalIdFront },
      { name: 'national_id_back', file: nationalIdBack },
      { name: 'air_ticket', file: airTicket },
      ...additionalFilesList.map((f, i) => ({ name: `additional_${i + 1}`, file: f }))
    ];

    for (const item of filesToUpload) {
      if (item.file && item.file.dataUrl) {
        docUploadPromises.push(
          fetch(apiUrl('/api/visa-applications/upload-document'), {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${uploadToken}`
            },
            body: JSON.stringify({
              referenceId: refId,
              fileBase64: item.file.dataUrl,
              filename: item.file.name,
              category: item.name,
              mimeType: item.file.type || 'application/octet-stream',
              uploadToken
            })
          }).catch(uploadErr => console.warn(`[Document Upload Warning: ${item.file?.name}]:`, uploadErr))
        );
      }
    }
    await Promise.allSettled(docUploadPromises);

    // Stage 2B: Upload PDF with authorized uploadToken
    if (pdfBase64) {
      try {
        await fetch(apiUrl('/api/visa-applications/upload-pdf'), {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${uploadToken}`
          },
          body: JSON.stringify({
            referenceId: refId,
            pdfBase64,
            filename: fileName,
            uploadToken
          })
        });
      } catch (err) {
        console.warn('PDF server upload notice:', err);
      }
    }

    // Stage 3: Save application record in database (fail closed if DB rejects)
    try {
      const dbRes = await fetch(apiUrl('/api/enquiries/visa'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${uploadToken}`
        },
        body: JSON.stringify({
          referenceId: refId,
          uploadToken,
          name: fullName.trim(),
          nationality: nationality.trim(),
          dob,
          gender,
          designation: designation.trim(),
          destination: 'United Arab Emirates',
          visaType: visaType.trim(),
          travelDate: intendedTravelDate,
          whatsappNumber: fullWhatsappNumber,
          email: email.trim(),
          purposeOfVisit,
          uploadedDocuments: uploadedDocsList,
          hasDocuments: uploadedDocsList.length > 0,
          specialNotes: `Secure PDF: ${securePdfUrl}\nNotes: ${additionalNotes}`
        })
      });

      const dbData = await dbRes.json();
      if (!dbRes.ok || !dbData.success) {
        throw new Error(dbData.error || 'Database save failed.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setSubmitError(`Application could not be saved to our system: ${err.message || 'Server error'}. Please try again.`);
      return;
    }

    // 4. Send Email Notification (Server-side attachment dispatch with client EmailJS fallback)
    try {
      const effectivePurpose = purposeOfVisit === 'Other' ? (purposeOfVisitOther.trim() || 'Other') : purposeOfVisit;
      const otherPurposeText = purposeOfVisit === 'Other' ? purposeOfVisitOther.trim() : 'N/A';

      // Build attachment URLs for every uploaded document
      const passportBioUrl = passportCopy ? buildSecureVisaDocumentUrl(refId, 'passport_copy', passportCopy.name, documentAccessToken) : '';
      const passportCoverUrl = passportCover ? buildSecureVisaDocumentUrl(refId, 'passport_cover', passportCover.name, documentAccessToken) : '';
      const passportPhotoUrl = passportPhoto ? buildSecureVisaDocumentUrl(refId, 'passport_photo', passportPhoto.name, documentAccessToken) : '';
      const nationalIdFrontUrl = nationalIdFront ? buildSecureVisaDocumentUrl(refId, 'national_id_front', nationalIdFront.name, documentAccessToken) : '';
      const nationalIdBackUrl = nationalIdBack ? buildSecureVisaDocumentUrl(refId, 'national_id_back', nationalIdBack.name, documentAccessToken) : '';
      const airTicketUrl = airTicket ? buildSecureVisaDocumentUrl(refId, 'air_ticket', airTicket.name, documentAccessToken) : '';

      const passportBioText = passportCopy ? `${passportCopy.name} (Attachment: ${passportBioUrl})` : 'Not uploaded';
      const passportCoverText = passportCover ? `${passportCover.name} (Attachment: ${passportCoverUrl})` : 'Not uploaded';
      const passportPhotoText = passportPhoto ? `${passportPhoto.name} (Attachment: ${passportPhotoUrl})` : 'Not uploaded';
      const nationalIdText = nationalIdFront
        ? (nationalIdBack
            ? `${nationalIdFront.name} (Front: ${nationalIdFrontUrl}), ${nationalIdBack.name} (Back: ${nationalIdBackUrl})`
            : `${nationalIdFront.name} (Attachment: ${nationalIdFrontUrl})`)
        : 'Not uploaded';
      const airTicketText = airTicket ? `${airTicket.name} (Attachment: ${airTicketUrl})` : 'Not uploaded';

      // 4a. Attempt server-side email dispatch
      let serverEmailSent = false;
      try {
        const sRes = await fetch(apiUrl('/api/visa-applications/send-email'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reference_id: refId,
            name: fullName.trim(),
            full_name: fullName.trim(),
            nationality: nationality.trim(),
            dob,
            date_of_birth: dob,
            gender: gender || 'Male',
            designation: designation.trim(),
            occupation: designation.trim(),
            whatsapp_number: fullWhatsappNumber,
            email: email.trim() || undefined,
            destination: 'United Arab Emirates (Dubai)',
            visa_type: visaType.trim(),
            travel_date: intendedTravelDate,
            intended_travel_date: intendedTravelDate,
            purpose_of_visit: effectivePurpose,
            other_purpose: otherPurposeText,
            passport_bio_page: passportBioText,
            passport_cover: passportCoverText,
            passport_photo: passportPhotoText,
            national_id: nationalIdText,
            return_onward_ticket: airTicketText,
            document_access_token: documentAccessToken,
            pdf_url: securePdfUrl,
           passport_bio_attachment: passportBioUrl,
            passport_cover_attachment: passportCoverUrl,
            passport_photo_attachment: passportPhotoUrl,
            national_id_front_attachment: nationalIdFront ? nationalIdFrontUrl : '',
            national_id_back_attachment: nationalIdBack ? nationalIdBackUrl : '',
            air_ticket_attachment: airTicketUrl,
            previous_uae_visa_attachment: previousUaeVisa ? buildSecureVisaDocumentUrl(refId, 'previous_uae_visa', previousUaeVisa.name, documentAccessToken) : '',
            entry_exit_record_attachment: entryExitRecord ? buildSecureVisaDocumentUrl(refId, 'entry_exit_record', entryExitRecord.name, documentAccessToken) : '',
            guarantor_docs_attachment: guarantorDocs ? buildSecureVisaDocumentUrl(refId, 'guarantor_docs', guarantorDocs.name, documentAccessToken) : '',
            uae_residence_visa_attachment: uaeResidenceVisaDoc ? buildSecureVisaDocumentUrl(refId, 'uae_residence_visa', uaeResidenceVisaDoc.name, documentAccessToken) : '',
            emirates_id_relative_attachment: emiratesIdRelative ? buildSecureVisaDocumentUrl(refId, 'emirates_id_relative', emiratesIdRelative.name, documentAccessToken) : '',
            relationship_proof_attachment: relationshipProof ? buildSecureVisaDocumentUrl(refId, 'relationship_proof', relationshipProof.name, documentAccessToken) : '',
            birth_certificate_attachment: birthCertificate ? buildSecureVisaDocumentUrl(refId, 'birth_certificate', birthCertificate.name, documentAccessToken) : '',
            marriage_certificate_attachment: marriageCertificate ? buildSecureVisaDocumentUrl(refId, 'marriage_certificate', marriageCertificate.name, documentAccessToken) : '',
            hotel_booking_attachment: hotelBooking ? buildSecureVisaDocumentUrl(refId, 'hotel_booking', hotelBooking.name, documentAccessToken) : '',
            bank_statement_attachment: bankStatement ? buildSecureVisaDocumentUrl(refId, 'bank_statement', bankStatement.name, documentAccessToken) : '',
            travel_history_attachment: travelHistory ? buildSecureVisaDocumentUrl(refId, 'travel_history', travelHistory.name, documentAccessToken) : '',
            additional_notes: [
              additionalNotes.trim(),
                  ].filter(Boolean).join('\n')
          })
        });
        const sJson = await sRes.json().catch(() => null);
        if (sJson && sJson.success) {
          serverEmailSent = true;
        }
      } catch (sErr) {
        console.warn('[Server Email Notice]:', sErr);
      }

      // 4b. Fallback to client-side EmailJS if server email was not sent
      if (!serverEmailSent) {
        await sendVisaApplicationEmail({
          reference_id: refId,
          name: fullName.trim(),
          full_name: fullName.trim(),
          applicant_name: fullName.trim(),
          nationality: nationality.trim(),
          applicant_nationality: nationality.trim(),
          dob,
          date_of_birth: dob,
          gender: gender || 'Male',
          designation: designation.trim(),
          occupation: designation.trim(),
          whatsapp_number: fullWhatsappNumber,
          whatsapp: fullWhatsappNumber,
          email: email.trim() || undefined,
          applicant_email: email.trim() || undefined,
          destination: 'United Arab Emirates (Dubai)',
          visa_type: visaType.trim(),
          travel_date: intendedTravelDate,
          intended_travel_date: intendedTravelDate,
          purpose_of_visit: effectivePurpose,
          purpose: effectivePurpose,
          other_purpose: otherPurposeText,
          purpose_of_visit_other: otherPurposeText,
          passport_bio_page: passportBioText,
          passport_copy: passportBioText,
          passport_cover: passportCoverText,
          passport_photo: passportPhotoText,
          national_id: nationalIdText,
          national_id_front: nationalIdFront ? `${nationalIdFront.name} (Attachment: ${nationalIdFrontUrl})` : 'Not uploaded',
          national_id_back: nationalIdBack ? `${nationalIdBack.name} (Attachment: ${nationalIdBackUrl})` : 'Not uploaded',
          air_ticket: airTicketText,
          return_ticket: airTicketText,
          return_onward_ticket: airTicketText,
          previous_uae_visa: previousUaeVisa ? `${previousUaeVisa.name} (Attachment: ${buildSecureVisaDocumentUrl(refId, 'previous_uae_visa', previousUaeVisa.name, documentAccessToken)})` : 'Not uploaded',
          entry_exit_record: entryExitRecord ? `${entryExitRecord.name} (Attachment: ${buildSecureVisaDocumentUrl(refId, 'entry_exit_record', entryExitRecord.name, documentAccessToken)})` : 'Not uploaded',
          guarantor_docs: guarantorDocs ? `${guarantorDocs.name} (Attachment: ${buildSecureVisaDocumentUrl(refId, 'guarantor_docs', guarantorDocs.name, documentAccessToken)})` : 'Not uploaded',
          uae_residence_visa: uaeResidenceVisaDoc ? `${uaeResidenceVisaDoc.name} (Attachment: ${buildSecureVisaDocumentUrl(refId, 'uae_residence_visa', uaeResidenceVisaDoc.name, documentAccessToken)})` : 'Not uploaded',
          emirates_id_relative: emiratesIdRelative ? `${emiratesIdRelative.name} (Attachment: ${buildSecureVisaDocumentUrl(refId, 'emirates_id_relative', emiratesIdRelative.name, documentAccessToken)})` : 'Not uploaded',
          relationship_proof: relationshipProof ? `${relationshipProof.name} (Attachment: ${buildSecureVisaDocumentUrl(refId, 'relationship_proof', relationshipProof.name, documentAccessToken)})` : 'Not uploaded',
          birth_certificate: birthCertificate ? `${birthCertificate.name} (Attachment: ${buildSecureVisaDocumentUrl(refId, 'birth_certificate', birthCertificate.name, documentAccessToken)})` : 'Not uploaded',
          marriage_certificate: marriageCertificate ? `${marriageCertificate.name} (Attachment: ${buildSecureVisaDocumentUrl(refId, 'marriage_certificate', marriageCertificate.name, documentAccessToken)})` : 'Not uploaded',
          hotel_booking: hotelBooking ? `${hotelBooking.name} (Attachment: ${buildSecureVisaDocumentUrl(refId, 'hotel_booking', hotelBooking.name, documentAccessToken)})` : 'Not uploaded',
          bank_statement: bankStatement ? `${bankStatement.name} (Attachment: ${buildSecureVisaDocumentUrl(refId, 'bank_statement', bankStatement.name, documentAccessToken)})` : 'Not uploaded',
          travel_history: travelHistory ? `${travelHistory.name} (Attachment: ${buildSecureVisaDocumentUrl(refId, 'travel_history', travelHistory.name, documentAccessToken)})` : 'Not uploaded',
          uploaded_documents: uploadedDocsList,
          required_documents: requiredDocsList,
          additional_documents: optionalDocsList.length > 0 ? optionalDocsList : undefined,
          optional_documents: optionalDocsList.length > 0 ? optionalDocsList : undefined,
          additional_notes: [
            additionalNotes.trim(),
              ].filter(Boolean).join('\n')
        });
      }
    } catch (emailErr) {
      console.warn('[EmailJS Application Email Notice]:', emailErr);
    }

    // 4. Open WhatsApp ONLY after database save + PDF generation succeeds
    const cleanWaTarget = (COMPANY_CONFIG.whatsappNumber || PRIMARY_WHATSAPP_NUMBER).replace(/\D/g, '');
    const waMsg = formatVisaApplicationWhatsApp({
      referenceId: refId,
      name: fullName.trim(),
      nationality: nationality.trim(),
      destination: 'United Arab Emirates',
      visaType: visaType.trim(),
      travelDate: intendedTravelDate,
      whatsappNumber: fullWhatsappNumber,
      uploadedDocuments: uploadedDocsList,
      uploadedDocumentsCount: uploadedDocsList.length,
      pdfUrl: securePdfUrl
    });
    openWhatsAppDirectly(waMsg, cleanWaTarget);

    setSubmittedResult({
      referenceId: refId,
      pdfUrl: securePdfUrl,
      token: documentAccessToken,
      pdfPayload
    });

    setIsSubmitting(false);
    if (onSuccess) onSuccess(refId);
  };

  const handleReset = () => {
    setFullName('');
    setNationality('');
    setDob('');
    setGender('Male');
    setDesignation('');
    setWhatsappNumber('');
    setWhatsappCountryCode('+92');
    setEmail('');
    setCountryOfResidence('');
    setIntendedTravelDate('');
    setPurposeOfVisit('Tourism');
    setPurposeOfVisitOther('');
    setPassportCopy(null);
    setPassportCover(null);
    setPassportPhoto(null);
    setNationalIdFront(null);
    setNationalIdBack(null);
    setAirTicket(null);
    setPreviousUaeVisa(null);
    setEntryExitRecord(null);
    setGuarantorDocs(null);
    setUaeResidenceVisaDoc(null);
    setEmiratesIdRelative(null);
    setRelationshipProof(null);
    setBirthCertificate(null);
    setMarriageCertificate(null);
    setHotelBooking(null);
    setBankStatement(null);
    setTravelHistory(null);
    setAdditionalNotes('');
    setDeclarationAccepted(false);
    setErrors({});
    setSubmitError(null);
    setSubmittedResult(null);
    setCurrentStep(1);
  };

  // -------------------------------------------------------------
  // SUCCESS SCREEN
  // -------------------------------------------------------------
  if (submittedResult) {
    const cleanWaTarget = (COMPANY_CONFIG.whatsappNumber || PRIMARY_WHATSAPP_NUMBER).replace(/\D/g, '');
    const waMsg = formatVisaApplicationWhatsApp({
      referenceId: submittedResult.referenceId,
      name: fullName.trim(),
      nationality: nationality.trim(),
      destination: 'United Arab Emirates',
      visaType: visaType.trim(),
      travelDate: intendedTravelDate,
      whatsappNumber: fullWhatsappNumber,
      uploadedDocuments: getAllUploadedDocsList(),
      pdfUrl: submittedResult.pdfUrl
    });
    const waUrl = buildWhatsAppLink(waMsg, cleanWaTarget);

    return (
      <div id="visa-application-success" className={`p-6 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-xl text-center space-y-6 max-w-3xl mx-auto ${className}`}>
        <div className="w-20 h-20 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto border-2 border-emerald-200 shadow-sm animate-in zoom-in-95 duration-200">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F5F7FA] text-[#0A2540] text-xs font-bold uppercase tracking-wider border border-slate-200">
            <span>Application Reference:</span>
            <span className="font-mono text-[#0B4DA2] font-black text-sm">{submittedResult.referenceId}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0A2540]">
            Visa Application Submitted Successfully
          </h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Thank you. Your visa application and documents have been submitted successfully. Our team will review your application and contact you on WhatsApp or email if additional information or documents are required.
          </p>
        </div>

        {/* Application Summary Box */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-3 text-slate-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Applicant Name</span>
              <span className="font-bold text-[#0A2540] text-sm">{fullName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Nationality</span>
              <span className="font-semibold text-[#0A2540]">{nationality}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Visa Category</span>
              <span className="font-bold text-[#0B4DA2]">{visaType}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Intended Travel Date</span>
              <span className="font-semibold text-[#0A2540]">{intendedTravelDate}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">WhatsApp Number</span>
              <span className="font-semibold text-[#0A2540] font-mono">{fullWhatsappNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Documents Attached</span>
              <span className="font-semibold text-emerald-700">{getAllUploadedDocsList().length} files</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Country of Residence</span>
              <span className="font-semibold text-[#0A2540]">{countryOfResidence}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Continue to WhatsApp | Open PDF | Download PDF */}
        <div className="space-y-3 pt-2">
          {/* Primary Action: Continue to WhatsApp */}
          <a
            id="visa-whatsapp-continue-btn"
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 px-6 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-black text-base shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer min-h-[52px]"
          >
            <WhatsAppOfficialIcon className="w-5 h-5 fill-current shrink-0" />
            <span>Continue to WhatsApp</span>
          </a>

          {/* Secondary Actions: Open PDF & Download PDF */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              id="visa-open-pdf-btn"
              href={submittedResult.pdfUrl || `/api/visa-applications/${encodeURIComponent(submittedResult.referenceId)}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-[#0A2540] font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[46px]"
            >
              <ExternalLink className="w-4 h-4 text-[#0B4DA2] shrink-0" />
              <span>Open PDF</span>
            </a>

            <button
              id="visa-download-pdf-btn"
              type="button"
              onClick={() => {
                if (submittedResult.pdfPayload) {
                  downloadVisaApplicationPdf(submittedResult.pdfPayload);
                } else {
                  const targetDownloadUrl = submittedResult.pdfUrl 
                    ? `${submittedResult.pdfUrl}&download=true` 
                    : `/api/visa-applications/${encodeURIComponent(submittedResult.referenceId)}/pdf?download=true`;
                  window.open(targetDownloadUrl, '_blank');
                }
              }}
              className="py-3 px-4 rounded-xl bg-[#0B4DA2] hover:bg-[#083B7D] text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[46px]"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:text-[#0A2540] hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Submit Another Application</span>
        </button>
      </div>
    );
  }

  // -------------------------------------------------------------
  // UPLOAD FIELD REUSABLE COMPONENT
  // -------------------------------------------------------------
  const renderUploadField = (
    label: string,
    fileState: UploadedImageData | null,
    setter: React.Dispatch<React.SetStateAction<UploadedImageData | null>>,
    inputRef: React.RefObject<HTMLInputElement | null>,
    categoryName: string,
    isRequired: boolean = false,
    helperNote?: string,
    fieldKey?: string
  ) => {
    return (
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <span className="text-xs font-extrabold text-[#0A2540] flex items-center gap-1.5">
              <span>{label}</span>
              {isRequired ? (
                <span className="text-rose-500 font-bold">*</span>
              ) : (
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                  Optional / If Applicable
                </span>
              )}
            </span>
            {helperNote && <p className="text-[11px] text-slate-500 mt-0.5">{helperNote}</p>}
          </div>
          <span className="text-[10px] font-semibold text-slate-400">PDF, JPG, PNG (Max 5MB)</span>
        </div>

        <input
          type="file"
          ref={inputRef}
          onChange={(e) => handleFileUpload(e, setter, categoryName, fieldKey)}
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="hidden"
        />

        {fileState ? (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="truncate">
                <p className="text-xs font-bold text-emerald-900 truncate">{fileState.name}</p>
                <p className="text-[10px] text-emerald-600">{formatFileSize(fileState.size)}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-800 text-[11px] font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => setter(null)}
                aria-label="Remove document"
                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={`w-full py-3 px-4 rounded-xl border-2 border-dashed transition-all flex items-center justify-center gap-2 text-xs font-bold cursor-pointer min-h-[44px] ${
              fieldKey && errors[fieldKey]
                ? 'border-rose-300 bg-rose-50/40 text-rose-700 hover:bg-rose-50'
                : 'border-slate-200 bg-slate-50/70 hover:bg-white hover:border-[#0B4DA2] text-slate-600 hover:text-[#0B4DA2]'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload {label}</span>
          </button>
        )}

        {fieldKey && errors[fieldKey] && (
          <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errors[fieldKey]}</span>
          </p>
        )}
      </div>
    );
  };

  return (
    <div ref={formContainerRef} id="visa-application-form-container" className={`bg-white rounded-3xl border border-slate-200 shadow-xl overflow-visible ${className}`}>
      
      {/* Form Header with Navy Branding & Step Progress */}
      <div className="p-6 sm:p-8 bg-[#0A2540] text-white border-b border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#C9A227] text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Official Visa Application Portal</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              UAE Visa Application Form
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Submit your UAE visit visa application and required documents securely.
            </p>
          </div>

          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-slate-200 font-bold">
            <Info className="w-4 h-4 text-[#C9A227] shrink-0" />
            <span>Zone Tourism LLC • Dubai, UAE</span>
          </div>
        </div>

        {/* 5-Step Visual Stepper Bar */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-3 pt-2">
          {[
            { step: 1, title: 'Applicant Info', subtitle: 'Personal Details' },
            { step: 2, title: 'Visa Details', subtitle: 'Type & Travel' },
            { step: 3, title: 'Required Docs', subtitle: 'Core Files' },
            { step: 4, title: 'Additional Docs', subtitle: 'If Required' },
            { step: 5, title: 'Review & Submit', subtitle: 'Declaration' }
          ].map((s) => {
            const isActive = currentStep === s.step;
            const isCompleted = currentStep > s.step;

            return (
              <button
                key={s.step}
                type="button"
                onClick={() => {
                  // Only allow jumping back to previous completed steps
                  if (s.step < currentStep) { setCurrentStep(s.step); scrollToFormTop(); }
                }}
                disabled={s.step > currentStep}
                className={`text-left p-2 sm:p-3 rounded-xl border transition-all cursor-pointer disabled:cursor-not-allowed ${
                  isActive
                    ? 'bg-[#0B4DA2] border-[#0B4DA2] text-white shadow-md'
                    : isCompleted
                    ? 'bg-white/15 border-white/20 text-white hover:bg-white/20'
                    : 'bg-white/5 border-white/10 text-slate-400 opacity-60'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`w-5 h-5 rounded-full text-[10px] font-extrabold flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-white text-[#0B4DA2]' : isCompleted ? 'bg-emerald-400 text-slate-900' : 'bg-white/20 text-white'
                  }`}>
                    {isCompleted ? '✓' : s.step}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">
                    Step {s.step}
                  </span>
                </div>
                <div className="text-xs font-black truncate">{s.title}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Form Body */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8" noValidate>
        
        {/* =========================================================
            STEP 1: APPLICANT INFORMATION
            ========================================================= */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-[#0A2540]">
                Step 1: Applicant Information
              </h3>
              <p className="text-xs text-slate-500">
                Please enter the applicant details exactly as they appear on the passport.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              
              {/* 1. Full Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name (as per Passport) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Muhammad Abdullah Khan"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) setErrors(prev => ({ ...prev, fullName: '' }));
                    }}
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 min-h-[44px] ${
                      errors.fullName
                        ? 'border-rose-400 bg-rose-50/30 focus:ring-rose-400 text-rose-900'
                        : 'border-slate-300 focus:border-[#0B4DA2] focus:ring-[#0B4DA2]/20 text-slate-900'
                    }`}
                  />
                </div>
                {errors.fullName && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.fullName}</p>}
              </div>

              {/* 2. Nationality */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nationality <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    list="applicant-nationality-list"
                    required
                    placeholder="Select or enter nationality"
                    value={nationality}
                    onChange={(e) => {
                      setNationality(e.target.value);
                      if (errors.nationality) setErrors(prev => ({ ...prev, nationality: '' }));
                    }}
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 min-h-[44px] ${
                      errors.nationality
                        ? 'border-rose-400 bg-rose-50/30 focus:ring-rose-400 text-rose-900'
                        : 'border-slate-300 focus:border-[#0B4DA2] focus:ring-[#0B4DA2]/20 text-slate-900'
                    }`}
                  />
                  <datalist id="applicant-nationality-list">
                    {NATIONALITIES.map((nat) => (
                      <option key={nat} value={nat} />
                    ))}
                  </datalist>
                </div>
                {errors.nationality && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.nationality}</p>}
              </div>

              {/* 3. Date of Birth */}
              <div>
                <ProfessionalDatePicker
                  id="applicant-dob"
                  label="Date of Birth"
                  required
                  isBirthDate={true}
                  mode="birthdate"
                  value={dob}
                  maxDate={getTodayDateString()}
                  error={errors.dob}
                  onChange={(val) => {
                    setDob(val);
                    if (errors.dob) setErrors(prev => ({ ...prev, dob: '' }));
                  }}
                  placeholder="Select Date of Birth"
                />
              </div>

              {/* 4. Gender */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Gender <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['Male', 'Female'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        setGender(g);
                        if (errors.gender) setErrors(prev => ({ ...prev, gender: '' }));
                      }}
                      className={`py-2.5 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px] ${
                        gender === g
                          ? 'border-[#0B4DA2] bg-[#0B4DA2] text-white shadow-xs'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {gender === g && <Check className="w-3.5 h-3.5" />}
                      <span>{g}</span>
                    </button>
                  ))}
                </div>
                {errors.gender && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.gender}</p>}
              </div>

              {/* 5. Designation / Occupation */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Designation / Occupation <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Business Owner, Manager, Student"
                    value={designation}
                    onChange={(e) => {
                      setDesignation(e.target.value);
                      if (errors.designation) setErrors(prev => ({ ...prev, designation: '' }));
                    }}
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 min-h-[44px] ${
                      errors.designation
                        ? 'border-rose-400 bg-rose-50/30 focus:ring-rose-400 text-rose-900'
                        : 'border-slate-300 focus:border-[#0B4DA2] focus:ring-[#0B4DA2]/20 text-slate-900'
                    }`}
                  />
                </div>
                {errors.designation && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.designation}</p>}
              </div>

              {/* 6. WhatsApp Number */}
              <div>
                <PhoneNumberField
                  id="visa-whatsapp-number"
                  label="WhatsApp Number"
                  required
                  countryCode={whatsappCountryCode}
                  number={whatsappNumber}
                  onCountryCodeChange={(value) => {
                    setWhatsappCountryCode(value);
                    if (errors.whatsappNumber) setErrors(prev => ({ ...prev, whatsappNumber: '' }));
                  }}
                  onNumberChange={(value) => {
                    setWhatsappNumber(value);
                    if (errors.whatsappNumber) setErrors(prev => ({ ...prev, whatsappNumber: '' }));
                  }}
                  error={errors.whatsappNumber}
                  helperText={`Full number: ${fullWhatsappNumber}`}
                  placeholder="331 5424466"
                />
              </div>

              {/* 7. Email Address (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-[11px] font-normal text-slate-400">(Optional)</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    placeholder="applicant@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                    }}
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 min-h-[44px] ${
                      errors.email
                        ? 'border-rose-400 bg-rose-50/30 focus:ring-rose-400 text-rose-900'
                        : 'border-slate-300 focus:border-[#0B4DA2] focus:ring-[#0B4DA2]/20 text-slate-900'
                    }`}
                  />
                </div>
                {errors.email && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.email}</p>}
              </div>

              {/* 8. Current Country of Residence */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Current Country of Residence <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    list="residence-country-list"
                    required
                    placeholder="Select or enter country of residence"
                    value={countryOfResidence}
                    onChange={(e) => {
                      setCountryOfResidence(e.target.value);
                      if (errors.countryOfResidence) setErrors(prev => ({ ...prev, countryOfResidence: '' }));
                    }}
                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 min-h-[44px] ${
                      errors.countryOfResidence
                        ? 'border-rose-400 bg-rose-50/30 focus:ring-rose-400 text-rose-900'
                        : 'border-slate-300 focus:border-[#0B4DA2] focus:ring-[#0B4DA2]/20 text-slate-900'
                    }`}
                  />
                  <datalist id="residence-country-list">
                    {POPULAR_COUNTRIES.map((c) => <option key={c} value={c} />)}
                  </datalist>
                </div>
                {errors.countryOfResidence && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.countryOfResidence}</p>}
              </div>

            </div>
          </div>
        )}

        {/* =========================================================
            STEP 2: VISA DETAILS
            ========================================================= */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-[#0A2540]">
                Step 2: Visa Details
              </h3>
              <p className="text-xs text-slate-500">
                Select your required UAE visa category and travel timeline.
              </p>
            </div>

            {/* Exactly 4 Approved UAE Visa Types */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                Select UAE Visa Type <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {APPROVED_UAE_VISA_OPTIONS.map((opt) => {
                  const isSelected = visaType === opt.label;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => setVisaType(opt.label)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                        isSelected
                          ? 'border-[#0B4DA2] bg-[#0B4DA2]/5 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-extrabold text-[#0A2540]">{opt.label}</span>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-[#0B4DA2] bg-[#0B4DA2] text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[#0B4DA2] font-bold">{opt.duration}</span>
                        <span>•</span>
                        <span>{opt.entry}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {errors.visaType && <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.visaType}</p>}
            </div>

            {/* Intended Travel Date */}
            <div>
              <ProfessionalDatePicker
                id="applicant-travel-date"
                label="Intended Travel Date"
                required
                mode="travel"
                value={intendedTravelDate}
                minDate={getTodayDateString()}
                error={errors.intendedTravelDate}
                onChange={(val) => {
                  setIntendedTravelDate(val);
                  if (errors.intendedTravelDate) setErrors(prev => ({ ...prev, intendedTravelDate: '' }));
                }}
                placeholder="Select Intended Travel Date"
              />
            </div>

            {/* Purpose of Visit */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Purpose of Visit <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['Tourism', 'Visit Family / Friends', 'Other'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setPurposeOfVisit(p);
                      if (errors.purposeOfVisit) setErrors(prev => ({ ...prev, purposeOfVisit: '' }));
                    }}
                    className={`py-2.5 px-3.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px] ${
                      purposeOfVisit === p
                        ? 'border-[#0B4DA2] bg-[#0B4DA2] text-white shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {purposeOfVisit === p && <Check className="w-3.5 h-3.5" />}
                    <span>{p}</span>
                  </button>
                ))}
              </div>

              {/* If "Other", please specify */}
              {purposeOfVisit === 'Other' && (
                <div className="mt-3">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Please Specify Purpose of Visit <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Business meetings, conference attendance, leisure"
                    value={purposeOfVisitOther}
                    onChange={(e) => {
                      setPurposeOfVisitOther(e.target.value);
                      if (errors.purposeOfVisitOther) setErrors(prev => ({ ...prev, purposeOfVisitOther: '' }));
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 min-h-[44px] ${
                      errors.purposeOfVisitOther
                        ? 'border-rose-400 bg-rose-50/30 focus:ring-rose-400 text-rose-900'
                        : 'border-slate-300 focus:border-[#0B4DA2] focus:ring-[#0B4DA2]/20 text-slate-900'
                    }`}
                  />
                  {errors.purposeOfVisitOther && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.purposeOfVisitOther}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 3: REQUIRED DOCUMENTS
            ========================================================= */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-[#0A2540]">
                Step 3: Required Documents
              </h3>
              <p className="text-xs text-slate-500">
                Please upload clear, legible color copies. Accepted formats: PDF, JPG, JPEG, PNG (max 5MB each).
              </p>
            </div>

            <div className="space-y-4">
              {/* 1. Passport Copy * */}
              {renderUploadField(
                'Passport Copy (Bio-Data Page)',
                passportCopy,
                setPassportCopy,
                passportCopyInputRef,
                'Passport Copy (Bio Page)',
                true,
                'Must have minimum 6 months validity from intended travel date.',
                'passportCopy'
              )}

              {/* 2. Passport Cover Page * */}
              {renderUploadField(
                'Passport Cover Page',
                passportCover,
                setPassportCover,
                passportCoverInputRef,
                'Passport Cover Page',
                true,
                'Clear photo or scan of front cover of your passport.',
                'passportCover'
              )}

              {/* 3. Recent Passport-Size Photograph * */}
              {renderUploadField(
                'Recent Passport-Size Photograph',
                passportPhoto,
                setPassportPhoto,
                passportPhotoInputRef,
                'Passport Photograph',
                true,
                'White background, clear face view without glare or sunglasses.',
                'passportPhoto'
              )}

              {/* 4. National ID Card — Front (Optional) */}
              {renderUploadField(
                'National ID Card — Front',
                nationalIdFront,
                setNationalIdFront,
                nationalIdFrontInputRef,
                'National ID Front',
                false,
                'Optional / If applicable'
              )}

              {/* 5. National ID Card — Back (Optional) */}
              {renderUploadField(
                'National ID Card — Back',
                nationalIdBack,
                setNationalIdBack,
                nationalIdBackInputRef,
                'National ID Back',
                false,
                'Optional / If applicable'
              )}

              {/* 6. Confirmed Return / Onward Air Ticket (Optional / If Required) */}
              {renderUploadField(
                'Confirmed Return / Onward Air Ticket',
                airTicket,
                setAirTicket,
                airTicketInputRef,
                'Confirmed Air Ticket',
                false,
                'Optional / If required for your nationality or travel route'
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 4: ADDITIONAL DOCUMENTS (OPTIONAL)
            ========================================================= */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-[#0A2540]">
                Step 4: Additional Documents — If Required
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Additional documents may be requested depending on the applicant's nationality, age, gender and immigration profile. All upload fields in this section are completely optional.
              </p>
            </div>

            <div className="space-y-4">
              {/* 1. Previous UAE Visa Copy */}
              {renderUploadField(
                'Previous UAE Visa Copy',
                previousUaeVisa,
                setPreviousUaeVisa,
                prevVisaInputRef,
                'Previous UAE Visa',
                false
              )}

              {/* 2. Previous UAE Entry / Exit Record */}
              {renderUploadField(
                'Previous UAE Entry / Exit Record',
                entryExitRecord,
                setEntryExitRecord,
                entryExitInputRef,
                'Entry / Exit Record',
                false
              )}

              {/* 3. Guarantor / Sponsor Documents */}
              {renderUploadField(
                'Guarantor / Sponsor Documents',
                guarantorDocs,
                setGuarantorDocs,
                guarantorInputRef,
                'Guarantor / Sponsor Docs',
                false
              )}

              {/* 4. UAE Residence Visa */}
              {renderUploadField(
                'UAE Residence Visa of Relative / Sponsor',
                uaeResidenceVisaDoc,
                setUaeResidenceVisaDoc,
                uaeResVisaInputRef,
                'UAE Residence Visa',
                false
              )}

              {/* 5. Emirates ID of Relative / Sponsor */}
              {renderUploadField(
                'Emirates ID of Relative / Sponsor',
                emiratesIdRelative,
                setEmiratesIdRelative,
                eidRelativeInputRef,
                'Emirates ID Relative',
                false
              )}

              {/* 6. Relationship Proof */}
              {renderUploadField(
                'Relationship Proof (e.g. Affidavit / Marriage / Family Registration)',
                relationshipProof,
                setRelationshipProof,
                relProofInputRef,
                'Relationship Proof',
                false
              )}

              {/* 7. Birth Certificate */}
              {renderUploadField(
                'Birth Certificate (for Children / Minors)',
                birthCertificate,
                setBirthCertificate,
                birthCertInputRef,
                'Birth Certificate',
                false
              )}

              {/* 8. Marriage Certificate */}
              {renderUploadField(
                'Marriage Certificate (for Spouse)',
                marriageCertificate,
                setMarriageCertificate,
                marriageCertInputRef,
                'Marriage Certificate',
                false
              )}

              {/* 9. Hotel Booking / UAE Accommodation */}
              {renderUploadField(
                'Hotel Booking / UAE Accommodation Details',
                hotelBooking,
                setHotelBooking,
                hotelInputRef,
                'Hotel / Accommodation',
                false
              )}

              {/* 10. Bank Statement / Proof of Funds */}
              {renderUploadField(
                'Bank Statement / Proof of Funds',
                bankStatement,
                setBankStatement,
                bankInputRef,
                'Bank Statement',
                false
              )}

              {/* 11. Previous Travel History / Visa Copies */}
              {renderUploadField(
                'Previous Travel History / Visa Copies (UK, USA, Schengen, etc.)',
                travelHistory,
                setTravelHistory,
                historyInputRef,
                'Travel History / Visas',
                false
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 5: ADDITIONAL INFORMATION, REVIEW & SUBMIT
            ========================================================= */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-[#0A2540]">
                Step 5: Review & Submit
              </h3>
              <p className="text-xs text-slate-500">
                Please verify all entered details and confirm the mandatory declaration before final submission.
              </p>
            </div>

            {/* Additional Notes Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Additional Information / Notes <span className="text-[11px] font-normal text-slate-400">(Optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="Please provide any additional information relevant to your visa application."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4DA2]/20 focus:border-[#0B4DA2] resize-none"
              />
            </div>

            {/* Structured Summary Review Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                <span className="text-xs font-black uppercase tracking-wider text-[#0A2540]">
                  Application Summary
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs font-bold text-[#0B4DA2] hover:underline cursor-pointer"
                >
                  Edit Information
                </button>
              </div>

              {/* Grid 1: Applicant Details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Full Name</span>
                  <span className="font-bold text-[#0A2540]">{fullName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Nationality</span>
                  <span className="font-semibold text-[#0A2540]">{nationality || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Date of Birth</span>
                  <span className="font-semibold text-[#0A2540]">{dob || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Gender</span>
                  <span className="font-semibold text-[#0A2540]">{gender || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Designation</span>
                  <span className="font-semibold text-[#0A2540]">{designation || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">WhatsApp Number</span>
                  <span className="font-semibold text-[#0A2540] font-mono">{fullWhatsappNumber || 'N/A'}</span>
                </div>
                {email && (
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Email</span>
                    <span className="font-semibold text-[#0A2540] truncate block">{email}</span>
                  </div>
                )}
              </div>

              {/* Grid 2: Visa Details */}
              <div className="pt-3 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Visa Type</span>
                  <span className="font-bold text-[#0B4DA2]">{visaType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Intended Travel Date</span>
                  <span className="font-semibold text-[#0A2540]">{intendedTravelDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Purpose of Visit</span>
                  <span className="font-semibold text-[#0A2540]">
                    {purposeOfVisit === 'Other' ? `Other (${purposeOfVisitOther})` : purposeOfVisit}
                  </span>
                </div>
              </div>

              {/* Grid 3: Uploaded Documents Checklist */}
              <div className="pt-3 border-t border-slate-200/80">
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1.5">
                  Uploaded Documents ({getAllUploadedDocsList().length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-emerald-800">
                  {getAllUploadedDocsList().map((docName, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 truncate">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{docName}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mandatory Declaration Checkbox */}
            <div className={`p-4 rounded-2xl border transition-all ${
              errors.declaration ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200 bg-white shadow-2xs'
            }`}>
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={declarationAccepted}
                  onChange={(e) => {
                    setDeclarationAccepted(e.target.checked);
                    if (errors.declaration) setErrors(prev => ({ ...prev, declaration: '' }));
                  }}
                  className="mt-1 w-4 h-4 rounded text-[#0B4DA2] border-slate-300 focus:ring-[#0B4DA2]"
                />
                <span className="text-xs text-slate-700 leading-relaxed font-medium">
                  I confirm that the information and documents provided are accurate and belong to me. I understand that submission of documents does not guarantee visa approval and that visa approval, rejection and processing time are subject to the relevant UAE Immigration Authorities.
                </span>
              </label>
              {errors.declaration && (
                <p className="text-[11px] text-rose-600 font-bold mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.declaration}</span>
                </p>
              )}
            </div>

            {/* Regulatory Notices */}
            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>Important Regulatory Notices:</span>
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-slate-700 pl-1">
                <li>Visa approval and processing time are subject to the relevant immigration authorities.</li>
                <li>Submission of documents does not guarantee visa approval.</li>
                <li>Processing time may vary depending on visa type, nationality and UAE Immigration approval.</li>
              </ul>
            </div>

          </div>
        )}

        {/* Global Error Banner */}
        {submitError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-bold">{submitError}</span>
          </div>
        )}

        {/* Navigation Buttons (Back & Next/Submit) */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Step {currentStep - 1}</span>
            </button>
          ) : <div />}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="py-3.5 px-6 rounded-xl bg-[#0B4DA2] hover:bg-[#083B7D] text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[46px]"
            >
              <span>Continue to Step {currentStep + 1}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              id="submit-visa-application-btn"
              type="submit"
              disabled={isSubmitting}
              className="py-3.5 px-8 rounded-xl bg-[#0B4DA2] hover:bg-[#083B7D] active:bg-[#062c5e] text-white font-black text-sm sm:text-base shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed min-h-[48px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Submitting Visa Application...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 text-[#C9A227]" />
                  <span>Submit Visa Application</span>
                </>
              )}
            </button>
          )}
        </div>

      </form>

    </div>
  );
};
