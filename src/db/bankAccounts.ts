import { db } from './index.ts';
import { bankAccounts } from './schema.ts';
import { inMemoryStore, loadLocalStore, saveLocalStore } from './localStore.ts';
import { COMPANY_BANK_ACCOUNTS } from '../data/paymentConfig.ts';
import type { CompanyBankAccount } from '../types.ts';

export interface BankAccountRecord {
  id: string;
  companyAccountName: string;
  bankName: string;
  accountNumber: string;
  iban: string;
  swiftCode: string;
  currency: string;
  branchName: string;
  country: string;
  instructions: string;
}

export interface BankDetailsResponse {
  primaryAccount: BankAccountRecord;
  secondaryAccount?: BankAccountRecord;
}

const DEFAULT_PRIMARY: BankAccountRecord = {
  id: 'primary',
  companyAccountName: 'ZONE TOURISM LLC',
  bankName: 'Emirates NBD',
  accountNumber: '1014347702901',
  iban: 'AE79 0260 0010 1434 7702 901',
  swiftCode: '',
  currency: 'AED',
  branchName: 'Dubai Branch',
  country: 'United Arab Emirates',
  instructions: 'For UAE Visit Visa services and general tourism packages.'
};

const DEFAULT_SECONDARY: BankAccountRecord = {
  id: 'secondary',
  companyAccountName: 'HOTWHEELS CAR RENTALS',
  bankName: 'Habib Bank AG Zurich',
  accountNumber: '02-02-08-020311-105-0573857',
  iban: 'AE03 0290 8902 1050 0573 857',
  swiftCode: 'HBZUAEADXXX',
  currency: 'AED',
  branchName: 'Sharjah Branch',
  country: 'United Arab Emirates',
  instructions: 'For Car Rental, VIP Chauffeur services, and corporate fleet bookings.'
};

export async function getBankDetailsFromDb(): Promise<BankDetailsResponse> {
  try {
    const rows = await db.select().from(bankAccounts);
    if (Array.isArray(rows) && rows.length > 0) {
      let primary = rows.find(r => r.id === 'primary');
      let secondary = rows.find(r => r.id === 'secondary');

      return {
        primaryAccount: primary ? {
          id: primary.id,
          companyAccountName: primary.companyAccountName,
          bankName: primary.bankName,
          accountNumber: primary.accountNumber,
          iban: primary.iban,
          swiftCode: primary.swiftCode,
          currency: primary.currency,
          branchName: primary.branchName,
          country: primary.country,
          instructions: primary.instructions
        } : DEFAULT_PRIMARY,
        secondaryAccount: secondary ? {
          id: secondary.id,
          companyAccountName: secondary.companyAccountName,
          bankName: secondary.bankName,
          accountNumber: secondary.accountNumber,
          iban: secondary.iban,
          swiftCode: secondary.swiftCode,
          currency: secondary.currency,
          branchName: secondary.branchName,
          country: secondary.country,
          instructions: secondary.instructions
        } : DEFAULT_SECONDARY
      };
    }
  } catch (error) {
    console.warn('[Database Notice] getBankDetailsFromDb fallback to local store:', (error as any)?.message);
  }

  loadLocalStore();
  return {
    primaryAccount: inMemoryStore.bankDetails.primaryAccount || DEFAULT_PRIMARY,
    secondaryAccount: inMemoryStore.bankDetails.secondaryAccount || DEFAULT_SECONDARY
  };
}

/**
 * Returns all active company bank accounts merged with dynamic database records.
 * Ensures the public payment page (/make-payment) always reflects the latest admin updates!
 */
