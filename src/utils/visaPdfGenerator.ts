import { jsPDF } from 'jspdf';
import { PDFDocument } from 'pdf-lib';

export interface UploadedImageData {
  name: string;
  category?: string;
  dataUrl?: string;
  type?: string;
  size?: number;
}

export interface VisaApplicationPdfData {
  referenceId: string;
  name: string;
  nationality: string;
  dob?: string;
  gender?: string;
  designation?: string;
  countryOfResidence?: string;
  destination: string;
  visaType: string;
  travelDate: string;
  whatsappNumber: string;
  email?: string;
  purposeOfVisit?: string;
  purposeOfVisitOther?: string;
  notes?: string;
  uploadedDocuments: string[];
  submissionDate?: string;
  passportCopy?: UploadedImageData | null;
  passportCover?: UploadedImageData | null;
  passportPhoto?: UploadedImageData | null;
  nationalIdFront?: UploadedImageData | null;
  nationalIdBack?: UploadedImageData | null;
  airTicket?: UploadedImageData | null;
  additionalFiles?: UploadedImageData[];
}

/**
 * Normalizes any category string or field key into an official, clean label
 */
export function getStandardCategoryLabel(category?: string, fieldName?: string): string {
  const str = `${category || ''} ${fieldName || ''}`.toLowerCase().trim();

  if (str.includes('bio') || str.includes('passport_copy') || (str.includes('passport') && (str.includes('copy') || str.includes('bio')))) {
    return 'Passport Bio Page';
  }
  if (str.includes('cover') || str.includes('passport_cover')) {
    return 'Passport Cover';
  }
  if (str.includes('photo') || str.includes('photograph') || str.includes('passport_photo') || str.includes('picture')) {
    return 'Passport Photo';
  }
  if (str.includes('national_id_front') || (str.includes('front') && (str.includes('national') || str.includes('id')))) {
    return 'National ID (Front)';
  }
  if (str.includes('national_id_back') || (str.includes('back') && (str.includes('national') || str.includes('id')))) {
    return 'National ID (Back)';
  }
  if (str.includes('emirates id') || str.includes('eid') || (str.includes('emirates') && str.includes('relative'))) {
    return 'Emirates ID';
  }
  if (str.includes('national id') || str.includes('national_id') || str.includes('id card')) {
    return 'National ID';
  }
  if (str.includes('ticket') || str.includes('air_ticket') || str.includes('return') || str.includes('flight') || str.includes('onward')) {
    return 'Return / Onward Ticket';
  }
  if (str.includes('previous') || str.includes('prev_visa') || str.includes('previous uae visa')) {
    return 'Previous UAE Visa';
  }
  if (str.includes('entry') || str.includes('exit') || str.includes('entry_exit') || str.includes('record')) {
    return 'Entry / Exit Record';
  }
  if (str.includes('guarantor') || str.includes('sponsor')) {
    return 'Guarantor / Sponsor Documents';
  }
  if (str.includes('residence visa') || str.includes('residence_visa')) {
    return 'Residence Visa';
  }
  if (str.includes('relationship') || str.includes('family') || str.includes('affidavit')) {
    return 'Relationship Proof';
  }
  if (str.includes('birth') || str.includes('birth_cert')) {
    return 'Birth Certificate';
  }
  if (str.includes('marriage') || str.includes('marriage_cert')) {
    return 'Marriage Certificate';
  }
  if (str.includes('hotel') || str.includes('accommodation') || str.includes('booking')) {
    return 'Hotel / Accommodation';
  }
  if (str.includes('bank') || str.includes('statement') || str.includes('funds')) {
    return 'Bank Statement';
  }
  if (str.includes('history') || str.includes('travel_history') || str.includes('visas')) {
    return 'Travel History';
  }

  if (category && category.trim()) return category.trim();
  return 'Attached Document';
}

/**
 * Format bytes to readable size string
 */
