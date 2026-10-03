import React, { useState } from 'react';
import { PageRoute } from './types';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { EnquiryModal } from './components/SimpleEnquiryForms';
import { WhatsAppFloat } from './components/WhatsAppFloat';

import { Home } from './pages/Home';
import { VisaPage } from './pages/VisaPage';
import { CarRentalPage } from './pages/CarRentalPage';
import { MercedesChauffeurPage } from './pages/MercedesChauffeurPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { MakePaymentPage } from './pages/MakePaymentPage';
import { AdminPage } from './pages/AdminPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';

function getRouteFromPath(): PageRoute {
  if (typeof window === 'undefined') return 'home';
  const clean = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (clean === 'admin') return 'admin';
  if (clean === 'make-payment' || clean === 'payment') return 'make-payment';
  if (clean === 'uae-visit-visa' || clean === 'visa') return 'uae-visit-visa';
  if (clean === 'car-rental' || clean === 'cars') return 'car-rental';
  if (clean === 'chauffeur') return 'chauffeur';
  if (clean === 'mercedes-chauffeur') return 'mercedes-chauffeur';
  if (clean === 'about') return 'about';
  if (clean === 'contact') return 'contact';
  if (clean === 'terms') return 'terms';
  if (clean === 'privacy') return 'privacy';
  return 'home';
}

