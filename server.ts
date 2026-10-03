import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";

// Enforce new canonical EmailJS configuration on server & client bundle
process.env.VITE_EMAILJS_SERVICE_ID = "service_l6g6aq9";
process.env.VITE_EMAILJS_PUBLIC_KEY = "OlsbUfqZLPei_nsVk";
process.env.VITE_EMAILJS_TEMPLATE_CAR_RENTAL = "template_d7v75aj";
process.env.VITE_EMAILJS_TEMPLATE_VISA_APPLICATION = "template_mu6mwue";
delete process.env.VITE_EMAILJS_TEMPLATE_VISA_ENQUIRY;

import { createServer as createViteServer } from "vite";
import type { AdminCompanyInfo } from "./src/types";
import { 
  getActiveCars, 
  getAllCarsAdmin, 
  createCar, 
  updateCar, 
  deleteCar, 
  toggleCarStatus 
} from "./src/db/cars.ts";
import {
  getBankDetailsFromDb,
  updateBankDetailsInDb
} from "./src/db/bankAccounts.ts";
import { COMPANY_BANK_ACCOUNTS } from "./src/data/paymentConfig.ts";
import {
  createEnquiryInDb,
  getAllEnquiriesFromDb,
  getEnquiryByIdFromDb,
  updateEnquiryInDb,
  deleteEnquiryFromDb
} from "./src/db/enquiries.ts";
import { 
  requireAdminAuth, 
  requireDocumentAccessAuth,
  requireUploadSessionAuth,
  createAdminSession, 
  invalidateAdminSession, 
  verifyAdminSecret,
  createApplicantDocumentToken,
  createUploadSessionToken,
  verifyUploadSessionToken,
  type AuthRequest
} from "./src/middleware/auth.ts";
import { 
  uploadVisaPdfToSupabase, 
  uploadVisaDocumentToSupabase,
  downloadVisaPdfFromSupabase, 
  downloadVisaDocumentFromSupabase,
  uploadCarMediaToSupabase,
  downloadCarMediaFromSupabase,
  isSupabaseConfigured,
  getStorageBucketName
} from "./src/lib/supabase.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;
  const COMPANY_EMAIL = process.env.COMPANY_EMAIL || "";

  // CORS for an optional separate frontend/shared preview.
  // Same-origin production deployments remain unaffected.
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const configuredOrigins = (process.env.CORS_ORIGINS || process.env.APP_URL || '')
      .split(',')
      .map(v => v.trim().replace(/\/$/, ''))
      .filter(Boolean);
    const allowOrigin = origin && (
      configuredOrigins.includes(origin) ||
      (process.env.ALLOW_AISTUDIO_ORIGINS === 'true' && /(^|\.)ai\.studio$/i.test(new URL(origin).hostname))
    ) ? origin : (configuredOrigins.length === 0 ? '*' : undefined);

    if (allowOrigin) res.setHeader('Access-Control-Allow-Origin', allowOrigin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    if (req.method === 'OPTIONS') return res.status(204).end();
    next();
  });

  // Parse JSON payloads with increased size limit for file uploads (50MB)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Pre-seed state from initial structures
  let visaServicesState = [
    {
      id: 'visa-1',
      destination: 'Dubai / UAE',
      visaType: '30 Days Single Entry',
      duration: '30 Days',
      entryType: 'Single Entry',
      priceAED: 350,
      priceUSD: 100,
      description: 'Ideal for short vacations, family visits, or brief tourism in Dubai and across the UAE.',
      processingTime: 'Processing time may vary depending on the visa type, nationality and UAE Immigration approval.',
      validity: '60 Days from Issue Date',
      documentsRequired: ['Passport copy (valid for at least 6 months)', 'Passport-Size Photograph (white background)', 'Passport Cover Page', 'Confirmed Return/Onward Air Ticket — if required'],
      isActive: true,
      popular: true
    },
    {
      id: 'visa-2',
      destination: 'Dubai / UAE',
      visaType: '60 Days Single Entry',
      duration: '60 Days',
      entryType: 'Single Entry',
      priceAED: 700,
      priceUSD: 190,
      description: 'Perfect for extended vacations, longer holiday stays, or visiting relatives in the UAE.',
      processingTime: 'Processing time may vary depending on the visa type, nationality and UAE Immigration approval.',
      validity: '60 Days from Issue Date',
      documentsRequired: ['Passport copy (valid for at least 6 months)', 'Passport-Size Photograph (white background)', 'Passport Cover Page', 'Confirmed Return/Onward Air Ticket — if required'],
      isActive: true,
      popular: false
    },
    {
      id: 'visa-3',
      destination: 'Dubai / UAE',
      visaType: '30 Days Multiple Entry',
      duration: '30 Days',
      entryType: 'Multiple Entry',
      priceAED: 850,
      priceUSD: 230,
      description: 'Designed for travelers needing to exit and re-enter the UAE multiple times within 30 days.',
      processingTime: 'Processing time may vary depending on the visa type, nationality and UAE Immigration approval.',
      validity: '60 Days from Issue Date',
      documentsRequired: ['Passport copy (valid for at least 6 months)', 'Passport-Size Photograph (white background)', 'Passport Cover Page', 'Confirmed Return/Onward Air Ticket — if required'],
      isActive: true,
      popular: false
    },
    {
      id: 'visa-4',
      destination: 'Dubai / UAE',
      visaType: '60 Days Multiple Entry',
      duration: '60 Days',
      entryType: 'Multiple Entry',
      priceAED: 1400,
      priceUSD: 380,
      description: 'Maximum flexibility for frequent business or leisure travelers entering the UAE multiple times.',
      processingTime: 'Processing time may vary depending on the visa type, nationality and UAE Immigration approval.',
      validity: '60 Days from Issue Date',
      documentsRequired: ['Passport copy (valid for at least 6 months)', 'Passport-Size Photograph (white background)', 'Passport Cover Page', 'Confirmed Return/Onward Air Ticket — if required'],
      isActive: true,
      popular: true
    }
  ];

  let carsState = [
    {
      id: 'car-1',
      make: 'Mercedes-Benz',
      model: 'V-Class VIP Extra Long',
      category: 'Luxury',
      seats: 7,
      luggage: '6 Bags',
      image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
      rentalType: 'Both',
      dailyPrice: 1200,
      weeklyPrice: 7500,
      monthlyPrice: 24000,
      getQuoteOption: true,
      isAvailable: true,
      isMercedesChauffeur: true,
      description: 'Flagship executive multi-purpose vehicle with reclining leather captain chairs, dual panoramic sunroofs, and in-cabin Wi-Fi.'
    },
    {
      id: 'car-2',
      make: 'Mercedes-Benz',
      model: 'Vito Tourer Select',
      category: '7-Seater / MPV',
      seats: 8,
      luggage: '7 Bags',
      image: 'https://images.unsplash.com/photo-1559297434-fae8a1916a79?auto=format&fit=crop&w=800&q=80',
      rentalType: 'Both',
      dailyPrice: 850,
      weeklyPrice: 5200,
      monthlyPrice: 16500,
      getQuoteOption: true,
      isAvailable: true,
      isMercedesChauffeur: true,
      description: 'Practical, spacious luxury van ideal for airport transfers, family tours, and corporate golf groups.'
    },
    {
      id: 'car-3',
      make: 'Mercedes-Benz',
      model: 'S-Class 500 AMG Line',
      category: 'Luxury',
      seats: 4,
      luggage: '3 Bags',
      image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80',
      rentalType: 'Both',
      dailyPrice: 1800,
      weeklyPrice: 11000,
      monthlyPrice: 38000,
      getQuoteOption: true,
      isAvailable: true,
      isMercedesChauffeur: true,
      description: 'The pinnacle of chauffeured luxury. Rear executive seat with massage function, Burmester 3D surround, and soft-close doors.'
    },
    {
      id: 'car-4',
      make: 'Mercedes-Benz',
      model: 'E-Class Sedan',
      category: 'Luxury',
      seats: 4,
      luggage: '3 Bags',
      image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=800&q=80',
      rentalType: 'Both',
      dailyPrice: 650,
      weeklyPrice: 3900,
      monthlyPrice: 13000,
      getQuoteOption: true,
      isAvailable: true,
      isMercedesChauffeur: true,
      description: 'Refined business sedan tailored for corporate point-to-point transfers and airport runs in Dubai.'
    },
    {
      id: 'car-5',
      make: 'Nissan',
      model: 'Sunny 1.6L',
      category: 'Sedan',
      seats: 5,
      luggage: '2 Bags',
      image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80',
      rentalType: 'Self Drive',
      dailyPrice: 120,
      weeklyPrice: 700,
      monthlyPrice: 2100,
      getQuoteOption: false,
      isAvailable: true,
      isMercedesChauffeur: false,
      description: 'Economical, reliable compact sedan for daily commuting and city errands with great fuel economy.'
    },
    {
      id: 'car-6',
      make: 'Toyota',
      model: 'Fortuner 2.7L EXR 4WD',
      category: 'SUV',
      seats: 7,
      luggage: '4 Bags',
      image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80',
      rentalType: 'Both',
      dailyPrice: 280,
      weeklyPrice: 1650,
      monthlyPrice: 4800,
      getQuoteOption: true,
      isAvailable: true,
      isMercedesChauffeur: false,
      description: 'Robust 7-passenger SUV equipped with high ground clearance, rear air-conditioning, and 4x4 capability.'
    }
  ];

  let companyInfoState: AdminCompanyInfo = {
    travelCompanyName: 'ZONE TOURISM LLC',
    carRentalCompanyName: 'HOTWHEELS CAR RENTAL LLC',
    unifiedName: 'ZONE TOURISM LLC & HOTWHEELS CAR RENTAL LLC',
    phones: ['+971 4 222 6182', '+971 55 558 6359'],
    whatsappNumbers: ['971555586359'],
    email: 'info@zonetourism.ae',
    accountsEmail: 'accounts@zonetourism.ae',
    officeAddress: 'Shop No. 2, Ground Floor, Malik Saud Abdul Aziz Building, 8th Street, Al Rigga Road, Deira, Dubai, UAE – 125131',
    socialLinks: {
      instagram: 'https://instagram.com/zonetourism.ae',
      facebook: 'https://facebook.com/zonetourismdubai',
      linkedin: 'https://linkedin.com/company/zone-tourism-uae',
      tiktok: 'https://www.tiktok.com/@zonetourism.ae',
      twitter: ''
    },
    bankDetails: {
      primaryAccount: {
        companyAccountName: 'ZONE TOURISM LLC',
        bankName: '',
        accountNumber: '',
        iban: '',
        swiftCode: '',
        currency: 'AED',
        branchName: '',
        country: 'United Arab Emirates',
        instructions: 'For UAE Visit Visa services and general tourism packages.'
      },
      secondaryAccount: {
        companyAccountName: 'HOTWHEELS CAR RENTAL LLC',
        bankName: '',
        accountNumber: '',
        iban: '',
        swiftCode: '',
        currency: 'AED',
        branchName: '',
        country: 'United Arab Emirates',
        instructions: 'For Car Rental, VIP Chauffeur services, and corporate fleet bookings.'
      }
    }
  };

  // API Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Configurable Payment Information Endpoint (dynamic from PostgreSQL bank_accounts)
  app.get("/api/payment-config", async (req, res) => {
    try {
      const bankDetails = await getBankDetailsFromDb();
      res.json({
        success: true,
        bankTransfer: {
          primaryAccount: bankDetails.primaryAccount || COMPANY_BANK_ACCOUNTS[0],
          secondaryAccount: bankDetails.secondaryAccount || COMPANY_BANK_ACCOUNTS[2],
          accounts: COMPANY_BANK_ACCOUNTS,
          noticeNote: 'Please mention your booking/reference number when making the payment and share the payment receipt with our team for confirmation.',
          supportWhatsApp: companyInfoState.whatsappNumbers[0] || '971555586359',
          supportEmail: companyInfoState.accountsEmail || companyInfoState.email
        },
        cardPayment: {
          isEnabled: true,
          providerName: 'Authorized UAE Payment Gateway',
          statusMessage: 'Online credit and debit card payments (Visa, Mastercard, AMEX) are active via secure 256-bit SSL gateway.',
          supportedCards: ['Visa', 'Mastercard', 'American Express', 'Apple Pay']
        }
      });
    } catch (err: any) {
      console.error("Error retrieving payment config:", err);
      res.status(500).json({ success: false, error: "Failed to load payment configuration." });
    }
  });

  // In-memory store for registered payment link requests & transactions
  const paymentRequestsState: any[] = [];

  // 1. Official Merchant Payment Link Request Endpoint (PCI-DSS Compliant)
  app.post("/api/payments/request-link", async (req, res) => {
    try {
      const {
        serviceEntity,
        referenceNo,
        customerName,
        customerEmail,
        customerPhone,
        amount,
        currency = 'AED',
        notes
      } = req.body;

      if (!customerName || !amount) {
        return res.status(400).json({
          success: false,
          error: "Please complete all required fields (Name and Amount)."
        });
      }

      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({
          success: false,
          error: "Please enter a valid positive payment amount."
        });
      }

      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      const requestId = `REQ-PAY-${randomSuffix}`;
      const timestamp = new Date().toISOString();

      const requestRecord = {
        requestId,
        transactionId: requestId,
        referenceNo: referenceNo || `REF-${Math.floor(1000 + Math.random() * 9000)}`,
        serviceEntity: serviceEntity || 'Zone Tourism LLC & Hotwheels Car Rental LLC',
        customerName: String(customerName).trim(),
        customerEmail: customerEmail ? String(customerEmail).trim() : '',
        customerPhone: customerPhone ? String(customerPhone).trim() : '',
        amount: numAmount,
        currency: String(currency).toUpperCase(),
        notes: notes ? String(notes).trim() : '',
        status: 'Pending Merchant Link Dispatch',
        timestamp
      };

      paymentRequestsState.unshift(requestRecord);

      console.log(`[PAYMENT LINK REQUEST REGISTERED] Ref: ${requestRecord.referenceNo}, Customer: ${requestRecord.customerName}, Amount: ${requestRecord.currency} ${requestRecord.amount}`);

      return res.json({
        success: true,
        data: requestRecord,
        message: "Payment link request registered successfully. Official 3D-Secure payment link will be dispatched to customer."
      });
    } catch (err: any) {
      console.error("Error registering payment link request:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to register payment request. Please contact accounts support."
      });
    }
  });

  // 2. Direct Card Processing Endpoint: Strictly reject raw credit card data for PCI-DSS compliance
  app.post("/api/payments/card", (req, res) => {
    return res.status(400).json({
      success: false,
      error: "Direct transmission and storage of credit card numbers is disabled for PCI-DSS compliance and customer data protection. Please use /api/payments/request-link to receive an authorized 3D Secure banking gateway link."
    });
  });

  // 3. Get Card Payment Transactions & Requests (Strictly Protected for Authenticated Admin)
  app.get("/api/payments/transactions", requireAdminAuth, (req, res) => {
    res.json({
      success: true,
      data: paymentRequestsState
    });
  });

  // Public endpoint to get active visa services
  app.get("/api/visas", (req, res) => {
    const activeVisas = visaServicesState.filter(v => v.isActive);
    res.json({ success: true, data: activeVisas });
  });

  // Public endpoint to get available cars dynamically from Cloud SQL PostgreSQL
  app.get("/api/cars", async (req, res) => {
    try {
      const dbCars = await getActiveCars();
      // Strict field whitelisting: registration numbers, vehicle plates, or internal tracking IDs must NEVER leak
      const formattedCars = dbCars.map(c => ({
        id: c.id,
        make: c.make,
        model: c.model,
        category: c.category,
        serviceType: c.serviceType,
        rentalType: c.serviceType,
        seats: c.seats,
        luggage: c.luggage,
        dailyPrice: c.dailyPriceAED,
        dailyPriceAED: c.dailyPriceAED,
        dailyPriceUSD: c.dailyPriceUSD,
        weeklyPrice: c.weeklyPriceAED,
        weeklyPriceAED: c.weeklyPriceAED,
        weeklyPriceUSD: c.weeklyPriceUSD,
        monthlyPrice: c.monthlyPriceAED,
        monthlyPriceAED: c.monthlyPriceAED,
        monthlyPriceUSD: c.monthlyPriceUSD,
        yearlyPrice: (c as any).yearlyPriceAED || (c.monthlyPriceAED ? c.monthlyPriceAED * 10 : 0),
        yearlyPriceAED: (c as any).yearlyPriceAED || (c.monthlyPriceAED ? c.monthlyPriceAED * 10 : 0),
        yearlyPriceUSD: (c as any).yearlyPriceUSD || (c.monthlyPriceUSD ? c.monthlyPriceUSD * 10 : 0),
        image: c.image,
        description: c.description,
        getQuoteOption: c.getQuoteOption,
        isMercedesChauffeur: c.isMercedesChauffeur,
        isAvailable: c.isActive,
      }));
      return res.json({ success: true, data: formattedCars });
    } catch (error: any) {
      console.error("Failed to fetch public cars from PostgreSQL database:", error);
      // Fallback to safe whitelisted in-memory state in case of connection edge case
      const safeFallback = carsState.map(c => ({
        id: c.id,
        make: c.make,
        model: c.model,
        category: c.category,
        serviceType: c.rentalType,
        rentalType: c.rentalType,
        seats: c.seats,
        luggage: c.luggage,
        dailyPrice: c.dailyPrice,
        weeklyPrice: c.weeklyPrice,
        monthlyPrice: c.monthlyPrice,
        image: c.image,
        description: c.description,
        getQuoteOption: c.getQuoteOption,
        isMercedesChauffeur: c.isMercedesChauffeur,
        isAvailable: c.isAvailable,
      }));
      return res.json({ success: true, data: safeFallback });
    }
  });

  // Public endpoint for company contact info
  app.get("/api/company-info/public", (req, res) => {
    res.json({
      success: true,
      data: {
        travelCompanyName: companyInfoState.travelCompanyName,
        carRentalCompanyName: companyInfoState.carRentalCompanyName,
        unifiedName: companyInfoState.unifiedName,
        phones: companyInfoState.phones,
        whatsappNumbers: companyInfoState.whatsappNumbers,
        email: companyInfoState.email,
        officeAddress: companyInfoState.officeAddress,
        address: companyInfoState.officeAddress,
        googleMapsUrl: 'https://maps.app.goo.gl/LUEzbhsh17Jf8YgbA',
        googleMapsEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3608.0969913819927!2d55.3130791!3d25.2673225!2m3!1f0!2f0!3f0!3m2!1i1024!2f768!4f13.1!3m3!1m2!1s0x3e5f5ccade0db389%3A0xae9fbab7ef12feb2!2sZone%20Tourism%20LLC%20%26%20Hotwheels%20Car%20Rental!5e0!3m2!1sen!2sae!4v1710000000000!5m2!1sen!2sae',
        socialLinks: companyInfoState.socialLinks
      }
    });
  });

  // =========================================================================
  // DEDICATED VISA APPLICATION WORKFLOW (Server-Authoritative & Secure)
  // Stage 1: Initiate (Server assigns cryptographically secure Ref ID & Tokens)
  // Stage 2: Upload Documents & PDF (Authorized via short-lived Upload Token)
  // Stage 3: Commit / Finalize (Persist to PostgreSQL with strict error handling)
  // =========================================================================

  // STAGE 1: INITIATE VISA APPLICATION SESSION
  app.post("/api/visa-applications/initiate", (req, res) => {
    try {
      const { name, nationality, visaType } = req.body;
      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({ success: false, error: "Please enter applicant's full name (minimum 2 characters)." });
      }

      // Generate cryptographically secure random reference ID (VT-XXXXXX)
      const randomNum = crypto.randomInt(100000, 999999);
      const referenceId = `VT-${randomNum}`;
      const uploadToken = createUploadSessionToken(referenceId, 7200); // 2 hours
      const documentAccessToken = createApplicantDocumentToken(referenceId, 7 * 24 * 3600); // 7 days

      return res.json({
        success: true,
        referenceId,
        uploadToken,
        documentAccessToken,
        pdfUrl: `/api/visa-applications/${encodeURIComponent(referenceId)}/pdf?token=${encodeURIComponent(documentAccessToken)}`
      });
    } catch (err: any) {
      console.error("Error initiating visa application:", err);
      return res.status(500).json({ success: false, error: "Failed to initiate visa application session." });
    }
  });

  // Dedicated Simple Enquiry Endpoints (Phase 1: Customer views vehicle/visa -> Enquire / WhatsApp -> Team provides quote)
  // 1. VISA ENQUIRY & ONLINE DOCUMENT UPLOAD - Persisted to PostgreSQL
  app.post("/api/enquiries/visa", requireUploadSessionAuth, async (req, res) => {
    try {
      const { 
        name, 
        nationality,
destination, 
        travelDate, 
        whatsappNumber,
        email,
        dob,
        gender,
        designation,
        countryOfResidence,
        purposeOfVisit,
        message,
        visaType,
        specialNotes,
        uploadedDocuments,
        referenceId: clientRefId,
        uploadToken
      } = req.body;

      // Proper validation of required fields
      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({ success: false, error: "Please enter your full name (minimum 2 characters)." });
      }
      if (!nationality || typeof nationality !== 'string' || nationality.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Please specify your nationality." });
      }
      if (!travelDate || typeof travelDate !== 'string') {
        return res.status(400).json({ success: false, error: "Please select your planned travel date." });
      }
      if (!whatsappNumber || typeof whatsappNumber !== 'string' || whatsappNumber.replace(/\D/g, '').length < 7) {
        return res.status(400).json({ success: false, error: "Please provide a valid WhatsApp number with country code." });
      }

      // Check uploadToken if supplied or validate clean referenceId
      let referenceId = clientRefId ? String(clientRefId).replace(/[^a-zA-Z0-9_-]/g, '') : '';
      if (!referenceId) {
        referenceId = `VT-${crypto.randomInt(100000, 999999)}`;
      }

      const timestamp = new Date().toISOString();

      const docInfo = Array.isArray(uploadedDocuments) && uploadedDocuments.length > 0
        ? `Uploaded Documents (${uploadedDocuments.length}): ` + uploadedDocuments.join(', ')
        : 'No direct attachments';

      const detailsNote = [
        `Visa Type: ${visaType || destination || '30 Days – Single Entry'}`,
        dob ? `DOB: ${dob}` : null,
        gender ? `Gender: ${gender}` : null,
        designation ? `Designation: ${designation}` : null,
        countryOfResidence ? `Country of Residence: ${countryOfResidence}` : null,
        purposeOfVisit ? `Purpose: ${purposeOfVisit}` : null,
        email ? `Email: ${email}` : null,
        message || specialNotes ? `Notes: ${message || specialNotes}` : null,
        docInfo
      ].filter(Boolean).join(' | ');

      // Persist to PostgreSQL database (fail safely if DB down)
      let savedEnquiry;
      try {
        savedEnquiry = await createEnquiryInDb({
          referenceId,
          enquiryType: 'visa',
          name: name.trim(),
          nationality: nationality.trim(),
destination: destination ? destination.trim() : 'United Arab Emirates (Dubai)',
          travelDate,
          whatsappNumber: whatsappNumber.trim(),
          status: 'New',
          notes: detailsNote
        });
      } catch (dbErr: any) {
        console.error("Database save failed for visa application:", dbErr);
        return res.status(500).json({ 
          success: false, 
          error: "Failed to persist visa application to the database. Please try again or contact our visa desk directly." 
        });
      }

      const documentAccessToken = createApplicantDocumentToken(referenceId, 7 * 24 * 3600);

      // Log routing to company's visa operations team
      console.log(`========================================`);
      console.log(`[PERSISTED TO POSTGRESQL & ROUTED - VISA APPLICATION WITH DOCS]`);
      console.log(`Enquiry ID   : ${savedEnquiry.id}`);
      console.log(`Reference ID : ${referenceId}`);
      console.log(`Timestamp    : ${timestamp}`);
      console.log(`Applicant    : ${name.trim()}`);
      console.log(`Nationality  : ${nationality.trim()}`);
console.log(`Visa Type    : ${visaType || destination}`);
      console.log(`Documents    : ${docInfo}`);
      console.log(`WhatsApp     : ${whatsappNumber.trim()}`);
      console.log(`Routed to    : Zone Tourism LLC Visa Operations Desk (${COMPANY_EMAIL})`);
      console.log(`========================================`);

      return res.json({
        success: true,
        referenceId,
        id: savedEnquiry.id,
        documentAccessToken,
        pdfUrl: `/api/visa-applications/${encodeURIComponent(referenceId)}/pdf?token=${encodeURIComponent(documentAccessToken)}`,
        message: "Your visa application and documents have been uploaded and routed directly to Zone Tourism LLC visa desk.",
        timestamp,
        routedTo: {
          team: "Zone Tourism LLC Visa Operations Team",
          email: COMPANY_EMAIL,
          whatsappNumber: companyInfoState.whatsappNumbers[0] || ""
        }
      });
    } catch (err: any) {
      console.error("Error processing visa application:", err);
      return res.status(500).json({ success: false, error: "Internal server error while saving visa application." });
    }
  });

  // VISA APPLICATION PDF & DOCUMENTS STORAGE & ONLINE ACCESS ENDPOINTS
  const visaApplicationsPdfStore = new Map<string, { base64Data: string; filename: string; timestamp: string }>();
  const visaDocumentsStore = new Map<string, { buffer: Buffer; mimeType: string; filename: string; category?: string }>();
  const VISA_PDF_DIR = path.resolve("./uploads/visa-pdfs");
  const VISA_DOCS_DIR = path.resolve("./uploads/visa-documents");
  try {
    if (!fs.existsSync(VISA_PDF_DIR)) {
      fs.mkdirSync(VISA_PDF_DIR, { recursive: true });
    }
    if (!fs.existsSync(VISA_DOCS_DIR)) {
      fs.mkdirSync(VISA_DOCS_DIR, { recursive: true });
    }
  } catch (dirErr) {
    console.warn("Could not create uploads directory:", dirErr);
  }

  // Document category allowlist for strict path safety and type validation
  const ALLOWED_VISA_DOC_CATEGORIES = new Set([
    'passport_copy', 'passport_cover', 'passport_photo',
    'national_id_front', 'national_id_back', 'air_ticket',
    'previous_uae_visa', 'entry_exit_record', 'guarantor_docs',
    'uae_residence_visa', 'emirates_id_relative', 'relationship_proof',
    'birth_certificate', 'marriage_certificate', 'hotel_booking',
    'bank_statement', 'travel_history', 'other_document'
  ]);

  // STAGE 2A: UPLOAD APPLICATION PDF (Protected by Upload Session Auth)
  app.post("/api/visa-applications/upload-pdf", requireUploadSessionAuth, async (req, res) => {
    try {
      const { referenceId, pdfBase64, filename } = req.body;
      if (!referenceId || !pdfBase64) {
        return res.status(400).json({ success: false, error: "Missing referenceId or pdfBase64" });
      }

      // Check max size (25MB payload limit)
      if (typeof pdfBase64 === 'string' && pdfBase64.length > 35 * 1024 * 1024) {
        return res.status(413).json({ success: false, error: "PDF exceeds maximum allowed upload size (25MB)." });
      }

      const cleanRefId = referenceId.replace(/[^a-zA-Z0-9_-]/g, '');
      const safeFilename = `UAE_Visa_Application_${cleanRefId}.pdf`;

      // Verify path containment
      const diskPath = path.resolve(VISA_PDF_DIR, `${cleanRefId}.pdf`);
      if (!diskPath.startsWith(path.resolve(VISA_PDF_DIR) + path.sep)) {
        return res.status(400).json({ success: false, error: "Path traversal attempt detected." });
      }

      // 1. Store in fast memory map
      visaApplicationsPdfStore.set(referenceId, {
        base64Data: pdfBase64,
        filename: safeFilename,
        timestamp: new Date().toISOString()
      });
      visaApplicationsPdfStore.set(cleanRefId, {
        base64Data: pdfBase64,
        filename: safeFilename,
        timestamp: new Date().toISOString()
      });

      // 2. Persist to disk
      let pdfBuffer: Buffer | null = null;
      try {
        const commaIdx = pdfBase64.indexOf(',');
        const base64Clean = commaIdx !== -1 ? pdfBase64.substring(commaIdx + 1) : pdfBase64;
        pdfBuffer = Buffer.from(base64Clean, 'base64');
        fs.writeFileSync(diskPath, pdfBuffer);
      } catch (writeErr) {
        console.warn("Could not write PDF to disk:", writeErr);
      }

      // 3. Upload to private Supabase Storage 'website-files' if configured
      let uploadResult: { success: boolean; storagePath: string; signedUrl?: string | null } = { success: false, storagePath: '', signedUrl: null };
      if (pdfBuffer && isSupabaseConfigured()) {
        try {
          uploadResult = await uploadVisaPdfToSupabase(cleanRefId, pdfBuffer, safeFilename);
          if (uploadResult.success) {
            console.log(`[Supabase Storage] Visa Application PDF stored in private bucket 'website-files': ${uploadResult.storagePath}`);
          }
        } catch (supabaseErr) {
          console.warn("[Supabase Storage Upload Notice]:", supabaseErr);
        }
      }

      return res.json({
        success: true,
        referenceId: cleanRefId,
        pdfUrl: `/api/visa-applications/${encodeURIComponent(cleanRefId)}/pdf`,
        storagePath: uploadResult.storagePath,
        signedUrl: uploadResult.signedUrl
      });
    } catch (err: any) {
      console.error("Error uploading application PDF:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // STAGE 2B: UPLOAD INDIVIDUAL VISA DOCUMENT (Protected by Upload Session Auth)
  app.post("/api/visa-applications/upload-document", requireUploadSessionAuth, async (req, res) => {
    try {
      const { referenceId, fileBase64, filename, mimeType, category } = req.body;
      if (!referenceId || !fileBase64 || !filename) {
        return res.status(400).json({ success: false, error: "Missing referenceId, fileBase64, or filename" });
      }

      // Check max size (15MB payload limit)
      if (typeof fileBase64 === 'string' && fileBase64.length > 20 * 1024 * 1024) {
        return res.status(413).json({ success: false, error: "Document exceeds maximum allowed upload size (15MB)." });
      }

      const cleanRefId = referenceId.replace(/[^a-zA-Z0-9_-]/g, '');

      // Strict category resolution against allowlist
      const isAdditional = typeof category === 'string' && /^additional_\d+$/.test(category);
      const safeCategory = (category && (ALLOWED_VISA_DOC_CATEGORIES.has(category) || isAdditional))
        ? category
        : 'other_document';

      // Strict extension & MIME validation
      const rawExt = path.extname(filename || '').toLowerCase();
      const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'].includes(rawExt) ? rawExt : '.jpg';
      const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/octet-stream']);
      const resolvedMime = (mimeType && ALLOWED_MIMES.has(mimeType)) ? mimeType : 'application/octet-stream';

      // Server-generated unguessable safe filename (never trust raw client filename)
      const randomToken = crypto.randomBytes(4).toString('hex');
      const safeFilename = `${safeCategory}_${randomToken}${safeExt}`;

      const commaIdx = fileBase64.indexOf(',');
      const cleanBase64 = commaIdx !== -1 ? fileBase64.substring(commaIdx + 1) : fileBase64;
      const fileBuffer = Buffer.from(cleanBase64, 'base64');

      // 1. In-memory store
      visaDocumentsStore.set(`${cleanRefId}:${safeFilename}`, {
        buffer: fileBuffer,
        mimeType: resolvedMime,
        filename: safeFilename,
        category: safeCategory
      });
      visaDocumentsStore.set(`${cleanRefId}:${safeCategory}`, {
        buffer: fileBuffer,
        mimeType: resolvedMime,
        filename: safeFilename,
        category: safeCategory
      });

      // 2. Local disk store with strict path containment check
      try {
        const refDocDir = path.resolve(VISA_DOCS_DIR, cleanRefId);
        if (!fs.existsSync(refDocDir)) {
          fs.mkdirSync(refDocDir, { recursive: true });
        }
        const diskFilePath = path.resolve(refDocDir, safeFilename);
        if (!diskFilePath.startsWith(refDocDir + path.sep)) {
          return res.status(400).json({ success: false, error: "Path traversal attempt rejected." });
        }
        fs.writeFileSync(diskFilePath, fileBuffer);
      } catch (diskErr) {
        console.warn("Could not save document to disk:", diskErr);
      }

      // 3. Supabase private bucket store
      let storagePath = '';
      if (isSupabaseConfigured()) {
        const uploadResult = await uploadVisaDocumentToSupabase(
          cleanRefId,
          fileBuffer,
          safeFilename,
          resolvedMime
        );
        storagePath = uploadResult.storagePath;
      }

      return res.json({
        success: true,
        referenceId: cleanRefId,
        filename: safeFilename,
        category: safeCategory,
        storagePath
      });
    } catch (err: any) {
      console.error("Error uploading visa document to storage:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // STREAM / DOWNLOAD INDIVIDUAL VISA DOCUMENT (Protected by requireDocumentAccessAuth)
  app.get("/api/visa-applications/:refId/documents/:docName", requireDocumentAccessAuth, async (req, res) => {
    try {
      const { refId, docName } = req.params;
      const cleanRefId = refId.replace(/[^a-zA-Z0-9_-]/g, '');
      const cleanDocName = path.basename(docName).replace(/[^a-zA-Z0-9_.-]/g, '_');
      const isDownload = req.query.download === '1' || req.query.download === 'true';

      // Path containment check on requested document name
      const refDocDir = path.resolve(VISA_DOCS_DIR, cleanRefId);
      const targetDiskPath = path.resolve(refDocDir, cleanDocName);
      if (!targetDiskPath.startsWith(refDocDir + path.sep) && targetDiskPath !== refDocDir) {
        return res.status(400).send("Invalid document path request.");
      }

      let fileBuffer: Buffer | null = null;
      let contentType = 'application/octet-stream';
      let returnFilename = cleanDocName;

      // 1. Check in-memory store
      const memDoc = visaDocumentsStore.get(`${cleanRefId}:${cleanDocName}`);
      if (memDoc) {
        fileBuffer = memDoc.buffer;
        contentType = memDoc.mimeType;
        returnFilename = memDoc.filename;
      }

      // 2. Check local disk
      if (!fileBuffer && fs.existsSync(refDocDir)) {
        const files = fs.readdirSync(refDocDir);
        const found = files.find(f => f === cleanDocName || f.startsWith(cleanDocName + '.') || cleanDocName.startsWith(f));
        if (found) {
          const matchedDiskPath = path.resolve(refDocDir, found);
          if (matchedDiskPath.startsWith(refDocDir + path.sep)) {
            fileBuffer = fs.readFileSync(matchedDiskPath);
            returnFilename = found;
            const ext = path.extname(found).toLowerCase();
            if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
            else if (ext === '.png') contentType = 'image/png';
            else if (ext === '.webp') contentType = 'image/webp';
            else if (ext === '.pdf') contentType = 'application/pdf';
          }
        }
      }

      // 3. Check Supabase private storage
      if (!fileBuffer && isSupabaseConfigured()) {
        try {
          const supaDoc = await downloadVisaDocumentFromSupabase(cleanRefId, cleanDocName);
          if (supaDoc) {
            fileBuffer = supaDoc.buffer;
            contentType = supaDoc.contentType;
          }
        } catch (supaErr) {
          console.warn("[Supabase Storage Document Download Notice]:", supaErr);
        }
      }

      if (!fileBuffer) {
        return res.status(404).send(`Document '${encodeURIComponent(cleanDocName)}' not found for Application ${encodeURIComponent(cleanRefId)}.`);
      }

      // Infer MIME if still generic
      if (contentType === 'application/octet-stream') {
        const ext = path.extname(returnFilename).toLowerCase();
        if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
        else if (ext === '.png') contentType = 'image/png';
        else if (ext === '.webp') contentType = 'image/webp';
        else if (ext === '.pdf') contentType = 'application/pdf';
      }

      const disposition = isDownload ? 'attachment' : 'inline';
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `${disposition}; filename="${returnFilename}"`);
      res.setHeader('Content-Length', fileBuffer.length);
      res.setHeader('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      return res.send(fileBuffer);
    } catch (err: any) {
      console.error("Error streaming visa document:", err);
      return res.status(500).send("Error reading document.");
    }
  });

  // SERVER-SIDE EMAIL SENDER (Calls EmailJS REST API with full server-side document attachment references)
  app.post("/api/visa-applications/send-email", async (req, res) => {
    try {
      const data = req.body;
      const refId = data.reference_id || data.referenceId;
      if (!refId) {
        return res.status(400).json({ success: false, error: "Missing reference_id" });
      }

      const cleanRefId = refId.replace(/[^a-zA-Z0-9_-]/g, '');

      // Resolve base public origin
      let publicOrigin = 'https://zonetourism.ae';
      const rawAppUrl = process.env.APP_URL || process.env.VITE_APP_URL || '';
      if (rawAppUrl && !rawAppUrl.includes('MY_APP_URL')) {
        publicOrigin = rawAppUrl.includes('ais-dev-')
          ? rawAppUrl.replace('ais-dev-', 'ais-pre-').replace(/\/+$/, '')
          : rawAppUrl.replace(/\/+$/, '');
      }

      const submittedAt = data.submitted_at || new Date().toLocaleString('en-AE', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Dubai'
      });

      // Helper to retrieve document binary from memory, disk, or Supabase
      const getDocBinary = async (docKey: string, filename?: string): Promise<{ buffer: Buffer; mime: string; name: string; base64: string } | null> => {
        // Direct body file payload if available
        if (data[`${docKey}_file`]?.dataUrl) {
          const rawUrl = data[`${docKey}_file`].dataUrl;
          const commaIdx = rawUrl.indexOf(',');
          const b64 = commaIdx !== -1 ? rawUrl.substring(commaIdx + 1) : rawUrl;
          const mime = rawUrl.startsWith('data:') ? rawUrl.substring(5, rawUrl.indexOf(';')) : 'image/jpeg';
          return {
            buffer: Buffer.from(b64, 'base64'),
            mime,
            name: data[`${docKey}_file`].name || `${docKey}.jpg`,
            base64: rawUrl
          };
        }

        // Memory store
        let memDoc = visaDocumentsStore.get(`${cleanRefId}:${filename || docKey}`);
        if (!memDoc && docKey) {
          memDoc = visaDocumentsStore.get(`${cleanRefId}:${docKey}`);
        }
        if (memDoc) {
          return {
            buffer: memDoc.buffer,
            mime: memDoc.mimeType,
            name: memDoc.filename || `${docKey}.jpg`,
            base64: `data:${memDoc.mimeType};base64,${memDoc.buffer.toString('base64')}`
          };
        }

        // Local disk
        const refDocDir = path.join(VISA_DOCS_DIR, cleanRefId);
        if (fs.existsSync(refDocDir)) {
          const files = fs.readdirSync(refDocDir);
          const found = files.find(f => f === filename || f.startsWith(docKey) || (filename && f === filename));
          if (found) {
            const buf = fs.readFileSync(path.join(refDocDir, found));
            const ext = path.extname(found).toLowerCase();
            let mime = 'image/jpeg';
            if (ext === '.png') mime = 'image/png';
            else if (ext === '.pdf') mime = 'application/pdf';
            else if (ext === '.webp') mime = 'image/webp';
            return {
              buffer: buf,
              mime,
              name: found,
              base64: `data:${mime};base64,${buf.toString('base64')}`
            };
          }
        }

        // Supabase private storage 'website-files'
        if (isSupabaseConfigured()) {
          try {
            const supaDoc = await downloadVisaDocumentFromSupabase(cleanRefId, filename || docKey);
            if (supaDoc) {
              return {
                buffer: supaDoc.buffer,
                mime: supaDoc.contentType,
                name: filename || `${docKey}.jpg`,
                base64: `data:${supaDoc.contentType};base64,${supaDoc.buffer.toString('base64')}`
              };
            }
          } catch (supaErr) {
            console.warn('[Supabase Storage Doc Retrieval Notice]:', supaErr);
          }
        }

        return null;
      };

      // Retrieve binary attachments for uploaded documents
      const bioDoc = await getDocBinary('passport_copy', data.passport_copy_name || data.passport_bio_name);
      const coverDoc = await getDocBinary('passport_cover', data.passport_cover_name);
      const photoDoc = await getDocBinary('passport_photo', data.passport_photo_name);
      const idFrontDoc = await getDocBinary('national_id_front', data.national_id_front_name);
      const idBackDoc = await getDocBinary('national_id_back', data.national_id_back_name);
      const ticketDoc = await getDocBinary('air_ticket', data.air_ticket_name);

      // Collect all available document attachments
      const allAttachments: { name: string; base64: string }[] = [];
      if (bioDoc) allAttachments.push({ name: 'Passport_Bio_Page', base64: bioDoc.base64 });
      if (coverDoc) allAttachments.push({ name: 'Passport_Cover', base64: coverDoc.base64 });
      if (photoDoc) allAttachments.push({ name: 'Passport_Photo', base64: photoDoc.base64 });
      if (idFrontDoc) allAttachments.push({ name: 'National_ID_Front', base64: idFrontDoc.base64 });
      if (idBackDoc) allAttachments.push({ name: 'National_ID_Back', base64: idBackDoc.base64 });
      if (ticketDoc) allAttachments.push({ name: 'Return_Ticket', base64: ticketDoc.base64 });

      // Clean human-readable document statuses - strictly "Uploaded" or "Not uploaded", ZERO URLs in email body
      const checkUploaded = (docObj: any, fieldVal?: string) => {
        if (docObj) return 'Uploaded';
        if (!fieldVal || fieldVal === 'Not uploaded' || fieldVal === 'None' || fieldVal === 'N/A' || fieldVal.trim() === '') {
          return 'Not uploaded';
        }
        return 'Uploaded';
      };

      const passportBioVal = checkUploaded(bioDoc, data.passport_bio_page || data.passport_copy);
      const passportCoverVal = checkUploaded(coverDoc, data.passport_cover);
      const passportPhotoVal = checkUploaded(photoDoc, data.passport_photo);
      const nationalIdVal = (idFrontDoc || idBackDoc) ? 'Uploaded' : checkUploaded(null, data.national_id);
      const airTicketVal = checkUploaded(ticketDoc, data.return_onward_ticket || data.air_ticket);

      const applicantName = data.full_name || data.name || data.applicant_name || 'Applicant';
      const nationalityVal = data.nationality || 'Not specified';
      const dobVal = data.date_of_birth || data.dob || 'Not specified';
      const genderVal = data.gender || 'Not specified';
      const occupationVal = data.occupation || data.designation || 'Not specified';
      const whatsappVal = data.whatsapp_number || data.whatsapp || '';
      const emailVal = data.email || data.applicant_email || 'Not provided';
const countryVal = data.current_country || data.country_of_residence || 'Not specified';
      const visaTypeVal = data.visa_type || '30 Days – Single Entry';
      const travelDateVal = data.intended_travel_date || data.travel_date || 'Not specified';
      const purposeVal = data.purpose_of_visit || data.purpose || 'Tourism';
      const otherPurposeVal = data.other_purpose || (purposeVal === 'Other' ? '' : 'N/A');

      // Clean list of uploaded documents for summary (strictly no URLs)
      const uploadedDocListClean: string[] = [];
      if (passportBioVal === 'Uploaded') uploadedDocListClean.push('• Passport Bio Page');
      if (passportCoverVal === 'Uploaded') uploadedDocListClean.push('• Passport Cover');
      if (passportPhotoVal === 'Uploaded') uploadedDocListClean.push('• Passport Photo');
      if (nationalIdVal === 'Uploaded') uploadedDocListClean.push('• National ID');
      if (airTicketVal === 'Uploaded') uploadedDocListClean.push('• Return / Onward Ticket');
      if (checkUploaded(null, data.previous_uae_visa) === 'Uploaded') uploadedDocListClean.push('• Previous UAE Visa');
      if (checkUploaded(null, data.entry_exit_record) === 'Uploaded') uploadedDocListClean.push('• Entry / Exit Record');
      if (checkUploaded(null, data.guarantor_docs) === 'Uploaded') uploadedDocListClean.push('• Guarantor / Sponsor Documents');
      if (checkUploaded(null, data.uae_residence_visa) === 'Uploaded') uploadedDocListClean.push('• Residence Visa');
      if (checkUploaded(null, data.emirates_id_relative) === 'Uploaded') uploadedDocListClean.push('• Emirates ID');
      if (checkUploaded(null, data.relationship_proof) === 'Uploaded') uploadedDocListClean.push('• Relationship Proof');
      if (checkUploaded(null, data.birth_certificate) === 'Uploaded') uploadedDocListClean.push('• Birth Certificate');
      if (checkUploaded(null, data.marriage_certificate) === 'Uploaded') uploadedDocListClean.push('• Marriage Certificate');
      if (checkUploaded(null, data.hotel_booking) === 'Uploaded') uploadedDocListClean.push('• Hotel / Accommodation');
      if (checkUploaded(null, data.bank_statement) === 'Uploaded') uploadedDocListClean.push('• Bank Statement');
      if (checkUploaded(null, data.travel_history) === 'Uploaded') uploadedDocListClean.push('• Travel History');

      const docsSummaryFormatted = uploadedDocListClean.length > 0 ? uploadedDocListClean.join('\n') : 'None attached';

      const templateParams: Record<string, any> = {
        reference_id: cleanRefId,
        submitted_at: submittedAt,
        submission_date: submittedAt,
        full_name: applicantName,
        name: applicantName,
        applicant_name: applicantName,
        nationality: nationalityVal,
        applicant_nationality: nationalityVal,
        date_of_birth: dobVal,
        dob: dobVal,
        gender: genderVal,
        applicant_gender: genderVal,
        occupation: occupationVal,
        designation: occupationVal,
        whatsapp_number: whatsappVal,
        whatsapp: whatsappVal,
        phone_number: whatsappVal,
        email: emailVal,
        applicant_email: emailVal,
        current_country: countryVal,
        country_of_residence: countryVal,
destination: data.destination || 'United Arab Emirates (Dubai)',
        visa_type: visaTypeVal,
        intended_travel_date: travelDateVal,
        travel_date: travelDateVal,
        purpose: purposeVal,
        purpose_of_visit: purposeVal,
        other_purpose: otherPurposeVal,

        // Core Document values include secure applicant links when available
        passport_bio_page: data.passport_bio_page || passportBioVal,
        passport_copy: data.passport_copy || passportBioVal,
        passport_cover: data.passport_cover || passportCoverVal,
        passport_photo: data.passport_photo || passportPhotoVal,
        national_id: data.national_id || nationalIdVal,
        return_onward_ticket: data.return_onward_ticket || airTicketVal,
        air_ticket: data.air_ticket || airTicketVal,
        return_ticket: data.return_ticket || airTicketVal,

        // Optional document values include secure links when available
        previous_uae_visa: data.previous_uae_visa || checkUploaded(null, data.previous_uae_visa),
        previous_visa: checkUploaded(null, data.previous_uae_visa),
        entry_exit_record: data.entry_exit_record || checkUploaded(null, data.entry_exit_record),
        guarantor_docs: data.guarantor_docs || checkUploaded(null, data.guarantor_docs),
        guarantor_documents: checkUploaded(null, data.guarantor_docs),
        uae_residence_visa: data.uae_residence_visa || checkUploaded(null, data.uae_residence_visa),
        emirates_id_relative: data.emirates_id_relative || checkUploaded(null, data.emirates_id_relative),
        relationship_proof: data.relationship_proof || checkUploaded(null, data.relationship_proof),
        birth_certificate: data.birth_certificate || checkUploaded(null, data.birth_certificate),
        marriage_certificate: data.marriage_certificate || checkUploaded(null, data.marriage_certificate),
        hotel_booking: data.hotel_booking || checkUploaded(null, data.hotel_booking),
        bank_statement: data.bank_statement || checkUploaded(null, data.bank_statement),
        travel_history: data.travel_history || checkUploaded(null, data.travel_history),

        uploaded_documents: docsSummaryFormatted,
        uploaded_documents_list: uploadedDocListClean.map(s => s.replace('• ', '')).join(', ') || 'None',
        additional_notes: data.additional_notes || 'None provided',

        // Secure document links supplied by the applicant's 7-day access token.
        pdf_download_url: data.pdf_url ? `${data.pdf_url}${data.pdf_url.includes('?') ? '&' : '?'}download=true` : '',
        secure_pdf_url: data.pdf_url || '',
        pdf_url: data.pdf_url || '',
        pdf_link: data.pdf_url || '',
        pdf: data.pdf_url || '',
        application_pdf: data.pdf_url || '',
        document_url: '',
        download_pdf_url: data.pdf_url ? `${data.pdf_url}${data.pdf_url.includes('?') ? '&' : '?'}download=true` : ''

      };

      console.group('📧 [SERVER EMAILJS DISPATCH: VISA APPLICATION]');
      console.log('service ID: service_l6g6aq9');
      console.log('template ID: template_mu6mwue');
      console.log('referenceId:', cleanRefId);
      console.groupEnd();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      let emailResponse: Response | null = null;
      let responseText = '';
      try {
        emailResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': publicOrigin || 'https://zonetourism.ae',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
          },
          body: JSON.stringify({
            lib_version: '4.4.1',
            service_id: 'service_l6g6aq9',
            template_id: 'template_mu6mwue',
            user_id: 'OlsbUfqZLPei_nsVk',
            template_params: templateParams
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        responseText = await emailResponse.text();
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        console.warn('[Server EmailJS Fetch Notice]:', fetchErr?.message || fetchErr);
        return res.json({
          success: false,
          error: fetchErr?.message || 'Email dispatch timeout',
          referenceId: cleanRefId
        });
      }

      if (!emailResponse || !emailResponse.ok) {
        console.warn('[Server EmailJS Warning]:', responseText);
      } else {
        console.log('✅ [SERVER EMAILJS SUCCESS: VISA APPLICATION]:', responseText);
      }

      return res.json({
        success: Boolean(emailResponse?.ok),
        status: emailResponse?.status || 500,
        text: responseText,
        referenceId: cleanRefId
      });
    } catch (err: any) {
      console.error("Error in server email dispatch:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get("/api/visa-applications/:refId/pdf", requireDocumentAccessAuth, async (req, res) => {
    try {
      const { refId } = req.params;
      const cleanRefId = refId.replace(/[^a-zA-Z0-9_-]/g, '');
      const diskPath = path.join(VISA_PDF_DIR, `${cleanRefId}.pdf`);
      const isDownload = req.query.download === '1' || req.query.download === 'true';

      let pdfBuffer: Buffer | null = null;
      let filename = `UAE_Visa_Application_${cleanRefId}.pdf`;

      // 1. Primary: Download from private Supabase Storage 'website-files' when configured
      if (isSupabaseConfigured()) {
        try {
          pdfBuffer = await downloadVisaPdfFromSupabase(cleanRefId);
          if (pdfBuffer) {
            console.log(`[Supabase Storage] Streamed Visa Application PDF from private bucket for Ref: ${cleanRefId}`);
          }
        } catch (supabaseDownloadErr) {
          console.warn("[Supabase Storage Download Notice]:", supabaseDownloadErr);
        }
      }

      // 2. Secondary / Local Disk fallback if not retrieved from Supabase
      if (!pdfBuffer && fs.existsSync(diskPath)) {
        try {
          pdfBuffer = fs.readFileSync(diskPath);
        } catch (readErr) {
          console.warn("Could not read PDF from disk:", readErr);
        }
      }

      // 3. In-memory buffer fallback
      if (!pdfBuffer) {
        const stored = visaApplicationsPdfStore.get(cleanRefId) || visaApplicationsPdfStore.get(refId);
        if (stored) {
          const commaIdx = stored.base64Data.indexOf(',');
          const base64Clean = commaIdx !== -1 ? stored.base64Data.substring(commaIdx + 1) : stored.base64Data;
          pdfBuffer = Buffer.from(base64Clean, 'base64');
          filename = stored.filename || filename;
        }
      }

      if (!pdfBuffer) {
        return res.status(404).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8" />
              <title>Visa Application Document</title>
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0A2540; color: #fff; padding: 1rem; }
                .card { background: white; padding: 2.5rem; border-radius: 1.25rem; text-align: center; max-width: 480px; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.3); color: #1e293b; }
                h2 { color: #0b4da2; margin-top: 0; font-size: 1.4rem; }
                p { color: #64748b; font-size: 0.95rem; line-height: 1.5; }
                .btn { display: inline-block; margin-top: 1.25rem; padding: 0.75rem 1.75rem; background: #0b4da2; color: white; border-radius: 0.75rem; text-decoration: none; font-weight: bold; font-size: 0.9rem; }
              </style>
            </head>
            <body>
              <div class="card">
                <h2>Application Document Notice</h2>
                <p>Application document (Ref: <strong>${encodeURIComponent(cleanRefId || refId)}</strong>) is processing or has not yet completed upload.</p>
                <p>Please contact Zone Tourism LLC directly on WhatsApp: <strong>+971 55 558 6359</strong>.</p>
                <a href="/" class="btn">Return to Website</a>
              </div>
            </body>
          </html>
        `);
      }

      const disposition = isDownload ? 'attachment' : 'inline';
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.setHeader('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      return res.send(pdfBuffer);
    } catch (err: any) {
      console.error("Error serving PDF:", err);
      return res.status(500).send("Error rendering PDF.");
    }
  });

  // 2. CAR RENTAL ENQUIRY - Persisted to PostgreSQL
  app.post("/api/enquiries/car-rental", async (req, res) => {
    try {
      const { pickupLocation, dropoffLocation, pickupDate, pickupTime, returnDate, returnTime, serviceType, vehicleType, whatsappNumber, name } = req.body;

      // Proper validation of all required fields
      if (!pickupLocation || typeof pickupLocation !== 'string' || pickupLocation.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Please specify a pickup location." });
      }
      if (!dropoffLocation || typeof dropoffLocation !== 'string' || dropoffLocation.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Please select a drop-off location." });
      }
      if (!pickupDate || typeof pickupDate !== 'string') {
        return res.status(400).json({ success: false, error: "Please select a pickup date." });
      }
      if (!pickupTime || typeof pickupTime !== 'string') {
        return res.status(400).json({ success: false, error: "Please select a pickup time." });
      }
      if (!returnDate || typeof returnDate !== 'string') {
        return res.status(400).json({ success: false, error: "Please select a return date." });
      }
      if (!returnTime || typeof returnTime !== 'string') {
        return res.status(400).json({ success: false, error: "Please select a return time." });
      }
      if (new Date(returnDate) < new Date(pickupDate)) {
        return res.status(400).json({ success: false, error: "Return date cannot be earlier than pickup date." });
      }
      if (!serviceType || (serviceType !== 'Self Drive' && serviceType !== 'Chauffeur' && serviceType !== 'Chauffeur Driven')) {
        return res.status(400).json({ success: false, error: "Please choose either Self Drive or Chauffeur." });
      }
      if (!vehicleType || typeof vehicleType !== 'string' || vehicleType.trim().length === 0) {
        return res.status(400).json({ success: false, error: "Please select or enter the preferred vehicle type." });
      }
      if (!whatsappNumber || typeof whatsappNumber !== 'string' || whatsappNumber.replace(/\D/g, '').length < 7) {
        return res.status(400).json({ success: false, error: "Please provide a valid WhatsApp number with country code." });
      }

      const referenceId = `HWZ-CRE-${Math.floor(10000 + Math.random() * 90000)}`;
      const timestamp = new Date().toISOString();

      // Persist to PostgreSQL database
      const savedEnquiry = await createEnquiryInDb({
        referenceId,
        enquiryType: 'car-rental',
        name: name ? name.trim() : 'Car Rental Client',
        pickupLocation: pickupLocation.trim(),
        pickupDate,
        returnDate,
        serviceType,
        vehicleType: vehicleType.trim(),
        whatsappNumber: whatsappNumber.trim(),
        status: 'New',
        notes: 'New car rental quote request received through quick form.'
      });

      // Log routing to company's fleet & chauffeur operations team
      console.log(`========================================`);
      console.log(`[PERSISTED TO POSTGRESQL & ROUTED - CAR RENTAL ENQUIRY]`);
      console.log(`Enquiry ID   : ${savedEnquiry.id}`);
      console.log(`Reference ID : ${referenceId}`);
      console.log(`Timestamp    : ${timestamp}`);
      console.log(`Pickup Place : ${pickupLocation.trim()}`);
      console.log(`Dates        : ${pickupDate} to ${returnDate}`);
      console.log(`Service      : ${serviceType}`);
      console.log(`Vehicle Type : ${vehicleType.trim()}`);
      console.log(`WhatsApp     : ${whatsappNumber.trim()}`);
      console.log(`Routed to    : HOTWHEELS CAR RENTAL LLC Dispatch Team (${COMPANY_EMAIL})`);
      console.log(`========================================`);

      return res.json({
        success: true,
        referenceId,
        id: savedEnquiry.id,
        message: "Your car rental quote request has been routed directly to the HOTWHEELS CAR RENTAL LLC dispatch team.",
        timestamp,
        routedTo: {
          team: "HOTWHEELS CAR RENTAL LLC Dispatch & Chauffeur Team",
          email: COMPANY_EMAIL,
          whatsappNumber: companyInfoState.whatsappNumbers[0] || ""
        }
      });
    } catch (err: any) {
      console.error("Error processing car rental enquiry:", err);
      return res.status(500).json({ success: false, error: "Internal server error while routing car rental quote." });
    }
  });

  // Contact form submission endpoint - Persisted to PostgreSQL
  app.post("/api/submit-contact", async (req, res) => {
    try {
      const { name, email, phone, subject, message } = req.body;
      if (!name || !email || !message) {
        return res.status(400).json({ success: false, error: "Name, email and message are required." });
      }

      const referenceId = `HWZ-MSG-${Math.floor(100000 + Math.random() * 900000)}`;

      const savedEnquiry = await createEnquiryInDb({
        referenceId,
        enquiryType: 'contact',
        name: name.trim(),
        whatsappNumber: phone ? phone.trim() : (email || ''),
        status: 'New',
        notes: `Contact message: ${subject || 'General inquiry'}. Email: ${email}, Phone: ${phone || 'N/A'}. Message: ${message}`
      });

      console.log(`[GENERAL CONTACT ENQUIRY PERSISTED] Ref: ${referenceId} from ${name} (${email}) ID: ${savedEnquiry.id}`);

      return res.json({
        success: true,
        referenceId,
        id: savedEnquiry.id,
        message: "Your message has been sent successfully. We will respond within a few hours."
      });
    } catch (err: any) {
      console.error("Error submitting contact form:", err);
      return res.status(500).json({ success: false, error: "Internal server error." });
    }
  });

  // =========================================================================
  // CAR MEDIA STORAGE / STREAMING
  // =========================================================================
  app.post("/api/admin/cars/upload-media", requireAdminAuth, async (req, res) => {
    try {
      const { carId, fileBase64, filename, mediaType } = req.body;
      if (!carId || !fileBase64 || !filename) {
        return res.status(400).json({ success: false, error: "carId, fileBase64 and filename are required." });
      }
      if (mediaType !== 'images' && mediaType !== 'video') {
        return res.status(400).json({ success: false, error: "Invalid media type." });
      }

      const commaIdx = String(fileBase64).indexOf(',');
      const cleanBase64 = commaIdx >= 0 ? String(fileBase64).slice(commaIdx + 1) : String(fileBase64);
      const fileBuffer = Buffer.from(cleanBase64, 'base64');

      const maxBytes = mediaType === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (fileBuffer.length > maxBytes) {
        return res.status(413).json({
          success: false,
          error: `${mediaType === 'video' ? 'Video' : 'Image'} exceeds the maximum allowed size.`
        });
      }

      const ext = path.extname(String(filename)).toLowerCase();
      const allowedImageExts = new Set(['.jpg', '.jpeg', '.png', '.webp']);
      const allowedVideoExts = new Set(['.mp4', '.webm', '.mov', '.m4v']);
      if (mediaType === 'images' && !allowedImageExts.has(ext)) {
        return res.status(400).json({ success: false, error: "Only JPG, PNG and WEBP images are allowed." });
      }
      if (mediaType === 'video' && !allowedVideoExts.has(ext)) {
        return res.status(400).json({ success: false, error: "Only MP4, WEBM, MOV and M4V videos are allowed." });
      }

      const mimeType =
        mediaType === 'video'
          ? (String(req.body.mimeType || 'video/mp4'))
          : (String(req.body.mimeType || 'image/jpeg'));

      if (!isSupabaseConfigured()) {
        return res.status(503).json({
          success: false,
          error: "Supabase Storage is not configured on this backend."
        });
      }

      const result = await uploadCarMediaToSupabase(
        String(carId),
        fileBuffer,
        String(filename),
        mediaType,
        mimeType
      );

      if (!result.success) {
        return res.status(500).json({ success: false, error: result.error || "Failed to upload car media." });
      }

      return res.json({
        success: true,
        mediaUrl: result.mediaUrl,
        storagePath: result.storagePath
      });
    } catch (err: any) {
      console.error("Error uploading car media:", err);
      return res.status(500).json({ success: false, error: "Failed to upload car media." });
    }
  });

  app.get("/api/cars/media/:carId/:mediaType/:filename", async (req, res) => {
    try {
      const { carId, mediaType, filename } = req.params;
      if (mediaType !== 'images' && mediaType !== 'video') {
        return res.status(400).send("Invalid media type.");
      }

      const cleanCarId = String(carId).replace(/[^a-zA-Z0-9_-]/g, '');
      const cleanFilename = path.basename(String(filename)).replace(/[^a-zA-Z0-9_.-]/g, '_');

      if (!cleanCarId || !cleanFilename || !isSupabaseConfigured()) {
        return res.status(404).send("Car media not available.");
      }

      const result = await downloadCarMediaFromSupabase(
        cleanCarId,
        mediaType as 'images' | 'video',
        cleanFilename
      );

      if (!result) {
        return res.status(404).send("Car media not found.");
      }

      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Length', result.buffer.length);
      res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
      return res.send(result.buffer);
    } catch (err: any) {
      console.error("Error streaming car media:", err);
      return res.status(500).send("Error reading car media.");
    }
  });

  // ==========================================
  // AUTHENTICATION & ADMIN ACCESS CONTROL
  // Protected Admin API Routes with role & token validation
  // ==========================================

  // In-memory rate limiter for Admin authentication (Max 5 attempts per 15 minutes)
  const adminLoginAttempts = new Map<string, { count: number; firstAttempt: number }>();
  const checkAdminLoginRateLimit = (ip: string): { allowed: boolean; waitMinutes?: number } => {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 5;
    const record = adminLoginAttempts.get(ip);
    if (!record || now - record.firstAttempt > windowMs) {
      adminLoginAttempts.set(ip, { count: 1, firstAttempt: now });
      return { allowed: true };
    }
    if (record.count >= maxAttempts) {
      const remainingMs = windowMs - (now - record.firstAttempt);
      return { allowed: false, waitMinutes: Math.ceil(remainingMs / 60000) };
    }
    record.count += 1;
    return { allowed: true };
  };
  const resetAdminLoginRateLimit = (ip: string) => {
    adminLoginAttempts.delete(ip);
  };

  // 1. Admin Login Endpoint (Timing-safe secret verification with Brute Force Protection)
  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ success: false, error: "Admin password is required." });
    }

    const clientIp = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown');
    const rateLimit = checkAdminLoginRateLimit(clientIp);
    if (!rateLimit.allowed) {
      return res.status(429).json({ 
        success: false, 
        error: `Too many failed login attempts from this network. Please wait ${rateLimit.waitMinutes} minute(s) before trying again.` 
      });
    }

    const configuredSecret = process.env.ADMIN_KEY || 
                             process.env.ADMIN_PASSWORD || 
                             process.env.ADMIN_SECRET;

    if (!configuredSecret || configuredSecret.trim().length === 0) {
      console.error("[AUTH] ADMIN_KEY environment variable is not configured on the server.");
      return res.status(401).json({ 
        success: false, 
        error: "Admin access key is not configured in server environment. Please set ADMIN_KEY in your environment variables." 
      });
    }

    if (!verifyAdminSecret(password)) {
      return res.status(401).json({ success: false, error: "Invalid admin key. Access denied." });
    }

    // Reset rate limiter on successful authentication
    resetAdminLoginRateLimit(clientIp);

    // Issue cryptographically signed admin session token
    const sessionToken = createAdminSession();
    return res.json({
      success: true,
      token: sessionToken,
      message: "Admin authentication successful."
    });
  });

  // Admin Logout Endpoint
  app.post("/api/admin/logout", (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1].trim();
      invalidateAdminSession(token);
    }
    return res.json({ success: true, message: "Admin session closed." });
  });

  // Admin Auth Verification Check
  app.get("/api/admin/verify", requireAdminAuth, (req: AuthRequest, res) => {
    return res.json({ success: true, authenticated: true, user: req.user });
  });

  // ==========================================
  // CAR MANAGEMENT API ROUTES (Cloud SQL PostgreSQL + Drizzle)
  // Protected: Only accessible to authenticated admins
  // Strict constraints enforced:
  // - NO car registration number
  // - NO car number
  // - NO no-deposit option
  // - NO automatic booking/availability system
  // ==========================================
  app.get("/api/admin/cars", requireAdminAuth, async (req, res) => {
    try {
      const allCars = await getAllCarsAdmin();
      const formattedCars = allCars.map(c => ({
        ...c,
        dailyPrice: c.dailyPriceAED,
        weeklyPrice: c.weeklyPriceAED,
        monthlyPrice: c.monthlyPriceAED,
        yearlyPrice: (c as any).yearlyPriceAED || (c.monthlyPriceAED ? c.monthlyPriceAED * 10 : 0),
        yearlyPriceAED: (c as any).yearlyPriceAED || (c.monthlyPriceAED ? c.monthlyPriceAED * 10 : 0),
        yearlyPriceUSD: (c as any).yearlyPriceUSD || (c.monthlyPriceUSD ? c.monthlyPriceUSD * 10 : 0),
        rentalType: c.serviceType,
        isAvailable: c.isActive,
      }));
      return res.json({ success: true, data: formattedCars });
    } catch (error: any) {
      console.error("Error fetching admin cars:", error);
      return res.status(500).json({ success: false, error: "Failed to fetch cars from database." });
    }
  });

  app.post("/api/admin/cars", requireAdminAuth, async (req, res) => {
    try {
      const {
        make, model, category, serviceType, seats, luggage,
        dailyPriceAED, dailyPriceUSD, weeklyPriceAED, weeklyPriceUSD, monthlyPriceAED, monthlyPriceUSD,
        image, description, getQuoteOption, isMercedesChauffeur, isActive
      } = req.body;

      if (!make || !model || !category || !image) {
        return res.status(400).json({ 
          success: false, 
          error: "Make, model, category, and image URL are required fields." 
        });
      }

      const dPriceAED = Number(dailyPriceAED) || 0;
      const dPriceUSD = Number(dailyPriceUSD) || (dPriceAED ? Math.round(dPriceAED / 3.67) : 0);
      const wPriceAED = Number(weeklyPriceAED) || (dPriceAED * 6);
      const wPriceUSD = Number(weeklyPriceUSD) || (wPriceAED ? Math.round(wPriceAED / 3.67) : 0);
      const mPriceAED = Number(monthlyPriceAED) || (dPriceAED * 20);
      const mPriceUSD = Number(monthlyPriceUSD) || (mPriceAED ? Math.round(mPriceAED / 3.67) : 0);
      const yPriceAED = req.body.yearlyPriceAED ? Number(req.body.yearlyPriceAED) : 0;
      const yPriceUSD = req.body.yearlyPriceUSD ? Number(req.body.yearlyPriceUSD) : 0;

      const created = await createCar({
        make: String(make).trim(),
        model: String(model).trim(),
        category: String(category).trim(),
        serviceType: serviceType || 'Both',
        seats: Number(seats) || 5,
        luggage: String(luggage || '2 Bags').trim(),
        dailyPriceAED: dPriceAED,
        dailyPriceUSD: dPriceUSD,
        weeklyPriceAED: wPriceAED,
        weeklyPriceUSD: wPriceUSD,
        monthlyPriceAED: mPriceAED,
        monthlyPriceUSD: mPriceUSD,
        yearlyPriceAED: yPriceAED,
        yearlyPriceUSD: yPriceUSD,
        image: String(image).trim(),
        gallery: Array.isArray(req.body.gallery) ? req.body.gallery : (Array.isArray(req.body.images) ? req.body.images : []),
        videoUrl: String(req.body.videoUrl || req.body.video || '').trim(),
        description: String(description || '').trim(),
        getQuoteOption: Boolean(getQuoteOption),
        isMercedesChauffeur: Boolean(isMercedesChauffeur || String(make).toLowerCase().includes('mercedes')),
        isActive: isActive !== undefined ? Boolean(isActive) : true
      });

      return res.json({ 
        success: true, 
        data: created, 
        message: "Vehicle added successfully to the database fleet." 
      });
    } catch (error: any) {
      console.error("Error creating vehicle:", error);
      return res.status(500).json({ success: false, error: "Failed to create vehicle record in database." });
    }
  });

  app.put("/api/admin/cars/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await updateCar(id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, error: "Vehicle not found." });
      }
      return res.json({ 
        success: true, 
        data: updated, 
        message: "Vehicle details updated successfully." 
      });
    } catch (error: any) {
      console.error("Error updating vehicle:", error);
      return res.status(500).json({ success: false, error: "Failed to update vehicle record." });
    }
  });

  app.delete("/api/admin/cars/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await deleteCar(id);
      if (!deleted) {
        return res.status(404).json({ success: false, error: "Vehicle not found." });
      }
      return res.json({ success: true, message: "Vehicle deleted from fleet successfully." });
    } catch (error: any) {
      console.error("Error deleting vehicle:", error);
      return res.status(500).json({ success: false, error: "Failed to delete vehicle record." });
    }
  });

  app.patch("/api/admin/cars/:id/status", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const updated = await toggleCarStatus(id, isActive);
      if (!updated) {
        return res.status(404).json({ success: false, error: "Vehicle not found." });
      }
      return res.json({ 
        success: true, 
        data: updated, 
        message: `Vehicle has been ${updated.isActive ? 'activated' : 'deactivated'}.` 
      });
    } catch (error: any) {
      console.error("Error updating car status:", error);
      return res.status(500).json({ success: false, error: "Failed to update vehicle status." });
    }
  });

  // Dedicated Quick Pricing Update Endpoint (Daily, Weekly, Monthly)
  app.patch("/api/admin/cars/:id/pricing", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const {
        dailyPriceAED,
        dailyPriceUSD,
        weeklyPriceAED,
        weeklyPriceUSD,
        monthlyPriceAED,
        monthlyPriceUSD,
        yearlyPriceAED,
        yearlyPriceUSD
      } = req.body;

      const updated = await updateCar(id, {
        dailyPriceAED,
        dailyPriceUSD,
        weeklyPriceAED,
        weeklyPriceUSD,
        monthlyPriceAED,
        monthlyPriceUSD,
        yearlyPriceAED,
        yearlyPriceUSD
      });

      if (!updated) {
        return res.status(404).json({ success: false, error: "Vehicle not found." });
      }

      return res.json({
        success: true,
        data: updated,
        message: `Pricing rates updated successfully for ${updated.make} ${updated.model}.`
      });
    } catch (error: any) {
      console.error("Error updating car pricing:", error);
      return res.status(500).json({ success: false, error: "Failed to update vehicle rates in database." });
    }
  });

  // ==========================================
  // OFFICIAL BANK DETAILS MANAGEMENT (PHASE 1 CORE REQUIREMENT)
  // Secure: Only accessible to authenticated admins
  // ==========================================
  app.get("/api/admin/bank-details", requireAdminAuth, async (req, res) => {
    try {
      const bankDetails = await getBankDetailsFromDb();
      res.json({ 
        success: true, 
        data: bankDetails 
      });
    } catch (err: any) {
      console.error("Error fetching bank details:", err);
      res.status(500).json({ success: false, error: "Failed to fetch bank details." });
    }
  });

  app.put("/api/admin/bank-details", requireAdminAuth, async (req, res) => {
    try {
      const { primaryAccount, secondaryAccount } = req.body;
      
      if (!primaryAccount) {
        return res.status(400).json({ success: false, error: "Primary bank account information is required." });
      }

      const updatedBankDetails = await updateBankDetailsInDb(primaryAccount, secondaryAccount);

      console.log(`[BANK DETAILS PERSISTED TO POSTGRESQL BY ADMIN]`);
      console.log(`Primary Account: ${updatedBankDetails.primaryAccount.companyAccountName} | Bank: ${updatedBankDetails.primaryAccount.bankName}`);

      return res.json({ 
        success: true, 
        data: updatedBankDetails, 
        message: "Official bank details updated and persisted in PostgreSQL database successfully." 
      });
    } catch (err: any) {
      console.error("Error updating bank details in PostgreSQL:", err);
      return res.status(500).json({ success: false, error: "Failed to persist bank details to database." });
    }
  });

  // ==========================================
  // ENQUIRIES MANAGEMENT (POSTGRESQL PERSISTENCE & CRUD)
  // Secure: Only accessible to authenticated admins
  // ==========================================
  app.get("/api/admin/enquiries", requireAdminAuth, async (req, res) => {
    try {
      const enquiriesList = await getAllEnquiriesFromDb();
      return res.json({ 
        success: true, 
        data: enquiriesList 
      });
    } catch (err: any) {
      console.error("Error fetching enquiries from PostgreSQL:", err);
      return res.status(500).json({ success: false, error: "Failed to fetch enquiries from database." });
    }
  });

  app.get("/api/admin/enquiries/:id", requireAdminAuth, async (req, res) => {
    try {
      const enquiry = await getEnquiryByIdFromDb(req.params.id);
      if (!enquiry) {
        return res.status(404).json({ success: false, error: "Enquiry not found." });
      }
      return res.json({ success: true, data: enquiry });
    } catch (err: any) {
      console.error(`Error fetching enquiry ${req.params.id}:`, err);
      return res.status(500).json({ success: false, error: "Failed to fetch enquiry." });
    }
  });

  app.patch("/api/admin/enquiries/:id", requireAdminAuth, async (req, res) => {
    try {
      const { status, notes } = req.body;
      const updated = await updateEnquiryInDb(req.params.id, { status, notes });
      return res.json({ 
        success: true, 
        data: updated, 
        message: "Enquiry updated successfully." 
      });
    } catch (err: any) {
      console.error(`Error updating enquiry ${req.params.id}:`, err);
      return res.status(500).json({ success: false, error: "Failed to update enquiry in database." });
    }
  });

  app.put("/api/admin/enquiries/:id", requireAdminAuth, async (req, res) => {
    try {
      const { status, notes } = req.body;
      const updated = await updateEnquiryInDb(req.params.id, { status, notes });
      return res.json({ 
        success: true, 
        data: updated, 
        message: "Enquiry updated successfully." 
      });
    } catch (err: any) {
      console.error(`Error updating enquiry ${req.params.id}:`, err);
      return res.status(500).json({ success: false, error: "Failed to update enquiry in database." });
    }
  });

  app.delete("/api/admin/enquiries/:id", requireAdminAuth, async (req, res) => {
    try {
      const deleted = await deleteEnquiryFromDb(req.params.id);
      return res.json({ 
        success: true, 
        data: deleted, 
        message: "Enquiry deleted successfully from database." 
      });
    } catch (err: any) {
      console.error(`Error deleting enquiry ${req.params.id}:`, err);
      return res.status(500).json({ success: false, error: "Failed to delete enquiry from database." });
    }
  });


  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ZONE TOURISM LLC & HOTWHEELS CAR RENTAL LLC server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
