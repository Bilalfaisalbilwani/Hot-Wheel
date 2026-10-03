import emailjs from '@emailjs/browser';

/**
 * PRODUCTION EMAILJS CONFIGURATION
 * 
 * Target EmailJS Credentials:
 * - Public Key: OlsbUfqZLPei_nsVk
 * - Service ID: service_l6g6aq9
 * - Car Rental Template ID: template_d7v75aj
 * - Visa Application Template ID: template_mu6mwue
 */
export const EMAILJS_PRODUCTION_CREDENTIALS = {
  SERVICE_ID: 'service_l6g6aq9',
  PUBLIC_KEY: 'OlsbUfqZLPei_nsVk',
  TEMPLATES: {
    CAR_RENTAL: 'template_d7v75aj',
    VISA_APPLICATION: 'template_mu6mwue'
  }
} as const;

let isEmailJsInitialized = false;

/**
 * Returns the active EmailJS credentials.
 */
export function getEmailJsCredentials() {
  return {
    serviceId: EMAILJS_PRODUCTION_CREDENTIALS.SERVICE_ID,
    publicKey: EMAILJS_PRODUCTION_CREDENTIALS.PUBLIC_KEY,
    templates: {
      carRental: EMAILJS_PRODUCTION_CREDENTIALS.TEMPLATES.CAR_RENTAL,
      visaApplication: EMAILJS_PRODUCTION_CREDENTIALS.TEMPLATES.VISA_APPLICATION
    }
  };
}

/**
 * Initializes EmailJS client-side singleton safely without duplication.
 */
export function initializeEmailJs(): boolean {
  if (isEmailJsInitialized) return true;
  try {
    emailjs.init({ publicKey: EMAILJS_PRODUCTION_CREDENTIALS.PUBLIC_KEY });
    isEmailJsInitialized = true;
    return true;
  } catch (err) {
    console.warn('[EmailJS] Init warning:', err);
  }
  return false;
}

/**
 * Parameters for Car Rental Enquiry EmailJS Template (template_d7v75aj)
 */
export interface CarRentalEnquiryEmailParams {
  reference_id: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_date: string;
  pickup_time: string;
  return_date: string;
  return_time: string;
  service_type: string;
  vehicle_type: string;
  whatsapp_number: string;
  submitted_at?: string;
}

/**
 * Parameters for Visa Application EmailJS Template (template_mu6mwue)
 */
export interface VisaApplicationEmailParams {
  reference_id: string;
  name: string;
  full_name?: string;
  applicant_name?: string;
  nationality: string;
  applicant_nationality?: string;
  dob?: string;
  date_of_birth?: string;
  gender?: string;
  designation?: string;
  occupation?: string;
  whatsapp_number: string;
  whatsapp?: string;
  email?: string;
  applicant_email?: string;
  country_of_residence?: string;
  current_country?: string;
  destination?: string;
  visa_type: string;
  travel_date: string;
  intended_travel_date?: string;
  purpose_of_visit?: string;
  purpose?: string;
  other_purpose?: string;
  purpose_of_visit_other?: string;
  passport_bio_page?: string;
  passport_copy?: string;
  passport_cover?: string;
  passport_cover_page?: string;
  passport_photo?: string;
  photo?: string;
  photograph?: string;
  national_id?: string;
  national_id_front?: string;
  national_id_back?: string;
  air_ticket?: string;
  return_ticket?: string;
  return_onward_ticket?: string;
  previous_uae_visa?: string;
  entry_exit_record?: string;
  guarantor_docs?: string;
  uae_residence_visa?: string;
  emirates_id_relative?: string;
  relationship_proof?: string;
  birth_certificate?: string;
  marriage_certificate?: string;
  hotel_booking?: string;
  bank_statement?: string;
  travel_history?: string;
  uploaded_documents?: string[];
  required_documents?: string[];
  additional_documents?: string[];
  optional_documents?: string[];
  additional_notes?: string;
  pdf_download_url?: string;
  secure_pdf_url?: string;
  pdf_url?: string;
  submitted_at?: string;
  passport_bio_attachment?: string;
  passport_cover_attachment?: string;
  passport_photo_attachment?: string;
  national_id_attachment?: string;
  national_id_front_attachment?: string;
  national_id_back_attachment?: string;
  air_ticket_attachment?: string;
  previous_uae_visa_attachment?: string;
  entry_exit_record_attachment?: string;
  guarantor_docs_attachment?: string;
  uae_residence_visa_attachment?: string;
  emirates_id_relative_attachment?: string;
  relationship_proof_attachment?: string;
  birth_certificate_attachment?: string;
  marriage_certificate_attachment?: string;
  hotel_booking_attachment?: string;
  bank_statement_attachment?: string;
  travel_history_attachment?: string;
  attachment?: string;
  attachments?: any;
}

