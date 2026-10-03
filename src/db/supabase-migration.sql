-- ==============================================================================
-- ZONE TOURISM LLC & HOTWHEELS CAR RENTAL LLC
-- SUPABASE POSTGRESQL INITIAL SCHEMA & SEED SCRIPT
-- ==============================================================================

-- 1. Bank Accounts Table (Payment details for Zone Tourism & Hotwheels)
CREATE TABLE IF NOT EXISTS "bank_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"company_account_name" text DEFAULT '' NOT NULL,
	"bank_name" text DEFAULT '' NOT NULL,
	"account_number" text DEFAULT '' NOT NULL,
	"iban" text DEFAULT '' NOT NULL,
	"swift_code" text DEFAULT '' NOT NULL,
	"currency" text DEFAULT 'AED' NOT NULL,
	"branch_name" text DEFAULT '' NOT NULL,
	"country" text DEFAULT 'United Arab Emirates' NOT NULL,
	"instructions" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now()
);

-- 2. Fleet & Rental Cars Table
CREATE TABLE IF NOT EXISTS "cars" (
	"id" text PRIMARY KEY NOT NULL,
	"make" text NOT NULL,
	"model" text NOT NULL,
	"category" text NOT NULL,
	"service_type" text DEFAULT 'Both' NOT NULL,
	"seats" integer DEFAULT 5 NOT NULL,
	"luggage" text DEFAULT '2 Bags' NOT NULL,
	"daily_price_aed" integer DEFAULT 0 NOT NULL,
	"daily_price_usd" integer DEFAULT 0 NOT NULL,
	"weekly_price_aed" integer DEFAULT 0 NOT NULL,
	"weekly_price_usd" integer DEFAULT 0 NOT NULL,
	"monthly_price_aed" integer DEFAULT 0 NOT NULL,
	"monthly_price_usd" integer DEFAULT 0 NOT NULL,
	"yearly_price_aed" integer DEFAULT 0 NOT NULL,
	"yearly_price_usd" integer DEFAULT 0 NOT NULL,
	"image" text NOT NULL,
	"gallery" text DEFAULT '[]' NOT NULL,
	"video_url" text DEFAULT '',
	"description" text DEFAULT '' NOT NULL,
	"get_quote_option" boolean DEFAULT false NOT NULL,
	"is_mercedes_chauffeur" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- 3. Unified Enquiries Table (Visa Applications & Car Rental Leads)
CREATE TABLE IF NOT EXISTS "enquiries" (
	"id" text PRIMARY KEY NOT NULL,
	"reference_id" text DEFAULT '',
	"enquiry_type" text NOT NULL, -- 'visa' | 'car-rental' | 'chauffeur' | 'contact'
	"name" text DEFAULT '' NOT NULL,
	"nationality" text DEFAULT '',
	"destination" text DEFAULT '',
	"travel_date" text DEFAULT '',
	"whatsapp_number" text DEFAULT '' NOT NULL,
	"pickup_location" text DEFAULT '',
	"dropoff_location" text DEFAULT '',
	"pickup_date" text DEFAULT '',
	"pickup_time" text DEFAULT '',
	"return_date" text DEFAULT '',
	"return_time" text DEFAULT '',
	"service_type" text DEFAULT '', -- 'Self Drive' | 'Chauffeur'
	"vehicle_type" text DEFAULT '',
	"status" text DEFAULT 'New' NOT NULL, -- 'New' | 'Contacted' | 'In Progress' | 'Completed' | 'Cancelled'
	"notes" text DEFAULT '',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- 4. Users Table
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL UNIQUE,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);

-- ==============================================================================
-- INITIAL PRODUCTION SEED DATA (Company Bank Accounts & Fleet Cars)
-- ==============================================================================

INSERT INTO "bank_accounts" ("id", "company_account_name", "bank_name", "account_number", "iban", "swift_code", "currency", "branch_name", "country", "instructions")
VALUES 
('primary', 'ZONE TOURISM LLC', 'Emirates NBD', '1014347702901', 'AE790260001014347702901', '', 'AED', 'Dubai Branch', 'United Arab Emirates', 'For UAE Visit Visa services and general tourism packages.'),
('secondary', 'HOTWHEELS CAR RENTALS', 'Habib Bank AG Zurich', '02-02-08-020311-105-0573857', 'AE030290890210500573857', 'HBZUAEADXXX', 'AED', 'Sharjah Branch', 'United Arab Emirates', 'For Car Rental, VIP Chauffeur services, and corporate fleet bookings.')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "cars" ("id", "make", "model", "category", "service_type", "seats", "luggage", "daily_price_aed", "daily_price_usd", "weekly_price_aed", "weekly_price_usd", "monthly_price_aed", "monthly_price_usd", "yearly_price_aed", "yearly_price_usd", "image", "description", "get_quote_option", "is_mercedes_chauffeur", "is_active")
VALUES
('car-1', 'Mercedes-Benz', 'V-Class VIP Extra Long', 'Luxury', 'Both', 7, '6 Bags', 1200, 327, 7500, 2043, 24000, 6540, 240000, 65400, 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80', 'Flagship executive multi-purpose vehicle with reclining leather captain chairs, dual panoramic sunroofs, and in-cabin Wi-Fi.', true, true, true),
('car-2', 'Mercedes-Benz', 'Vito Tourer Select', '7-Seater / MPV', 'Both', 8, '7 Bags', 850, 232, 5200, 1417, 16500, 4496, 165000, 44960, 'https://images.unsplash.com/photo-1559297434-fae8a1916a79?auto=format&fit=crop&w=800&q=80', 'Practical, spacious luxury van ideal for airport transfers, family tours, and corporate golf groups.', true, true, true),
('car-3', 'Mercedes-Benz', 'S-Class 500 AMG Line', 'Luxury', 'Both', 4, '3 Bags', 1800, 490, 11000, 2997, 38000, 10354, 380000, 103540, 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80', 'The pinnacle of chauffeured luxury. Rear executive seat with massage function, Burmester 3D surround, and soft-close doors.', true, true, true),
('car-4', 'Mercedes-Benz', 'E-Class Sedan', 'Luxury', 'Both', 4, '2 Bags', 650, 177, 4000, 1090, 13000, 3542, 130000, 35420, 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=800&q=80', 'Executive sedan perfect for corporate business meetings, hotel transfers, and daily VIP commute.', true, true, true),
('car-5', 'Toyota', 'Land Cruiser Prado 4.0L TX-L', 'SUV', 'Self Drive', 7, '4 Bags', 380, 104, 2300, 627, 6800, 1853, 68000, 18530, 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80', 'Legendary Japanese SUV offering supreme reliability, excellent air conditioning, and spacious 7-passenger capability.', true, false, true),
('car-6', 'Toyota', 'Fortuner 4WD 2.7L', 'SUV', 'Self Drive', 7, '4 Bags', 280, 76, 1650, 450, 4800, 1308, 48000, 13080, 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80', 'Robust 7-passenger SUV equipped with high ground clearance, rear air-conditioning, and 4x4 capability.', true, false, true)
ON CONFLICT ("id") DO NOTHING;

-- Safe migration for existing databases:
ALTER TABLE "cars" ADD COLUMN IF NOT EXISTS "gallery" text DEFAULT '[]' NOT NULL;



-- ==============================================================================
-- SAFE MIGRATION FOR EXISTING PRODUCTION DATABASES
-- Removes the retired UAE Resident field and adds the complete rental itinerary.
-- Run this block once against the existing Supabase database.
-- ==============================================================================
ALTER TABLE "enquiries" DROP COLUMN IF EXISTS "is_uae_resident";
ALTER TABLE "enquiries" ADD COLUMN IF NOT EXISTS "dropoff_location" text DEFAULT '';
ALTER TABLE "enquiries" ADD COLUMN IF NOT EXISTS "pickup_time" text DEFAULT '';
ALTER TABLE "enquiries" ADD COLUMN IF NOT EXISTS "return_time" text DEFAULT '';
