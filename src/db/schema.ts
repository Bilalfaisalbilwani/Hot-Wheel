import { pgTable, serial, text, integer, boolean, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Users table for Firebase Auth integration
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Cars table for rental fleet management
export const cars = pgTable('cars', {
  id: text('id').primaryKey(),
  make: text('make').notNull(),
  model: text('model').notNull(),
  category: text('category').notNull(), // 'Sedan' | 'SUV' | 'Luxury' | '7-Seater / MPV'
  serviceType: text('service_type').notNull().default('Both'), // 'Self Drive' | 'Chauffeur Driven' | 'Both'
  seats: integer('seats').notNull().default(5),
  luggage: text('luggage').notNull().default('2 Bags'),
  dailyPriceAED: integer('daily_price_aed').notNull().default(0),
  dailyPriceUSD: integer('daily_price_usd').notNull().default(0),
  weeklyPriceAED: integer('weekly_price_aed').notNull().default(0),
  weeklyPriceUSD: integer('weekly_price_usd').notNull().default(0),
  monthlyPriceAED: integer('monthly_price_aed').notNull().default(0),
  monthlyPriceUSD: integer('monthly_price_usd').notNull().default(0),
  yearlyPriceAED: integer('yearly_price_aed').notNull().default(0),
  yearlyPriceUSD: integer('yearly_price_usd').notNull().default(0),
  image: text('image').notNull(),
  gallery: text('gallery').notNull().default('[]'),
  videoUrl: text('video_url').default(''),
  description: text('description').notNull().default(''),
  getQuoteOption: boolean('get_quote_option').notNull().default(false),
  isMercedesChauffeur: boolean('is_mercedes_chauffeur').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('cars_is_active_created_at_desc_idx').on(table.isActive, table.createdAt.desc()),
]);

// Bank accounts table for company payment details persistence
export const bankAccounts = pgTable('bank_accounts', {
  id: text('id').primaryKey(), // 'primary' | 'secondary'
  companyAccountName: text('company_account_name').notNull().default(''),
  bankName: text('bank_name').notNull().default(''),
  accountNumber: text('account_number').notNull().default(''),
  iban: text('iban').notNull().default(''),
  swiftCode: text('swift_code').notNull().default(''),
  currency: text('currency').notNull().default('AED'),
  branchName: text('branch_name').notNull().default(''),
  country: text('country').notNull().default('United Arab Emirates'),
  instructions: text('instructions').notNull().default(''),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Enquiries table for Visa, Car Rental, Chauffeur, and General queries
export const enquiries = pgTable('enquiries', {
  id: text('id').primaryKey(),
  referenceId: text('reference_id').default(''),
  enquiryType: text('enquiry_type').notNull(), // 'visa' | 'car-rental' | 'chauffeur' | 'contact'
  name: text('name').notNull().default(''),
  nationality: text('nationality').default(''),
  destination: text('destination').default(''),
  travelDate: text('travel_date').default(''),
  whatsappNumber: text('whatsapp_number').notNull().default(''),
  pickupLocation: text('pickup_location').default(''),
  dropoffLocation: text('dropoff_location').default(''),
  pickupDate: text('pickup_date').default(''),
  pickupTime: text('pickup_time').default(''),
  returnDate: text('return_date').default(''),
  returnTime: text('return_time').default(''),
  serviceType: text('service_type').default(''), // 'Self Drive' | 'Chauffeur' | 'Chauffeur Driven'
  vehicleType: text('vehicle_type').default(''),
  status: text('status').notNull().default('New'), // 'New' | 'Contacted' | 'In Progress' | 'Completed' | 'Cancelled'
  notes: text('notes').default(''),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  uniqueIndex('enquiries_reference_id_unique_idx')
    .on(table.referenceId)
    .where(sql`${table.referenceId} IS NOT NULL`),
  index('enquiries_created_at_desc_idx').on(table.createdAt.desc()),
  index('enquiries_enquiry_type_idx').on(table.enquiryType),
]);