/**
 * Resolves the public accessible website base URL.
 * Automatically maps internal development preview origins (ais-dev-) to publicly accessible endpoints (ais-pre-)
 * and supports custom production domain configurations without hardcoding.
 */
export function getPublicProductionUrl(): string {
  // 1. Check custom environment variable
  const envUrl = (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_APP_URL || import.meta.env?.VITE_API_BASE_URL)) ||
                 (typeof process !== 'undefined' && (process.env?.APP_URL || process.env?.VITE_APP_URL));
  if (envUrl && typeof envUrl === 'string' && !envUrl.includes('MY_APP_URL') && !envUrl.includes('your-domain')) {
    if (envUrl.includes('ais-dev-')) {
      return envUrl.replace('ais-dev-', 'ais-pre-').replace(/\/+$/, '');
    }
    return envUrl.replace(/\/+$/, '');
  }

  // 2. Client-side window.location
  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin;
    if (origin.includes('ais-dev-')) {
      return origin.replace('ais-dev-', 'ais-pre-').replace(/\/+$/, '');
    }
    return origin.replace(/\/+$/, '');
  }

  return 'https://zonetourism.ae';
}

/**
 * Builds the canonical, accessible HTTPS link to view / download an individual uploaded visa document.
 */
export function buildSecureVisaDocumentUrl(referenceId: string, docKey: string, filename?: string, token?: string): string {
  const cleanRefId = referenceId.replace(/[^a-zA-Z0-9_-]/g, '');
  const baseUrl = getPublicProductionUrl();
  const safeDocName = encodeURIComponent(filename || docKey);
  const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
  return `${baseUrl}/api/visa-applications/${encodeURIComponent(cleanRefId)}/documents/${safeDocName}${tokenParam}`;
}

/**
 * Builds the canonical, accessible HTTPS secure PDF link for a visa application reference.
 */
export function buildSecureVisaPdfUrl(referenceId: string, token?: string): string {
  const cleanRefId = referenceId.replace(/[^a-zA-Z0-9_-]/g, '');
  const baseUrl = getPublicProductionUrl();
  const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
  return `${baseUrl}/api/visa-applications/${encodeURIComponent(cleanRefId)}/pdf${tokenParam}`;
}

/**
 * Sends Car Rental Enquiry email via EmailJS template_d7v75aj.
 * Logs full diagnostic trace: EMAILJS START, credentials, keys, status/error.
 */
export async function sendCarRentalEnquiryEmail(
  params: CarRentalEnquiryEmailParams
): Promise<{ success: boolean; response?: any; error?: any; status?: number; text?: string }> {
  const serviceId = EMAILJS_PRODUCTION_CREDENTIALS.SERVICE_ID;
  const templateId = EMAILJS_PRODUCTION_CREDENTIALS.TEMPLATES.CAR_RENTAL;
  const publicKey = EMAILJS_PRODUCTION_CREDENTIALS.PUBLIC_KEY;

  initializeEmailJs();

  const submittedAt = params.submitted_at || new Date().toLocaleString('en-AE', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Dubai'
  });

  const templateParams: Record<string, string> = {
    pickup_location: params.pickup_location,
    dropoff_location: params.dropoff_location,
    pickup_date: params.pickup_date,
    pickup_time: params.pickup_time,
    return_date: params.return_date,
    return_time: params.return_time,
    service_type: params.service_type,
    vehicle_model: params.vehicle_type,
    whatsapp_number: params.whatsapp_number,
    reference_id: params.reference_id,
    submitted_at: submittedAt
  };

  console.group('📧 [EMAILJS START: CAR RENTAL]');
  console.log('service ID:', serviceId);
  console.log('template ID:', templateId);
  console.log('public key:', `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`);
  console.log('parameter object keys:', Object.keys(templateParams));

  try {
    const emailPromise = emailjs.send(serviceId, templateId, templateParams, { publicKey });
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('EmailJS request timed out after 10 seconds')), 10000)
    );
    const response = await Promise.race([emailPromise, timeoutPromise]);
    console.log('✅ [EMAILJS SUCCESS: CAR RENTAL]');
    console.log('status:', response.status);
    console.log('text:', response.text);
    console.groupEnd();
    return { success: true, response, status: response.status, text: response.text };
  } catch (error: any) {
    const errStatus = error?.status || error?.statusCode || 400;
    const errText = error?.text || error?.message || String(error);
    console.error('❌ [EMAILJS ERROR: CAR RENTAL]');
    console.error('status:', errStatus);
    console.error('text / error message:', errText);
    console.groupEnd();
    return { success: false, error, status: errStatus, text: errText };
  }
}

