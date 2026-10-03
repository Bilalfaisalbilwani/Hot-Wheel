import { apiUrl } from '../utils/api';
import React, { useState } from 'react';
import { CardPaymentResult, CompanyBankAccount } from '../types';
import { COMPANY_CONFIG } from '../data/travelData';
import { COMPANY_BANK_ACCOUNTS } from '../data/paymentConfig';
import { 
  CreditCard, ShieldCheck, Lock, CheckCircle2, 
  Printer, ArrowRight, Loader2, Info, Building2, Copy, Check, ExternalLink
} from 'lucide-react';
import { WhatsAppOfficialIcon } from './WhatsAppFloat';
import { openWhatsAppDirectly } from '../utils/whatsapp';

interface CreditCardPaymentSectionProps {
  initialServiceEntity?: string;
  onPaymentSuccess?: (result: CardPaymentResult) => void;
}

export const CreditCardPaymentSection: React.FC<CreditCardPaymentSectionProps> = ({
  initialServiceEntity = 'ZONE TOURISM LLC',
  onPaymentSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'cardLink' | 'bankTransfer'>('cardLink');
  const [serviceEntity, setServiceEntity] = useState<string>(initialServiceEntity);
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerPhoneCountryCode, setCustomerPhoneCountryCode] = useState('+92');
  const [amount, setAmount] = useState<string>('350');
  const [currency, setCurrency] = useState<'AED' | 'USD'>('AED');
  const [notes, setNotes] = useState<string>('');

  // UI Flow States
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [paymentResult, setPaymentResult] = useState<CardPaymentResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedIban, setCopiedIban] = useState<string | null>(null);

  // Selected Bank Account
  const [selectedAccountId, setSelectedAccountId] = useState<string>('zone-enbd');
  const currentAccount = COMPANY_BANK_ACCOUNTS.find(a => a.id === selectedAccountId) || COMPANY_BANK_ACCOUNTS[0];

  // Quick Amount Presets
  const PRESET_AMOUNTS = [
    { label: '30-Day Visa', aed: 350 },
    { label: '60-Day Visa', aed: 700 },
    { label: 'Car Rental / Deposit', aed: 500 },
    { label: 'Executive Chauffeur', aed: 850 }
  ];

  const handleCopyIban = (iban: string) => {
    navigator.clipboard.writeText(iban);
    setCopiedIban(iban);
    setTimeout(() => setCopiedIban(null), 2500);
  };

  // Submit Payment Link Request
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!customerPhone.trim() && !customerEmail.trim()) {
      setErrorMessage('Please provide your WhatsApp number or Email so we can send the payment link.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Please enter a valid payment amount.');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        serviceEntity,
        referenceNo: referenceNo.trim() || undefined,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: buildPhoneNumber(customerPhoneCountryCode, customerPhone),
        amount: numAmount,
        currency,
        notes: notes.trim()
      };

      const res = await fetch(apiUrl('/api/payments/request-link'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success && data.data) {
        const result: CardPaymentResult = {
          transactionId: data.data.requestId || `REQ-${Date.now().toString().slice(-6)}`,
          referenceNo: data.data.referenceNo,
          serviceEntity: data.data.serviceEntity,
          customerName: data.data.customerName,
          customerEmail: data.data.customerEmail,
          customerPhone: data.data.customerPhone,
          amount: data.data.amount,
          currency: data.data.currency,
          cardBrand: 'Authorized Gateway',
          cardLast4: '3DS',
          timestamp: data.data.timestamp,
          status: 'Pending Merchant Link Dispatch'
        };

        setPaymentResult(result);
        if (onPaymentSuccess) {
          onPaymentSuccess(result);
        }
      } else {
        setErrorMessage(data.error || 'Failed to submit payment link request. Please contact our support team.');
      }
    } catch {
      setErrorMessage('Connection error. Please contact our accounts desk directly on WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenWhatsAppRequest = () => {
    const waNumber = (COMPANY_CONFIG.whatsappNumber || '971555586359').replace(/\D/g, '');
    const msg = `Hello Accounts Team, I would like to request an authorized 3D Secure payment link:
• Customer: ${customerName || 'Customer'}
• Reference: ${referenceNo || 'New Booking'}
• Service: ${serviceEntity}
• Amount: ${currency} ${amount}
• Contact: ${customerPhone || customerEmail || 'WhatsApp'}
Please share the official card payment link.`;
    openWhatsAppDirectly(msg, waNumber);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
      
      {/* Header */}
      <div className="pb-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0B4DA2]/10 border border-[#0B4DA2]/20 flex items-center justify-center text-[#0B4DA2] shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#0A2540] tracking-tight">
              Official Payment Facility
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Secure settlement via Authorized UAE Banking Gateway or Verified Bank Transfer
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>PCI-DSS & 3D Secure Compliant</span>
          </span>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('cardLink')}
          className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'cardLink'
              ? 'bg-white text-[#0B4DA2] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Card Payment Link (3D Secure)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('bankTransfer')}
          className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'bankTransfer'
              ? 'bg-white text-[#0B4DA2] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Official Bank Transfer (IBAN)</span>
        </button>
      </div>

      {/* TAB 1: CARD PAYMENT LINK REQUEST */}
      {activeTab === 'cardLink' && (
        <>
          {paymentResult ? (
            /* SUCCESS CONFIRMATION */
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 rounded-3xl bg-emerald-50/80 border border-emerald-200 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Payment Request Registered
                  </span>
                  <h4 className="text-xl sm:text-2xl font-black text-[#0A2540]">
                    Payment Link Dispatched
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                    Your request has been registered. An authorized 3D Secure payment link has been dispatched to your contact details.
                  </p>
                </div>
              </div>

              {/* Receipt / Details Card */}
              <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Request Reference
                  </span>
                  <span className="text-xs font-mono font-bold text-[#0B4DA2]">
                    {paymentResult.transactionId}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Customer</span>
                    <span className="font-semibold text-slate-800">{paymentResult.customerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Entity</span>
                    <span className="font-bold text-[#0A2540]">{paymentResult.serviceEntity}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Amount</span>
                    <span className="font-extrabold text-emerald-700">{paymentResult.currency} {paymentResult.amount}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Security Protocol</span>
                    <span className="font-semibold text-slate-800">3D Secure / OTP Verified</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Accepted Cards</span>
                    <span className="font-semibold text-slate-800">Visa, Mastercard, AMEX, Apple Pay</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Status</span>
                    <span className="inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                      Ready for Payment
                    </span>
                  </div>
                </div>
              </div>

              {/* Direct Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={handleOpenWhatsAppRequest}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <WhatsAppOfficialIcon className="w-4 h-4" />
                  <span>Receive Link on WhatsApp Now</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentResult(null)}
                  className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Submit Another Request
                </button>
              </div>
            </div>
          ) : (
            /* FORM TO REQUEST SECURE PAYMENT LINK */
            <form onSubmit={handleSubmitRequest} className="space-y-5">
              
              {/* Compliance & Security Banner */}
              <div className="p-4 rounded-2xl bg-[#0A2540] text-white space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#C9A227] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    Authorized UAE Merchant Gateway
                  </span>
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-200 font-semibold">
                    PCI-DSS Regulated
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  To safeguard cardholders, credit card payments are processed exclusively through authorized UAE merchant banking gateways with 3D Secure (OTP) authentication. Raw card numbers are never captured or stored on public forms.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="px-2 py-0.5 bg-white text-[#0A2540] font-black text-[10px] rounded">VISA</span>
                  <span className="px-2 py-0.5 bg-white text-[#EB001B] font-black text-[10px] rounded">Mastercard</span>
                  <span className="px-2 py-0.5 bg-white text-[#006FCF] font-black text-[10px] rounded">AMEX</span>
                  <span className="px-2 py-0.5 bg-white/20 text-white font-bold text-[10px] rounded">Apple Pay</span>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {errorMessage}
                </div>
              )}

              {/* Service Entity Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Payment For Company Entity:
                </label>
                <select
                  value={serviceEntity}
                  onChange={(e) => setServiceEntity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0B4DA2]"
                >
                  <option value="ZONE TOURISM LLC">ZONE TOURISM LLC (UAE Visas & Tours)</option>
                  <option value="HOTWHEELS CAR RENTAL LLC">HOTWHEELS CAR RENTAL LLC (Car Rental & Chauffeur)</option>
                  <option value="CROWN ZONE TOURISM LLC">CROWN ZONE TOURISM LLC (Al Quoz Branch)</option>
                </select>
              </div>

              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4DA2]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Booking Reference (Optional)
                  </label>
                  <input
                    type="text"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    placeholder="e.g. VT-849201 or HW-CAR-521"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4DA2]"
                  />
                </div>

                <PhoneNumberField
                  label="WhatsApp Number"
                  required
                  countryCode={customerPhoneCountryCode}
                  number={customerPhone}
                  onCountryCodeChange={setCustomerPhoneCountryCode}
                  onNumberChange={setCustomerPhone}
                  placeholder="331 5424466"
                  helperText={`Full number: ${buildPhoneNumber(customerPhoneCountryCode, customerPhone)}`}
                />

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0B4DA2]"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Confirmed Amount (AED) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      required
                      min="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Amount in AED"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-bold text-[#0A2540] focus:outline-none focus:ring-2 focus:ring-[#0B4DA2]"
                    />
                    <span className="inline-flex items-center px-4 rounded-xl bg-slate-100 text-xs font-extrabold text-slate-700">
                      AED
                    </span>
                  </div>

                  {/* Preset Amount Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    {PRESET_AMOUNTS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setAmount(String(p.aed))}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          amount === String(p.aed)
                            ? 'bg-[#0B4DA2] text-white border-[#0B4DA2]'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {p.label}: AED {p.aed}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#0B4DA2] hover:bg-[#083B7D] text-white font-extrabold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Registering Payment Link Request...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-[#C9A227]" />
                      <span>Request Official 3D-Secure Payment Link</span>
                    </>
                  )}
                </button>

                <p className="text-center text-[11px] text-slate-500">
                  Instant dispatch of authorized bank acquiring link to WhatsApp & Email.
                </p>
              </div>

            </form>
          )}
        </>
      )}

      {/* TAB 2: OFFICIAL BANK TRANSFER */}
      {activeTab === 'bankTransfer' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Choose Verified Corporate Account:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COMPANY_BANK_ACCOUNTS.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => setSelectedAccountId(acc.id || '')}
                  className={`p-3 rounded-xl border text-xs text-left transition-all cursor-pointer ${
                    selectedAccountId === acc.id
                      ? 'border-[#0B4DA2] bg-[#0B4DA2]/5 text-[#0A2540] font-bold shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-extrabold text-[#0A2540]">{acc.companyAccountName}</div>
                  <div className="text-[11px] text-[#0B4DA2] mt-0.5">{acc.bankName}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Account Detail Box */}
          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-slate-200 space-y-3.5 text-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
              <span className="text-slate-500">Beneficiary / Account Name</span>
              <span className="font-extrabold text-[#0A2540] text-sm">{currentAccount.companyAccountName}</span>
            </div>

            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
              <span className="text-slate-500">Bank Name</span>
              <span className="font-bold text-[#0A2540]">{currentAccount.bankName}</span>
            </div>

            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
              <span className="text-slate-500">Account Number</span>
              <span className="font-mono font-bold text-[#0A2540]">{currentAccount.accountNumber}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2.5 border-b border-slate-200">
              <span className="text-slate-500">IBAN</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-extrabold text-[#0B4DA2] text-xs sm:text-sm">
                  {currentAccount.iban}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyIban(currentAccount.iban)}
                  className="px-2 py-1 rounded bg-[#0B4DA2]/10 hover:bg-[#0B4DA2]/20 text-[#0B4DA2] font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  {copiedIban === currentAccount.iban ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">SWIFT / BIC</span>
              <span className="font-mono font-bold text-[#0A2540]">{currentAccount.swiftCode || 'HBZUAEADXXX'}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p>
              Please mention your booking reference number in the transfer narrative and share your payment receipt on WhatsApp with our accounts desk for instant reconciliation.
            </p>
          </div>

          <a
            href={`https://wa.me/${(COMPANY_CONFIG.whatsappNumber || '971555586359').replace(/\D/g, '')}?text=${encodeURIComponent(
              `Hello Accounts Team, I have completed a bank transfer for my booking. Please find attached my payment receipt.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <WhatsAppOfficialIcon className="w-4 h-4" />
            <span>Share Bank Transfer Receipt on WhatsApp</span>
          </a>

        </div>
      )}

    </div>
  );
};