function formatBytesReadable(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Embeds an image into a jsPDF box while preserving its original aspect ratio and maximizing clarity
 */
function embedImageFitPage(
  doc: jsPDF,
  dataUrl: string | undefined,
  boxX: number,
  boxY: number,
  boxWidth: number,
  boxHeight: number
) {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) return;
  try {
    const props = doc.getImageProperties(dataUrl);
    const imgW = props.width || 1;
    const imgH = props.height || 1;

    const boxAspect = boxWidth / boxHeight;
    const imgAspect = imgW / imgH;

    let finalW = boxWidth;
    let finalH = boxHeight;
    let finalX = boxX;
    let finalY = boxY;

    if (imgAspect > boxAspect) {
      // Wider than box
      finalW = boxWidth;
      finalH = boxWidth / imgAspect;
      finalY = boxY + (boxHeight - finalH) / 2;
    } else {
      // Taller than box
      finalH = boxHeight;
      finalW = boxHeight * imgAspect;
      finalX = boxX + (boxWidth - finalW) / 2;
    }

    doc.addImage(dataUrl, 'JPEG', finalX, finalY, finalW, finalH, undefined, 'FAST');
  } catch {
    try {
      doc.addImage(dataUrl, boxX, boxY, boxWidth, boxHeight);
    } catch (err) {
      console.warn('Could not embed image:', err);
    }
  }
}

/**
 * Converts a Uint8Array into a standard Base64 string in safe memory chunks
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 32768;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

/**
 * Downloads PDF bytes to user's device
 */
export function savePdfBytesToDevice(bytes: Uint8Array, fileName: string) {
  try {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }, 1500);
  } catch (err) {
    console.error('Failed to save PDF to device:', err);
  }
}

/**
 * Generates the full Visa Application PDF:
 * - Page 1: Single official Application Summary with applicant details, passport photo frame, and checklist
 * - Subsequent Pages: Every user-uploaded document field receives its own dedicated page
 *   with a prominent, clear heading derived from the FORM FIELD/CATEGORY name, original filename, and embedded content.
 */