/**
 * Sends Visa Application email via EmailJS template_mu6mwue.
 * Logs full diagnostic trace: EMAILJS START, credentials, keys, status/error.
 */
export async function sendVisaApplicationEmail(
  params: VisaApplicationEmailParams
): Promise<{ success: boolean; response?: any; error?: any; status?: number; text?: string }> {
  const serviceId = EMAILJS_PRODUCTION_CREDENTIALS.SERVICE_ID;
  const templateId = EMAILJS_PRODUCTION_CREDENTIALS.TEMPLATES.VISA_APPLICATION;
  const publicKey = EMAILJS_PRODUCTION_CREDENTIALS.PUBLIC_KEY;

  initializeEmailJs();

  const submittedAt = params.submitted_at || new Date().toLocaleString('en-AE', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Dubai'
  });

  const applicantName = params.full_name || params.name || params.applicant_name || 'Applicant';
  const nationalityVal = params.nationality || params.applicant_nationality || 'Not specified';
  const dobVal = params.date_of_birth || params.dob || 'Not specified';
  const genderVal = params.gender || 'Not specified';
  const occupationVal = params.occupation || params.designation || 'Not specified';
  const whatsappVal = params.whatsapp_number || params.whatsapp || '';
  const emailVal = params.email || params.applicant_email || 'Not provided';
  const countryVal = params.current_country || params.country_of_residence || 'Not specified';
  const visaTypeVal = params.visa_type || '30 Days – Single Entry';
  const travelDateVal = params.intended_travel_date || params.travel_date || 'Not specified';
  const purposeVal = params.purpose_of_visit || params.purpose || 'Tourism';
  const otherPurposeVal = params.other_purpose || params.purpose_of_visit_other || (purposeVal === 'Other' ? '' : 'N/A');
  const notesVal = params.additional_notes || 'None provided';

  // Format Core/Required Documents
  const requiredDocs = params.required_documents && params.required_documents.length > 0
    ? params.required_documents
    : (params.uploaded_documents && params.uploaded_documents.length > 0 ? params.uploaded_documents : []);

  const requiredDocsFormatted = requiredDocs.length > 0
    ? requiredDocs.map(d => `• ${d}`).join('\n')
    : 'None';

  // Format Optional/Additional Documents
  const optionalDocs = params.optional_documents && params.optional_documents.length > 0
    ? params.optional_documents
    : (params.additional_documents && params.additional_documents.length > 0 ? params.additional_documents : []);

  const optionalDocsFormatted = optionalDocs.length > 0
    ? optionalDocs.map(d => `• ${d}`).join('\n')
    : 'None uploaded';

  // Combined documents list
  const allDocs = [
    ...requiredDocs,
    ...optionalDocs
  ];

  // Remove duplicates if any
  const uniqueAllDocs = Array.from(new Set(allDocs));

  const docsFormatted = uniqueAllDocs.length > 0
    ? uniqueAllDocs.map(d => `• ${d}`).join('\n')
    : 'None attached';

  const docsInline = uniqueAllDocs.length > 0
    ? uniqueAllDocs.join(', ')
    : 'None';

  // Individual Document Values - strictly "Uploaded" or "Not uploaded" with zero URLs
  const sanitizeDocStatus = (val?: string) => {
    if (!val || val === 'Not uploaded' || val === 'None' || val === 'N/A' || val.trim() === '') {
      return 'Not uploaded';
    }
    return 'Uploaded';
  };

  const passportBioVal = sanitizeDocStatus(params.passport_bio_page || params.passport_copy);
  const passportCoverVal = sanitizeDocStatus(params.passport_cover || params.passport_cover_page);
  const passportPhotoVal = sanitizeDocStatus(params.passport_photo || params.photo || params.photograph);
  const nationalIdVal = sanitizeDocStatus(params.national_id || params.national_id_front);
  const airTicketVal = sanitizeDocStatus(params.air_ticket || params.return_ticket || params.return_onward_ticket);

  const documentLinkText = (statusValue: string | undefined, attachmentUrl?: string) => {
    if (!statusValue || statusValue === 'Not uploaded' || statusValue === 'None' || statusValue === 'N/A' || statusValue.trim() === '') {
      return 'Not uploaded';
    }
    return attachmentUrl ? `${statusValue.replace(/\s*\(Attachment:[^)]*\)/g, '').trim()} — ${attachmentUrl}` : statusValue;
  };

  const templateParams: Record<string, any> = {
    // 1. Reference & Timestamps
    reference_id: params.reference_id,
    submitted_at: submittedAt,
    submission_date: submittedAt,

    // 2. Applicant Full Name (all common template aliases)
    full_name: applicantName,
    name: applicantName,
    applicant_name: applicantName,

    // 3. Nationality
    nationality: nationalityVal,
    applicant_nationality: nationalityVal,

    // 4. Date of Birth
    date_of_birth: dobVal,
    dob: dobVal,

    // 5. Gender
    gender: genderVal,
    applicant_gender: genderVal,

    // 6. Designation / Occupation
    occupation: occupationVal,
    designation: occupationVal,
    job_title: occupationVal,

    // 7. WhatsApp & Contact Phone
    whatsapp_number: whatsappVal,
    whatsapp: whatsappVal,
    phone_number: whatsappVal,
    phone: whatsappVal,

    // 8. Email
    email: emailVal,
    applicant_email: emailVal,
    email_address: emailVal,

    // 9. Current Country & Destination
    current_country: countryVal,
    country_of_residence: countryVal,
    residence_country: countryVal,
    country: countryVal,
    destination: params.destination || 'United Arab Emirates (Dubai)',

    // 10. Visa Type & Travel Date
    visa_type: visaTypeVal,
    visa_category: visaTypeVal,
    intended_travel_date: travelDateVal,
    travel_date: travelDateVal,

    // 11. Purpose of Visit & Other Purpose
    purpose: purposeVal,
    purpose_of_visit: purposeVal,
    visit_purpose: purposeVal,
    other_purpose: otherPurposeVal,
    purpose_of_visit_other: otherPurposeVal,

    // 12. Specific Document Uploaded Values (Mandatory & Core Fields)
    passport_bio_page: documentLinkText(params.passport_bio_page || params.passport_copy, params.passport_bio_attachment),
    passport_copy: documentLinkText(params.passport_copy || params.passport_bio_page, params.passport_bio_attachment),
    passport_bio: passportBioVal,
    passport_page: passportBioVal,
    passport: passportBioVal,

    passport_cover: documentLinkText(params.passport_cover || params.passport_cover_page, params.passport_cover_attachment),
    passport_cover_page: documentLinkText(params.passport_cover_page || params.passport_cover, params.passport_cover_attachment),
    cover_page: passportCoverVal,

    passport_photo: documentLinkText(params.passport_photo || params.photo || params.photograph, params.passport_photo_attachment),
    photo: passportPhotoVal,
    photograph: passportPhotoVal,
    passport_picture: passportPhotoVal,

    national_id: documentLinkText(params.national_id || params.national_id_front, params.national_id_attachment),
    national_id_front: documentLinkText(params.national_id_front || params.national_id, params.national_id_front_attachment || params.national_id_attachment),
    national_id_card: nationalIdVal,
    national_id_doc: nationalIdVal,
    national_id_back: documentLinkText(params.national_id_back, params.national_id_back_attachment),

    air_ticket: documentLinkText(params.air_ticket || params.return_ticket || params.return_onward_ticket, params.air_ticket_attachment),
    return_ticket: documentLinkText(params.return_ticket || params.air_ticket, params.air_ticket_attachment),
    return_onward_ticket: documentLinkText(params.return_onward_ticket || params.air_ticket, params.air_ticket_attachment),
    ticket: airTicketVal,
    flight_ticket: airTicketVal,
    onward_ticket: airTicketVal,

    // 13. Optional Document Uploaded Values (Strictly "Uploaded" or "Not uploaded")
    previous_uae_visa: sanitizeDocStatus(params.previous_uae_visa),
    previous_visa: sanitizeDocStatus(params.previous_uae_visa),
    entry_exit_record: sanitizeDocStatus(params.entry_exit_record),
    guarantor_docs: sanitizeDocStatus(params.guarantor_docs),
    guarantor_documents: sanitizeDocStatus(params.guarantor_docs),
    uae_residence_visa: sanitizeDocStatus(params.uae_residence_visa),
    emirates_id_relative: sanitizeDocStatus(params.emirates_id_relative),
    relationship_proof: sanitizeDocStatus(params.relationship_proof),
    birth_certificate: sanitizeDocStatus(params.birth_certificate),
    marriage_certificate: sanitizeDocStatus(params.marriage_certificate),
    hotel_booking: sanitizeDocStatus(params.hotel_booking),
    bank_statement: sanitizeDocStatus(params.bank_statement),
    travel_history: sanitizeDocStatus(params.travel_history),

    // 14. Document Summaries & Lists (Clean text, no URLs)
    uploaded_documents: docsFormatted,
    uploaded_documents_list: docsInline,
    documents_list: docsInline,
    required_documents: requiredDocsFormatted,
    required_documents_status: requiredDocs.length > 0
      ? `${requiredDocs.length} Required Core Document(s) Uploaded`
      : 'None',
    optional_documents: optionalDocsFormatted,
    additional_documents: optionalDocsFormatted,
    additional_documents_info: optionalDocs.length > 0
      ? `${optionalDocs.length} Optional Document(s) Attached`
      : 'No optional documents uploaded',
    optional_documents_status: optionalDocs.length > 0
      ? `${optionalDocs.length} Optional Document(s) Attached`
      : 'No optional documents uploaded',
    // Direct secure document links for the email body/template.
    passport_bio_attachment: params.passport_bio_attachment || '',
    passport_cover_attachment: params.passport_cover_attachment || '',
    passport_photo_attachment: params.passport_photo_attachment || '',
    national_id_front_attachment: params.national_id_front_attachment || params.national_id_attachment || '',
    national_id_back_attachment: params.national_id_back_attachment || '',
    national_id_attachment: params.national_id_attachment || '',
    air_ticket_attachment: params.air_ticket_attachment || '',
    previous_uae_visa_attachment: params.previous_uae_visa_attachment || '',
    entry_exit_record_attachment: params.entry_exit_record_attachment || '',
    guarantor_docs_attachment: params.guarantor_docs_attachment || '',
    uae_residence_visa_attachment: params.uae_residence_visa_attachment || '',
    emirates_id_relative_attachment: params.emirates_id_relative_attachment || '',
    relationship_proof_attachment: params.relationship_proof_attachment || '',
    birth_certificate_attachment: params.birth_certificate_attachment || '',
    marriage_certificate_attachment: params.marriage_certificate_attachment || '',
    hotel_booking_attachment: params.hotel_booking_attachment || '',
    bank_statement_attachment: params.bank_statement_attachment || '',
    travel_history_attachment: params.travel_history_attachment || '',

    // 15. Additional Notes
    additional_notes: notesVal,
    notes: notesVal,
    special_notes: notesVal,

    // 16. Secure application PDF links
    pdf_download_url: params.pdf_url ? `${params.pdf_url}${params.pdf_url.includes('?') ? '&' : '?'}download=true` : '',
    secure_pdf_url: params.pdf_url || '',
    pdf_url: params.pdf_url || '',
    pdf_link: params.pdf_url || '',
    pdf: params.pdf_url || '',
    application_pdf: params.pdf_url || '',
    document_url: '',
    download_pdf_url: params.pdf_url ? `${params.pdf_url}${params.pdf_url.includes('?') ? '&' : '?'}download=true` : ''
  };

  console.group('📧 [EMAILJS START: VISA APPLICATION]');
  console.log('service ID:', serviceId);
  console.log('template ID:', templateId);
  console.log('public key:', `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`);
  console.log('parameter object keys:', Object.keys(templateParams));
  console.log('reference ID:', params.reference_id);

  try {
    const emailPromise = emailjs.send(serviceId, templateId, templateParams, { publicKey });
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('EmailJS request timed out after 10 seconds')), 10000)
    );
    const response = await Promise.race([emailPromise, timeoutPromise]);
    console.log('✅ [EMAILJS SUCCESS: VISA APPLICATION]');
    console.log('status:', response.status);
    console.log('text:', response.text);
    console.groupEnd();
    return { success: true, response, status: response.status, text: response.text };
  } catch (error: any) {
    const errStatus = error?.status || error?.statusCode || 400;
    const errText = error?.text || error?.message || String(error);
    console.error('❌ [EMAILJS ERROR: VISA APPLICATION]');
    console.error('status:', errStatus);
    console.error('text / error message:', errText);
    console.groupEnd();
    return { success: false, error, status: errStatus, text: errText };
  }
}

