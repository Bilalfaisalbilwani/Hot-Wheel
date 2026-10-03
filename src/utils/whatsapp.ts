/**
 * Utility for formatting and sending Enquiry Data directly to WhatsApp
 */

export const PRIMARY_WHATSAPP_NUMBER = '971555586359'; // +971 55 558 6359
export const PRIMARY_WHATSAPP_DISPLAY = '+971 55 558 6359';

/**
 * Normalizes any phone / WhatsApp number into clean digits with international country code.
 * Handles UAE +971 numbers, Pakistani 03xx numbers, etc.
 */
export function normalizeWhatsAppNumber(rawNumber?: string): string {
  if (!rawNumber || typeof rawNumber !== 'string') {
    return PRIMARY_WHATSAPP_NUMBER;
  }

  const cleaned = rawNumber.replace(/\D/g, '');
  if (!cleaned) return PRIMARY_WHATSAPP_NUMBER;

  // If local UAE number starting with 05 (10 digits: 0555586359) -> 971555586359
  if (cleaned.startsWith('05') && cleaned.length === 10) {
    return '971' + cleaned.slice(1);
  }

  // If starts with 971 (e.g. 971555586359)
  if (cleaned.startsWith('971') && cleaned.length >= 11) {
    return cleaned;
  }

  // If local Pakistani format starting with 03 (11 digits: 03315424466) -> 923315424466
  if (cleaned.startsWith('03') && cleaned.length === 11) {
    return '92' + cleaned.slice(1);
  }

  // If Pakistani format without 0 or 92 (10 digits: 3315424466) -> 923315424466
  if (cleaned.startsWith('3') && cleaned.length === 10) {
    return '92' + cleaned;
  }

  // If already starts with 92 (e.g. 923315424466)
  if (cleaned.startsWith('92') && cleaned.length === 12) {
    return cleaned;
  }

  return cleaned;
}

/**
 * Builds the standard WhatsApp deep link with encoded message.
 */
export function buildWhatsAppLink(message: string, destinationNumber: string = PRIMARY_WHATSAPP_NUMBER): string {
  const cleanNumber = normalizeWhatsAppNumber(destinationNumber);
  const encodedText = encodeURIComponent(message.trim());
  return `https://wa.me/${cleanNumber}?text=${encodedText}`;
}

/**
 * Formats Full Visa Online Application into a clean, 100% symbol-safe WhatsApp message
 */
export function formatVisaApplicationWhatsApp(data: {
  referenceId: string;
  name: string;
  nationality: string;
  destination: string;
  visaType: string;
  travelDate: string;
  whatsappNumber: string;
  uploadedDocumentsCount?: number;
  uploadedDocuments?: string[];
  pdfOnlineUrl?: string;
  pdfUrl?: string;
}): string {
  const docsText = data.uploadedDocuments && data.uploadedDocuments.length > 0
    ? data.uploadedDocuments.map(d => ` - ${d}`).join('\n')
    : ` - ${data.uploadedDocumentsCount || 0} document(s) attached`;

  const onlineUrl = data.pdfUrl || data.pdfOnlineUrl;
  const pdfLinkLine = onlineUrl
    ? `\n----------------------------------------\n*Application PDF Document (Form + Files):*\n${onlineUrl}`
    : '';

  return `*VISA APPLICATION FORM SUBMISSION*
----------------------------------------
*Application Ref ID:* ${data.referenceId}
*Applicant Name:* ${data.name.trim()}
*Nationality:* ${data.nationality.trim()}
*Destination:* ${data.destination.trim()}
*Visa Category:* ${data.visaType.trim()}
*Intended Travel Date:* ${data.travelDate}
*Customer WhatsApp:* ${data.whatsappNumber.trim()}
----------------------------------------
*Attached Documents:*
${docsText}${pdfLinkLine}`.trim();
}

/**
 * Formats Car Rental Enquiry into a clean, 100% symbol-safe WhatsApp message
 */
export function formatCarRentalEnquiryWhatsApp(data: {
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  serviceType: string;
  vehicleType: string;
  whatsappNumber: string;
  customerName?: string;
  referenceId?: string;
}): string {
  const ref = data.referenceId ? `(Ref: ${data.referenceId})` : '';
  return `*NEW CAR RENTAL / FLEET ENQUIRY* ${ref}
----------------------------------------
${data.customerName ? `*Customer Name:* ${data.customerName.trim()}\n` : ''}*Pickup Location:* ${data.pickupLocation.trim()}
*Drop-off Location:* ${data.dropoffLocation.trim()}
*Pickup:* ${data.pickupDate} ${data.pickupTime}
*Return:* ${data.returnDate} ${data.returnTime}
*Service Type:* ${data.serviceType}
*Vehicle Type / Model:* ${data.vehicleType.trim()}
*Customer WhatsApp:* ${data.whatsappNumber.trim()}
----------------------------------------
Hello Hotwheels Car Rental! I submitted this car rental enquiry on the website. Please confirm vehicle availability and quote.`;
}

/**
 * Opens WhatsApp safely in a new tab without ever replacing the current screen or navigating the iframe.
 * Prevents "wa.me refused to connect" error by NEVER touching window.location.href.
 */
export function openWhatsAppDirectly(message: string, destinationNumber: string = PRIMARY_WHATSAPP_NUMBER): string {
  const url = buildWhatsAppLink(message, destinationNumber);
  if (typeof window !== 'undefined') {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 300);
    } catch (err) {
      console.warn('WhatsApp link click notice:', err);
    }
  }
  return url;
}