export async function generateVisaApplicationPdf(data: VisaApplicationPdfData): Promise<{
  doc: jsPDF;
  pdfBase64: string;
  pdfBytes: Uint8Array;
  save: (fileName?: string) => void;
}> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const submissionDate = data.submissionDate || new Date().toLocaleString('en-AE', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  // Color Palette
  const primaryNavy = [10, 37, 64];   // #0A2540
  const accentBlue = [11, 77, 162];   // #0B4DA2
  const textDark = [30, 41, 59];      // #1E293B
  const textMuted = [100, 116, 139];  // #64748B
  const bgLight = [248, 250, 252];    // #F8FAFC
  const borderLight = [226, 232, 240];

  // =============================================================
  // PAGE 1: OFFICIAL VISA APPLICATION SUMMARY
  // =============================================================

  // Header Banner
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('ZONE TOURISM LLC', 16, 13);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(210, 225, 245);
  doc.text('OFFICIAL VISA APPLICATION FORM', 16, 20);

  // Reference Box on top right
  doc.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
  doc.roundedRect(132, 5, 62, 18, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('APPLICATION REF ID:', 136, 11);
  doc.setFontSize(9.5);
  doc.text(data.referenceId, 136, 18);

  // Date bar
  let y = 35;
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Submission Date: ${submissionDate}`, 16, y);

  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.5);
  doc.line(16, y + 2, 194, y + 2);

  // Helper to draw a label & value
  const drawField = (label: string, value: string, xPos: number, yField: number) => {
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(label.toUpperCase(), xPos, yField);

    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const displayVal = (value || 'N/A').length > 38 ? (value || 'N/A').substring(0, 36) + '...' : (value || 'N/A');
    doc.text(displayVal, xPos, yField + 4.5);
  };

  // SECTION 1: APPLICANT DETAILS
  y = 44;
  const hasPhotoImg = !!(data.passportPhoto?.dataUrl && data.passportPhoto.dataUrl.startsWith('data:image/'));
  const infoWidth = hasPhotoImg ? 134 : 178;

  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(16, y, infoWidth, 68, 2, 2, 'F');
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(16, y, infoWidth, 68, 2, 2, 'S');

  doc.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
  doc.rect(16, y, 3, 68, 'F');

  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('1. APPLICANT INFORMATION', 23, y + 7);

  drawField('Full Name', data.name, 23, y + 15);
  drawField('Nationality', data.nationality, 78, y + 15);

  drawField('Date of Birth', data.dob || 'N/A', 23, y + 27);
  drawField('Gender', data.gender || 'N/A', 78, y + 27);

  drawField('Designation / Occupation', data.designation || 'N/A', 23, y + 39);
  drawField('Country of Residence', data.countryOfResidence || 'N/A', 78, y + 39);

  drawField('WhatsApp Number', data.whatsappNumber, 78, y + 51);

  if (data.email) {
    drawField('Email Address', data.email, 23, y + 62);
  }

  // Passport Photo Box on Right
  if (hasPhotoImg) {
    const photoBoxX = 156;
    const photoBoxY = y;
    const photoBoxW = 38;
    const photoBoxH = 48;

    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.roundedRect(photoBoxX, photoBoxY, photoBoxW, photoBoxH, 2, 2, 'F');
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.roundedRect(photoBoxX, photoBoxY, photoBoxW, photoBoxH, 2, 2, 'S');

    embedImageFitPage(doc, data.passportPhoto?.dataUrl, photoBoxX + 2, photoBoxY + 2, photoBoxW - 4, photoBoxH - 8);

    doc.setFontSize(6.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('APPLICANT PHOTO', photoBoxX + photoBoxW / 2, photoBoxY + photoBoxH - 2, { align: 'center' });
  }

  // SECTION 2: VISA & TRAVEL DETAILS
  y = 117;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(16, y, 178, 38, 2, 2, 'F');
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(16, y, 178, 38, 2, 2, 'S');

  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(16, y, 3, 38, 'F');

  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('2. VISA & TRAVEL DETAILS', 23, y + 7);

  drawField('Visa Type Applied', data.visaType, 23, y + 15);
  drawField('Destination', data.destination, 110, y + 15);

  drawField('Intended Travel Date', data.travelDate, 23, y + 26);
  const purposeDisplay = data.purposeOfVisit === 'Other' && data.purposeOfVisitOther
    ? `Other: ${data.purposeOfVisitOther}`
    : (data.purposeOfVisit || 'Tourism');
  drawField('Purpose of Visit', purposeDisplay, 110, y + 26);

  // SECTION 3: ATTACHED DOCUMENTS CHECKLIST
  y = 160;
  const docList = data.uploadedDocuments || [];
  const checklistHeight = Math.max(36, 14 + docList.length * 5.5);

  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(16, y, 178, checklistHeight, 2, 2, 'F');
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(16, y, 178, checklistHeight, 2, 2, 'S');

  doc.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
  doc.rect(16, y, 3, checklistHeight, 'F');

  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`3. ATTACHED DOCUMENTS (${docList.length})`, 23, y + 7);

  let docY = y + 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);

  if (docList.length === 0) {
    doc.text('• No documents uploaded in this submission.', 23, docY);
  } else {
    docList.forEach((d) => {
      doc.setTextColor(16, 185, 129);
      doc.text('✔', 23, docY);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(d, 28, docY);
      docY += 5.5;
    });
  }

  // SECTION 4: ADDITIONAL NOTES
  if (data.notes && data.notes.trim()) {
    y = y + checklistHeight + 4;
    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.roundedRect(16, y, 178, 18, 2, 2, 'F');
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.roundedRect(16, y, 178, 18, 2, 2, 'S');

    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('ADDITIONAL NOTES:', 23, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    const splitNotes = doc.splitTextToSize(data.notes.trim(), 168);
    doc.text(splitNotes, 23, y + 11);
  }

  // Mandatory Regulatory Footer Notice
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(
    'Notice: Visa approval and processing time are subject to the relevant UAE Immigration Authorities. Submission of documents does not guarantee visa approval.',
    16,
    286
  );

  doc.setFont('helvetica', 'bold');
  doc.text('ZONE TOURISM LLC • Dubai, UAE • WhatsApp: +971 55 558 6359', 16, 290);

  // =============================================================
  // SUBSEQUENT PAGES: ALL ATTACHED DOCUMENTS WITH EXPLICIT LABELS
  // =============================================================
  const allDocItems: UploadedImageData[] = [];
  if (data.passportCopy?.dataUrl) {
    allDocItems.push({
      ...data.passportCopy,
      category: getStandardCategoryLabel(data.passportCopy.category, 'Passport Bio Page')
    });
  }
  if (data.passportCover?.dataUrl) {
    allDocItems.push({
      ...data.passportCover,
      category: getStandardCategoryLabel(data.passportCover.category, 'Passport Cover')
    });
  }
  if (data.passportPhoto?.dataUrl) {
    allDocItems.push({
      ...data.passportPhoto,
      category: getStandardCategoryLabel(data.passportPhoto.category, 'Passport Photo')
    });
  }
  if (data.nationalIdFront?.dataUrl) {
    allDocItems.push({
      ...data.nationalIdFront,
      category: getStandardCategoryLabel(data.nationalIdFront.category, 'National ID (Front)')
    });
  }
  if (data.nationalIdBack?.dataUrl) {
    allDocItems.push({
      ...data.nationalIdBack,
      category: getStandardCategoryLabel(data.nationalIdBack.category, 'National ID (Back)')
    });
  }
  if (data.airTicket?.dataUrl) {
    allDocItems.push({
      ...data.airTicket,
      category: getStandardCategoryLabel(data.airTicket.category, 'Return / Onward Ticket')
    });
  }
  if (data.additionalFiles && data.additionalFiles.length > 0) {
    data.additionalFiles.forEach((file) => {
      if (file && file.dataUrl) {
        allDocItems.push({
          ...file,
          category: getStandardCategoryLabel(file.category, file.name)
        });
      }
    });
  }

  // Count occurrences of each category to support multi-page labeling (e.g. "PASSPORT BIO PAGE — Page 1")
  const categoryTotalCounts: Record<string, number> = {};
  allDocItems.forEach((item) => {
    const cat = item.category || 'Attached Document';
    categoryTotalCounts[cat] = (categoryTotalCounts[cat] || 0) + 1;
  });
  const categorySeenIndices: Record<string, number> = {};

  // Separate image documents from PDF documents
  const imageDocs = allDocItems.filter(f => f.dataUrl && (f.dataUrl.startsWith('data:image/') || f.type?.startsWith('image/')));
  const pdfDocs = allDocItems.filter(f => f.dataUrl && (f.dataUrl.startsWith('data:application/pdf') || f.name.toLowerCase().endsWith('.pdf')));

  // Render Image Document Pages in jsPDF
  imageDocs.forEach((docItem) => {
    doc.addPage('a4', 'portrait');

    const catName = docItem.category || 'Attached Document';
    categorySeenIndices[catName] = (categorySeenIndices[catName] || 0) + 1;
    const catIndex = categorySeenIndices[catName];
    const catTotal = categoryTotalCounts[catName] || 1;

    // Display Title: if multiple images for the same category, include page index
    const displayHeading = catTotal > 1
      ? `${catName.toUpperCase()} — PAGE ${catIndex}`
      : catName.toUpperCase();

    // 1. Top Navy Strip
    doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.rect(0, 0, 210, 16, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('ZONE TOURISM LLC • VISA APPLICATION ATTACHMENT', 16, 11);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ref: ${data.referenceId}`, 155, 11);

    // 2. Clear Document Heading Card (Appears before the image)
    const headerCardY = 22;
    const headerCardH = 24;
    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.roundedRect(12, headerCardY, 186, headerCardH, 2, 2, 'F');
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.roundedRect(12, headerCardY, 186, headerCardH, 2, 2, 'S');

    // Left accent bar
    doc.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
    doc.rect(12, headerCardY, 3.5, headerCardH, 'F');

    // Document Category Heading
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.text(displayHeading, 20, headerCardY + 9);

    // Original Filename & Details Line
    doc.setFontSize(8.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Filename: ', 20, headerCardY + 18);

    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'normal');
    const displayFilename = docItem.name.length > 55 ? docItem.name.substring(0, 52) + '...' : docItem.name;
    doc.text(displayFilename, 36, headerCardY + 18);

    const sizeStr = formatBytesReadable(docItem.size);
    if (sizeStr) {
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text(`•  Size: ${sizeStr}`, 145, headerCardY + 18);
    }

    // 3. Document Image Container & Frame (Fitting printable area without cropping)
    const imgFrameY = 50;
    const imgFrameH = 230;
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.5);
    doc.roundedRect(12, imgFrameY, 186, imgFrameH, 2, 2, 'S');

    // Embed image with preserved aspect ratio
    embedImageFitPage(doc, docItem.dataUrl, 15, imgFrameY + 3, 180, imgFrameH - 6);

    // 4. Footer
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(`ZONE TOURISM LLC • UAE Visa Application Attachment • Ref: ${data.referenceId}`, 14, 288);
  });

  // Render PDF Document Cover Pages in jsPDF (for PDF attachments before merging pages)
  pdfDocs.forEach((pdfItem) => {
    doc.addPage('a4', 'portrait');

    const catName = pdfItem.category || 'Attached Document';
    categorySeenIndices[catName] = (categorySeenIndices[catName] || 0) + 1;
    const catIndex = categorySeenIndices[catName];
    const catTotal = categoryTotalCounts[catName] || 1;

    const displayHeading = catTotal > 1
      ? `${catName.toUpperCase()} — PAGE ${catIndex}`
      : catName.toUpperCase();

    // Top Navy Strip
    doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.rect(0, 0, 210, 16, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('ZONE TOURISM LLC • ATTACHED PDF DOCUMENT', 16, 11);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ref: ${data.referenceId}`, 155, 11);

    // Document Heading Card
    const headerCardY = 22;
    const headerCardH = 24;
    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.roundedRect(12, headerCardY, 186, headerCardH, 2, 2, 'F');
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.roundedRect(12, headerCardY, 186, headerCardH, 2, 2, 'S');

    doc.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
    doc.rect(12, headerCardY, 3.5, headerCardH, 'F');

    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.text(displayHeading, 20, headerCardY + 9);

    doc.setFontSize(8.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Filename: ', 20, headerCardY + 18);

    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'normal');
    const displayFilename = pdfItem.name.length > 55 ? pdfItem.name.substring(0, 52) + '...' : pdfItem.name;
    doc.text(displayFilename, 36, headerCardY + 18);

    const sizeStr = formatBytesReadable(pdfItem.size);
    if (sizeStr) {
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text(`•  Size: ${sizeStr}`, 145, headerCardY + 18);
    }

    // PDF Info Box
    const infoY = 54;
    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.roundedRect(12, infoY, 186, 70, 2, 2, 'F');
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.roundedRect(12, infoY, 186, 70, 2, 2, 'S');

    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('ATTACHED PDF DOCUMENT DETAILS', 20, infoY + 12);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(`• Document Category: ${catName}`, 20, infoY + 22);
    doc.text(`• Uploaded File: ${pdfItem.name}`, 20, infoY + 30);
    doc.text(`• Format: Adobe PDF Document (Full Vector Resolution)`, 20, infoY + 38);
    doc.text(`• Application Reference ID: ${data.referenceId}`, 20, infoY + 46);

    doc.setTextColor(accentBlue[0], accentBlue[1], accentBlue[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('The complete original PDF document pages follow immediately in full resolution.', 20, infoY + 58);

    // Footer
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(`ZONE TOURISM LLC • UAE Visa Application Attachment • Ref: ${data.referenceId}`, 14, 288);
  });

  // Base PDF Bytes from jsPDF
  const baseArrayBuffer = doc.output('arraybuffer');
  let finalPdfBytes: Uint8Array = new Uint8Array(baseArrayBuffer);

  // If there are PDF documents attached, merge them using pdf-lib while preserving complete pages & content
  if (pdfDocs.length > 0) {
    try {
      const mergedPdf = await PDFDocument.load(finalPdfBytes);
      for (const pdfItem of pdfDocs) {
        if (!pdfItem.dataUrl) continue;
        try {
          const commaIdx = pdfItem.dataUrl.indexOf(',');
          const base64Data = commaIdx !== -1 ? pdfItem.dataUrl.substring(commaIdx + 1) : pdfItem.dataUrl;
          const binaryStr = atob(base64Data);
          const donorBytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            donorBytes[i] = binaryStr.charCodeAt(i);
          }
          const donorPdf = await PDFDocument.load(donorBytes);
          const copiedPages = await mergedPdf.copyPages(donorPdf, donorPdf.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        } catch (donorErr) {
          console.warn(`[PDF Attachment Merge Warning for ${pdfItem.name}]:`, donorErr);
        }
      }
      finalPdfBytes = await mergedPdf.save();
    } catch (mergeErr) {
      console.warn('[PDF-lib Merge Notice]: Falling back to base document:', mergeErr);
    }
  }

  // Verify PDF header magic bytes (%PDF)
  if (
    finalPdfBytes.length >= 4 &&
    !(finalPdfBytes[0] === 0x25 && finalPdfBytes[1] === 0x50 && finalPdfBytes[2] === 0x44 && finalPdfBytes[3] === 0x46)
  ) {
    console.warn('[PDF Validation Warning]: Generated bytes did not match %PDF header');
  }

  const pdfBase64 = uint8ArrayToBase64(finalPdfBytes);

  return {
    doc,
    pdfBase64,
    pdfBytes: finalPdfBytes,
    save: (fileName?: string) => {
      const fName = fileName || `UAE_Visa_Application_${data.referenceId}.pdf`;
      savePdfBytesToDevice(finalPdfBytes, fName);
    }
  };
}

/**
 * Direct download trigger for an existing VisaApplicationPdfData object
 */
export async function downloadVisaApplicationPdf(data: VisaApplicationPdfData, fileName?: string) {
  const result = await generateVisaApplicationPdf(data);
  const fName = fileName || `UAE_Visa_Application_${data.referenceId}.pdf`;
  result.save(fName);
}