export async function getAllMergedBankAccounts(): Promise<CompanyBankAccount[]> {
  const details = await getBankDetailsFromDb();
  const primary = details.primaryAccount;
  const secondary = details.secondaryAccount;

  return COMPANY_BANK_ACCOUNTS.map(acc => {
    // If account matches Zone Tourism Primary (zone-enbd)
    if (acc.id === 'zone-enbd' && primary) {
      return {
        ...acc,
        companyAccountName: primary.companyAccountName || acc.companyAccountName,
        bankName: primary.bankName || acc.bankName,
        accountNumber: primary.accountNumber || acc.accountNumber,
        iban: primary.iban || acc.iban,
        swiftCode: primary.swiftCode !== undefined ? primary.swiftCode : acc.swiftCode,
        branchName: primary.branchName || acc.branchName,
        instructions: primary.instructions || acc.instructions
      };
    }
    // If account matches Hotwheels Secondary (hotwheels-habib)
    if (acc.id === 'hotwheels-habib' && secondary) {
      return {
        ...acc,
        companyAccountName: secondary.companyAccountName || acc.companyAccountName,
        bankName: secondary.bankName || acc.bankName,
        accountNumber: secondary.accountNumber || acc.accountNumber,
        iban: secondary.iban || acc.iban,
        swiftCode: secondary.swiftCode !== undefined ? secondary.swiftCode : acc.swiftCode,
        branchName: secondary.branchName || acc.branchName,
        instructions: secondary.instructions || acc.instructions
      };
    }
    return acc;
  });
}

export async function updateBankDetailsInDb(
  primaryData: Partial<BankAccountRecord>,
  secondaryData?: Partial<BankAccountRecord>
): Promise<BankDetailsResponse> {
  loadLocalStore();

  const mergedPrimary: BankAccountRecord = {
    ...DEFAULT_PRIMARY,
    ...(inMemoryStore.bankDetails.primaryAccount || {}),
    ...primaryData,
    id: 'primary'
  };

  const mergedSecondary: BankAccountRecord = {
    ...DEFAULT_SECONDARY,
    ...(inMemoryStore.bankDetails.secondaryAccount || {}),
    ...(secondaryData || {}),
    id: 'secondary'
  };

  try {
    await db.insert(bankAccounts)
      .values({
        id: 'primary',
        companyAccountName: mergedPrimary.companyAccountName,
        bankName: mergedPrimary.bankName,
        accountNumber: mergedPrimary.accountNumber,
        iban: mergedPrimary.iban,
        swiftCode: mergedPrimary.swiftCode,
        currency: mergedPrimary.currency,
        branchName: mergedPrimary.branchName,
        country: mergedPrimary.country,
        instructions: mergedPrimary.instructions,
        updatedAt: new Date()
      } as any)
      .onConflictDoUpdate({
        target: bankAccounts.id,
        set: {
          companyAccountName: mergedPrimary.companyAccountName,
          bankName: mergedPrimary.bankName,
          accountNumber: mergedPrimary.accountNumber,
          iban: mergedPrimary.iban,
          swiftCode: mergedPrimary.swiftCode,
          currency: mergedPrimary.currency,
          branchName: mergedPrimary.branchName,
          country: mergedPrimary.country,
          instructions: mergedPrimary.instructions,
          updatedAt: new Date()
        } as any
      });

    if (secondaryData) {
      await db.insert(bankAccounts)
        .values({
          id: 'secondary',
          companyAccountName: mergedSecondary.companyAccountName,
          bankName: mergedSecondary.bankName,
          accountNumber: mergedSecondary.accountNumber,
          iban: mergedSecondary.iban,
          swiftCode: mergedSecondary.swiftCode,
          currency: mergedSecondary.currency,
          branchName: mergedSecondary.branchName,
          country: mergedSecondary.country,
          instructions: mergedSecondary.instructions,
          updatedAt: new Date()
        } as any)
        .onConflictDoUpdate({
          target: bankAccounts.id,
          set: {
            companyAccountName: mergedSecondary.companyAccountName,
            bankName: mergedSecondary.bankName,
            accountNumber: mergedSecondary.accountNumber,
            iban: mergedSecondary.iban,
            swiftCode: mergedSecondary.swiftCode,
            currency: mergedSecondary.currency,
            branchName: mergedSecondary.branchName,
            country: mergedSecondary.country,
            instructions: mergedSecondary.instructions,
            updatedAt: new Date()
          } as any
        });
    }
  } catch (error) {
    console.warn('[Database Notice] updateBankDetailsInDb fallback to local store:', (error as any)?.message);
  }

  inMemoryStore.bankDetails = {
    primaryAccount: mergedPrimary,
    secondaryAccount: mergedSecondary
  };
  saveLocalStore();

  return {
    primaryAccount: mergedPrimary,
    secondaryAccount: mergedSecondary
  };
}