export default function App() {
  const [route, setRouteState] = useState<PageRoute>(() => getRouteFromPath());

  const setRoute = (newRoute: PageRoute) => {
    setRouteState(newRoute);
    if (typeof window !== 'undefined') {
      const targetPath = newRoute === 'home' ? '/' : `/${newRoute}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, '', targetPath);
      }
    }
  };

  React.useEffect(() => {
    const handlePopState = () => {
      setRouteState(getRouteFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Dynamic SEO Page Titles, Canonical URLs, and Meta Descriptions
  React.useEffect(() => {
    const seoMap: Record<PageRoute, { title: string; description: string; canonical: string; noindex?: boolean }> = {
      'home': {
        title: 'Zone Tourism LLC & Hotwheels Car Rental | Visa & Car Rental Dubai',
        description: 'UAE visa services, international visa assistance, self-drive car rental and chauffeur-driven Mercedes vehicles in Dubai.',
        canonical: 'https://zonetourism.ae/'
      },
      'uae-visit-visa': {
        title: 'UAE Visit Visa Services Dubai (30 & 60 Days) | Zone Tourism LLC',
        description: 'Apply for 30-day and 60-day UAE tourist and visit visas with direct Dubai immigration processing and transparent pricing.',
        canonical: 'https://zonetourism.ae/uae-visit-visa'
      },
      'car-rental': {
        title: 'Self-Drive Car Rental Dubai & Sharjah | Hotwheels Car Rental LLC',
        description: 'Rent economy, SUV, and luxury 7-seater vehicles in Dubai. Daily, weekly and monthly corporate rates with full insurance.',
        canonical: 'https://zonetourism.ae/car-rental'
      },
      'chauffeur': {
        title: 'VIP Chauffeur Services Dubai | Hotwheels Car Rental LLC',
        description: 'Executive chauffeur-driven Mercedes-Benz fleet for airport transfers, city tours, and corporate events across the UAE.',
        canonical: 'https://zonetourism.ae/mercedes-chauffeur'
      },
      'mercedes-chauffeur': {
        title: 'Mercedes Chauffeur Service Dubai | Hotwheels Car Rental LLC',
        description: 'VIP Mercedes V-Class, Vito, S-Class, and E-Class chauffeur-driven luxury vehicle rentals in Dubai with professional drivers.',
        canonical: 'https://zonetourism.ae/mercedes-chauffeur'
      },
      'about': {
        title: 'About Us | Zone Tourism LLC & Hotwheels Car Rental Dubai',
        description: 'Learn about Zone Tourism LLC and Hotwheels Car Rental LLC, licensed Dubai travel and car rental operators since 2018.',
        canonical: 'https://zonetourism.ae/about'
      },
      'contact': {
        title: 'Contact Us | Zone Tourism LLC & Hotwheels Car Rental Dubai',
        description: 'Get in touch with Zone Tourism & Hotwheels Car Rental in Dubai. Call +971 4 222 6182 or WhatsApp +971 55 558 6359.',
        canonical: 'https://zonetourism.ae/contact'
      },
      'make-payment': {
        title: 'Official Payment Details & Bank Transfer | Zone Tourism LLC',
        description: 'Official settlement accounts and authorized payment instructions for Zone Tourism LLC and Hotwheels Car Rental LLC.',
        canonical: 'https://zonetourism.ae/make-payment',
        noindex: true
      },
      'terms': {
        title: 'Terms & Conditions | Zone Tourism LLC & Hotwheels Car Rental',
        description: 'Official terms of service, visa processing conditions, and car rental policies for Zone Tourism LLC and Hotwheels Car Rental LLC.',
        canonical: 'https://zonetourism.ae/terms'
      },
      'privacy': {
        title: 'Privacy Policy | Zone Tourism LLC & Hotwheels Car Rental',
        description: 'Privacy policy and data protection commitments of Zone Tourism LLC and Hotwheels Car Rental LLC.',
        canonical: 'https://zonetourism.ae/privacy'
      },
      'admin': {
        title: 'Admin Portal | Zone Tourism LLC & Hotwheels Car Rental LLC',
        description: 'Internal operations management system for fleet, enquiries, and banking details.',
        canonical: 'https://zonetourism.ae/admin',
        noindex: true
      }
    };

    const currentSeo = seoMap[route] || seoMap.home;
    document.title = currentSeo.title;

    // Update canonical link
    let canonicalTag = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.setAttribute('href', currentSeo.canonical);

    // Update description meta tag
    let descTag = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!descTag) {
      descTag = document.createElement('meta');
      descTag.setAttribute('name', 'description');
      document.head.appendChild(descTag);
    }
    descTag.setAttribute('content', currentSeo.description);

    // Update robots meta tag
    let robotsTag = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (currentSeo.noindex) {
      if (!robotsTag) {
        robotsTag = document.createElement('meta');
        robotsTag.setAttribute('name', 'robots');
        document.head.appendChild(robotsTag);
      }
      robotsTag.setAttribute('content', 'noindex, nofollow');
    } else if (robotsTag) {
      robotsTag.setAttribute('content', 'index, follow');
    }
  }, [route]);

  // Car Rental Quick Enquiry Modal State
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
  const [enquiryVehicleType, setEnquiryVehicleType] = useState<string | undefined>(undefined);

  const handleOpenEnquiry = (type: 'visa' | 'car-rental' = 'car-rental', destinationOrVehicle?: string) => {
    if (type === 'visa') {
      handleOpenVisaApp();
      return;
    }
    setEnquiryVehicleType(destinationOrVehicle);
    setIsEnquiryModalOpen(true);
  };

  const handleOpenVisaApp = (visaTypeId?: string) => {
    setRoute('uae-visit-visa');
    setTimeout(() => {
      const el = document.getElementById('visa-online-application-portal');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const renderPage = () => {
    switch (route) {
      case 'home':
        return (
          <Home 
            setRoute={setRoute} 
            onOpenVisaApp={handleOpenVisaApp} 
            onOpenEnquiry={handleOpenEnquiry}
          />
        );
      case 'uae-visit-visa':
        return (
          <VisaPage 
            currentRoute={route} 
            setRoute={setRoute} 
            onOpenVisaApp={handleOpenVisaApp}
            onOpenEnquiry={handleOpenEnquiry}
          />
        );
      case 'car-rental':
      case 'chauffeur':
        return <CarRentalPage currentRoute={route} setRoute={setRoute} onOpenEnquiry={handleOpenEnquiry} />;
      case 'mercedes-chauffeur':
        return <MercedesChauffeurPage currentRoute={route} setRoute={setRoute} onOpenEnquiry={handleOpenEnquiry} />;
      case 'about':
        return <AboutPage currentRoute={route} setRoute={setRoute} onOpenVisaApp={() => handleOpenVisaApp()} />;
      case 'make-payment':
        return <MakePaymentPage currentRoute={route} setRoute={setRoute} onOpenEnquiry={handleOpenEnquiry} />;
      case 'admin':
        return <AdminPage currentRoute={route} setRoute={setRoute} />;
      case 'contact':
        return <ContactPage currentRoute={route} setRoute={setRoute} />;
      case 'terms':
        return <TermsPage currentRoute={route} setRoute={setRoute} />;
      case 'privacy':
        return <PrivacyPage currentRoute={route} setRoute={setRoute} />;
      default:
        return (
          <Home 
            setRoute={setRoute} 
            onOpenVisaApp={handleOpenVisaApp} 
            onOpenEnquiry={handleOpenEnquiry}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FA] text-[#0A2540] font-sans antialiased selection:bg-[#0B4DA2] selection:text-white overflow-x-hidden w-full max-w-full">
      {/* Header */}
      <Header 
        currentRoute={route} 
        setRoute={setRoute} 
        onOpenVisaApp={handleOpenVisaApp}
        onOpenEnquiry={handleOpenEnquiry}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        {renderPage()}
      </main>

      {/* Footer */}
      <Footer 
        setRoute={setRoute} 
        onOpenVisaApp={() => handleOpenVisaApp()} 
        onOpenEnquiry={handleOpenEnquiry}
      />

      {/* Quick Car Rental Enquiry Modal */}
      <EnquiryModal
        isOpen={isEnquiryModalOpen}
        onClose={() => setIsEnquiryModalOpen(false)}
        initialVehicleType={enquiryVehicleType}
      />

      {/* Visible Floating WhatsApp and Mobile Call Actions */}
      <WhatsAppFloat />
    </div>
  );
}
