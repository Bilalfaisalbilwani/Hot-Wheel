import React from 'react';
import { Phone } from 'lucide-react';

export interface CountryCallingCode {
  iso: string;
  name: string;
  dialCode: string;
  flag: string;
}

export const COUNTRY_CALLING_CODES: CountryCallingCode[] = [
  { iso:'PK', name:'Pakistan', dialCode:'+92', flag:'🇵🇰' },
  { iso:'AE', name:'United Arab Emirates', dialCode:'+971', flag:'🇦🇪' },
  { iso:'SA', name:'Saudi Arabia', dialCode:'+966', flag:'🇸🇦' },
  { iso:'IN', name:'India', dialCode:'+91', flag:'🇮🇳' },
  { iso:'GB', name:'United Kingdom', dialCode:'+44', flag:'🇬🇧' },
  { iso:'US', name:'United States', dialCode:'+1', flag:'🇺🇸' },
  { iso:'CA', name:'Canada', dialCode:'+1', flag:'🇨🇦' },
  { iso:'AU', name:'Australia', dialCode:'+61', flag:'🇦🇺' },
  { iso:'NZ', name:'New Zealand', dialCode:'+64', flag:'🇳🇿' },
  { iso:'QA', name:'Qatar', dialCode:'+974', flag:'🇶🇦' },
  { iso:'KW', name:'Kuwait', dialCode:'+965', flag:'🇰🇼' },
  { iso:'BH', name:'Bahrain', dialCode:'+973', flag:'🇧🇭' },
  { iso:'OM', name:'Oman', dialCode:'+968', flag:'🇴🇲' },
  { iso:'TR', name:'Türkiye', dialCode:'+90', flag:'🇹🇷' },
  { iso:'DE', name:'Germany', dialCode:'+49', flag:'🇩🇪' },
  { iso:'FR', name:'France', dialCode:'+33', flag:'🇫🇷' },
  { iso:'IT', name:'Italy', dialCode:'+39', flag:'🇮🇹' },
  { iso:'ES', name:'Spain', dialCode:'+34', flag:'🇪🇸' },
  { iso:'PT', name:'Portugal', dialCode:'+351', flag:'🇵🇹' },
  { iso:'NL', name:'Netherlands', dialCode:'+31', flag:'🇳🇱' },
  { iso:'BE', name:'Belgium', dialCode:'+32', flag:'🇧🇪' },
  { iso:'CH', name:'Switzerland', dialCode:'+41', flag:'🇨🇭' },
  { iso:'AT', name:'Austria', dialCode:'+43', flag:'🇦🇹' },
  { iso:'SE', name:'Sweden', dialCode:'+46', flag:'🇸🇪' },
  { iso:'NO', name:'Norway', dialCode:'+47', flag:'🇳🇴' },
  { iso:'DK', name:'Denmark', dialCode:'+45', flag:'🇩🇰' },
  { iso:'FI', name:'Finland', dialCode:'+358', flag:'🇫🇮' },
  { iso:'IE', name:'Ireland', dialCode:'+353', flag:'🇮🇪' },
  { iso:'PL', name:'Poland', dialCode:'+48', flag:'🇵🇱' },
  { iso:'CZ', name:'Czechia', dialCode:'+420', flag:'🇨🇿' },
  { iso:'GR', name:'Greece', dialCode:'+30', flag:'🇬🇷' },
  { iso:'RO', name:'Romania', dialCode:'+40', flag:'🇷🇴' },
  { iso:'HU', name:'Hungary', dialCode:'+36', flag:'🇭🇺' },
  { iso:'UA', name:'Ukraine', dialCode:'+380', flag:'🇺🇦' },
  { iso:'RU', name:'Russia', dialCode:'+7', flag:'🇷🇺' },
  { iso:'KZ', name:'Kazakhstan', dialCode:'+7', flag:'🇰🇿' },
  { iso:'AZ', name:'Azerbaijan', dialCode:'+994', flag:'🇦🇿' },
  { iso:'GE', name:'Georgia', dialCode:'+995', flag:'🇬🇪' },
  { iso:'AM', name:'Armenia', dialCode:'+374', flag:'🇦🇲' },
  { iso:'CN', name:'China', dialCode:'+86', flag:'🇨🇳' },
  { iso:'JP', name:'Japan', dialCode:'+81', flag:'🇯🇵' },
  { iso:'KR', name:'South Korea', dialCode:'+82', flag:'🇰🇷' },
  { iso:'SG', name:'Singapore', dialCode:'+65', flag:'🇸🇬' },
  { iso:'MY', name:'Malaysia', dialCode:'+60', flag:'🇲🇾' },
  { iso:'ID', name:'Indonesia', dialCode:'+62', flag:'🇮🇩' },
  { iso:'TH', name:'Thailand', dialCode:'+66', flag:'🇹🇭' },
  { iso:'VN', name:'Vietnam', dialCode:'+84', flag:'🇻🇳' },
  { iso:'PH', name:'Philippines', dialCode:'+63', flag:'🇵🇭' },
  { iso:'BD', name:'Bangladesh', dialCode:'+880', flag:'🇧🇩' },
  { iso:'LK', name:'Sri Lanka', dialCode:'+94', flag:'🇱🇰' },
  { iso:'NP', name:'Nepal', dialCode:'+977', flag:'🇳🇵' },
  { iso:'AF', name:'Afghanistan', dialCode:'+93', flag:'🇦🇫' },
  { iso:'IR', name:'Iran', dialCode:'+98', flag:'🇮🇷' },
  { iso:'IQ', name:'Iraq', dialCode:'+964', flag:'🇮🇶' },
  { iso:'JO', name:'Jordan', dialCode:'+962', flag:'🇯🇴' },
  { iso:'LB', name:'Lebanon', dialCode:'+961', flag:'🇱🇧' },
  { iso:'SY', name:'Syria', dialCode:'+963', flag:'🇸🇾' },
  { iso:'IL', name:'Israel', dialCode:'+972', flag:'🇮🇱' },
  { iso:'EG', name:'Egypt', dialCode:'+20', flag:'🇪🇬' },
  { iso:'ZA', name:'South Africa', dialCode:'+27', flag:'🇿🇦' },
  { iso:'NG', name:'Nigeria', dialCode:'+234', flag:'🇳🇬' },
  { iso:'GH', name:'Ghana', dialCode:'+233', flag:'🇬🇭' },
  { iso:'KE', name:'Kenya', dialCode:'+254', flag:'🇰🇪' },
  { iso:'TZ', name:'Tanzania', dialCode:'+255', flag:'🇹🇿' },
  { iso:'UG', name:'Uganda', dialCode:'+256', flag:'🇺🇬' },
  { iso:'ET', name:'Ethiopia', dialCode:'+251', flag:'🇪🇹' },
  { iso:'MA', name:'Morocco', dialCode:'+212', flag:'🇲🇦' },
  { iso:'DZ', name:'Algeria', dialCode:'+213', flag:'🇩🇿' },
  { iso:'TN', name:'Tunisia', dialCode:'+216', flag:'🇹🇳' },
  { iso:'LY', name:'Libya', dialCode:'+218', flag:'🇱🇾' },
  { iso:'SD', name:'Sudan', dialCode:'+249', flag:'🇸🇩' },
  { iso:'MU', name:'Mauritius', dialCode:'+230', flag:'🇲🇺' },
  { iso:'SC', name:'Seychelles', dialCode:'+248', flag:'🇸🇨' },
  { iso:'BR', name:'Brazil', dialCode:'+55', flag:'🇧🇷' },
  { iso:'MX', name:'Mexico', dialCode:'+52', flag:'🇲🇽' },
  { iso:'AR', name:'Argentina', dialCode:'+54', flag:'🇦🇷' },
  { iso:'CL', name:'Chile', dialCode:'+56', flag:'🇨🇱' },
  { iso:'CO', name:'Colombia', dialCode:'+57', flag:'🇨🇴' },
  { iso:'PE', name:'Peru', dialCode:'+51', flag:'🇵🇪' },
  { iso:'UY', name:'Uruguay', dialCode:'+598', flag:'🇺🇾' },
  { iso:'VE', name:'Venezuela', dialCode:'+58', flag:'🇻🇪' },
  { iso:'BO', name:'Bolivia', dialCode:'+591', flag:'🇧🇴' },
  { iso:'EC', name:'Ecuador', dialCode:'+593', flag:'🇪🇨' },
  { iso:'CR', name:'Costa Rica', dialCode:'+506', flag:'🇨🇷' },
  { iso:'PA', name:'Panama', dialCode:'+507', flag:'🇵🇦' },
  { iso:'DO', name:'Dominican Republic', dialCode:'+1', flag:'🇩🇴' },
  { iso:'JM', name:'Jamaica', dialCode:'+1', flag:'🇯🇲' },
  { iso:'TT', name:'Trinidad and Tobago', dialCode:'+1', flag:'🇹🇹' },
  { iso:'BS', name:'Bahamas', dialCode:'+1', flag:'🇧🇸' },
  { iso:'BB', name:'Barbados', dialCode:'+1', flag:'🇧🇧' },
  { iso:'IS', name:'Iceland', dialCode:'+354', flag:'🇮🇸' },
  { iso:'MT', name:'Malta', dialCode:'+356', flag:'🇲🇹' },
  { iso:'CY', name:'Cyprus', dialCode:'+357', flag:'🇨🇾' },
  { iso:'LU', name:'Luxembourg', dialCode:'+352', flag:'🇱🇺' },
  { iso:'EE', name:'Estonia', dialCode:'+372', flag:'🇪🇪' },
  { iso:'LV', name:'Latvia', dialCode:'+371', flag:'🇱🇻' },
  { iso:'LT', name:'Lithuania', dialCode:'+370', flag:'🇱🇹' },
  { iso:'SK', name:'Slovakia', dialCode:'+421', flag:'🇸🇰' },
  { iso:'SI', name:'Slovenia', dialCode:'+386', flag:'🇸🇮' },
  { iso:'HR', name:'Croatia', dialCode:'+385', flag:'🇭🇷' },
  { iso:'RS', name:'Serbia', dialCode:'+381', flag:'🇷🇸' },
  { iso:'BG', name:'Bulgaria', dialCode:'+359', flag:'🇧🇬' },
  { iso:'AL', name:'Albania', dialCode:'+355', flag:'🇦🇱' },
  { iso:'BA', name:'Bosnia and Herzegovina', dialCode:'+387', flag:'🇧🇦' },
  { iso:'MK', name:'North Macedonia', dialCode:'+389', flag:'🇲🇰' },
  { iso:'ME', name:'Montenegro', dialCode:'+382', flag:'🇲🇪' },
  { iso:'MD', name:'Moldova', dialCode:'+373', flag:'🇲🇩' },
  { iso:'BY', name:'Belarus', dialCode:'+375', flag:'🇧🇾' },
  { iso:'UZ', name:'Uzbekistan', dialCode:'+998', flag:'🇺🇿' },
  { iso:'TM', name:'Turkmenistan', dialCode:'+993', flag:'🇹🇲' },
  { iso:'KG', name:'Kyrgyzstan', dialCode:'+996', flag:'🇰🇬' },
  { iso:'TJ', name:'Tajikistan', dialCode:'+992', flag:'🇹🇯' },
  { iso:'MN', name:'Mongolia', dialCode:'+976', flag:'🇲🇳' },
  { iso:'MM', name:'Myanmar', dialCode:'+95', flag:'🇲🇲' },
  { iso:'KH', name:'Cambodia', dialCode:'+855', flag:'🇰🇭' },
  { iso:'LA', name:'Laos', dialCode:'+856', flag:'🇱🇦' },
  { iso:'BN', name:'Brunei', dialCode:'+673', flag:'🇧🇳' },
  { iso:'MV', name:'Maldives', dialCode:'+960', flag:'🇲🇻' },
  { iso:'FJ', name:'Fiji', dialCode:'+679', flag:'🇫🇯' },
  { iso:'PG', name:'Papua New Guinea', dialCode:'+675', flag:'🇵🇬' },
  { iso:'WS', name:'Samoa', dialCode:'+685', flag:'🇼🇸' },
  { iso:'TO', name:'Tonga', dialCode:'+676', flag:'🇹🇴' },
  { iso:'VU', name:'Vanuatu', dialCode:'+678', flag:'🇻🇺' },
  { iso:'NC', name:'New Caledonia', dialCode:'+687', flag:'🇳🇨' },
  { iso:'PF', name:'French Polynesia', dialCode:'+689', flag:'🇵🇫' },
  { iso:'GU', name:'Guam', dialCode:'+1', flag:'🇬🇺' },
  { iso:'HK', name:'Hong Kong', dialCode:'+852', flag:'🇭🇰' },
  { iso:'MO', name:'Macao', dialCode:'+853', flag:'🇲🇴' },
  { iso:'TW', name:'Taiwan', dialCode:'+886', flag:'🇹🇼' },
  { iso:'PS', name:'Palestine', dialCode:'+970', flag:'🇵🇸' },
  { iso:'YE', name:'Yemen', dialCode:'+967', flag:'🇾🇪' },
  { iso:'SN', name:'Senegal', dialCode:'+221', flag:'🇸🇳' },
  { iso:'CI', name:'Côte d’Ivoire', dialCode:'+225', flag:'🇨🇮' },
  { iso:'CM', name:'Cameroon', dialCode:'+237', flag:'🇨🇲' },
  { iso:'ZW', name:'Zimbabwe', dialCode:'+263', flag:'🇿🇼' },
  { iso:'ZM', name:'Zambia', dialCode:'+260', flag:'🇿🇲' },
  { iso:'BW', name:'Botswana', dialCode:'+267', flag:'🇧🇼' },
  { iso:'NA', name:'Namibia', dialCode:'+264', flag:'🇳🇦' },
  { iso:'MZ', name:'Mozambique', dialCode:'+258', flag:'🇲🇿' },
  { iso:'RW', name:'Rwanda', dialCode:'+250', flag:'🇷🇼' },
  { iso:'BJ', name:'Benin', dialCode:'+229', flag:'🇧🇯' },
  { iso:'TG', name:'Togo', dialCode:'+228', flag:'🇹🇬' },
  { iso:'SL', name:'Sierra Leone', dialCode:'+232', flag:'🇸🇱' },
  { iso:'LR', name:'Liberia', dialCode:'+231', flag:'🇱🇷' },
  { iso:'GM', name:'Gambia', dialCode:'+220', flag:'🇬🇲' },
  { iso:'GN', name:'Guinea', dialCode:'+224', flag:'🇬🇳' },
  { iso:'ML', name:'Mali', dialCode:'+223', flag:'🇲🇱' },
  { iso:'BF', name:'Burkina Faso', dialCode:'+226', flag:'🇧🇫' },
  { iso:'NE', name:'Niger', dialCode:'+227', flag:'🇳🇪' },
  { iso:'MR', name:'Mauritania', dialCode:'+222', flag:'🇲🇷' },
  { iso:'CV', name:'Cabo Verde', dialCode:'+238', flag:'🇨🇻' },
  { iso:'GA', name:'Gabon', dialCode:'+241', flag:'🇬🇦' },
  { iso:'CG', name:'Republic of the Congo', dialCode:'+242', flag:'🇨🇬' },
  { iso:'CD', name:'DR Congo', dialCode:'+243', flag:'🇨🇩' },
  { iso:'AO', name:'Angola', dialCode:'+244', flag:'🇦🇴' },
  { iso:'MG', name:'Madagascar', dialCode:'+261', flag:'🇲🇬' },
  { iso:'MW', name:'Malawi', dialCode:'+265', flag:'🇲🇼' },
  { iso:'BI', name:'Burundi', dialCode:'+257', flag:'🇧🇮' },
  { iso:'SO', name:'Somalia', dialCode:'+252', flag:'🇸🇴' },
  { iso:'DJ', name:'Djibouti', dialCode:'+253', flag:'🇩🇯' },
  { iso:'ER', name:'Eritrea', dialCode:'+291', flag:'🇪🇷' },
  { iso:'SS', name:'South Sudan', dialCode:'+211', flag:'🇸🇸' },
  { iso:'HT', name:'Haiti', dialCode:'+509', flag:'🇭🇹' },
  { iso:'GT', name:'Guatemala', dialCode:'+502', flag:'🇬🇹' },
  { iso:'HN', name:'Honduras', dialCode:'+504', flag:'🇭🇳' },
  { iso:'SV', name:'El Salvador', dialCode:'+503', flag:'🇸🇻' },
  { iso:'NI', name:'Nicaragua', dialCode:'+505', flag:'🇳🇮' },
  { iso:'CU', name:'Cuba', dialCode:'+53', flag:'🇨🇺' },
  { iso:'GY', name:'Guyana', dialCode:'+592', flag:'🇬🇾' },
  { iso:'SR', name:'Suriname', dialCode:'+597', flag:'🇸🇷' },
  { iso:'PY', name:'Paraguay', dialCode:'+595', flag:'🇵🇾' },
  { iso:'AG', name:'Antigua and Barbuda', dialCode:'+1', flag:'🇦🇬' },
  { iso:'LC', name:'Saint Lucia', dialCode:'+1', flag:'🇱🇨' },
  { iso:'GD', name:'Grenada', dialCode:'+1', flag:'🇬🇩' },
  { iso:'KN', name:'Saint Kitts and Nevis', dialCode:'+1', flag:'🇰🇳' },
  { iso:'VC', name:'Saint Vincent and the Grenadines', dialCode:'+1', flag:'🇻🇨' },
  { iso:'BZ', name:'Belize', dialCode:'+501', flag:'🇧🇿' },
];

export function buildPhoneNumber(countryCode: string, localNumber: string): string {
  const digits = localNumber.replace(/\D/g, '');
  return `${countryCode}${digits}`;
}

interface PhoneNumberFieldProps {
  label: string;
  countryCode: string;
  number: string;
  onCountryCodeChange: (value: string) => void;
  onNumberChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  id?: string;
}

export const PhoneNumberField: React.FC<PhoneNumberFieldProps> = ({
  label,
  countryCode,
  number,
  onCountryCodeChange,
  onNumberChange,
  error,
  disabled = false,
  required = false,
  placeholder = '331 5424466',
  helperText,
  id
}) => (
  <div>
    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <div className="flex gap-2">
      <div className="relative w-[142px] shrink-0">
        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
        <select
          aria-label={`${label} country code`}
          value={countryCode}
          disabled={disabled}
          onChange={(e) => onCountryCodeChange(e.target.value)}
          className="w-full pl-9 pr-2 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B4DA2]/20 focus:border-[#0B4DA2] min-h-[44px] cursor-pointer"
        >
          {COUNTRY_CALLING_CODES.map((country) => (
            <option key={`${country.iso}-${country.dialCode}-${country.name}`} value={country.dialCode}>
              {country.flag} {country.dialCode} {country.name}
            </option>
          ))}
        </select>
      </div>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        value={number}
        onChange={(e) => onNumberChange(e.target.value.replace(/[^\d\s()-]/g, ''))}
        className={`min-w-0 flex-1 px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 min-h-[44px] ${
          error
            ? 'border-rose-400 bg-rose-50/40 focus:ring-rose-400 text-rose-900'
            : 'border-slate-300 bg-white focus:border-[#0B4DA2] focus:ring-[#0B4DA2]/20 text-slate-900'
        }`}
      />
    </div>
    {error ? (
      <p className="text-[11px] text-rose-600 mt-1 font-medium">{error}</p>
    ) : helperText ? (
      <p className="text-[11px] text-slate-500 mt-1">{helperText}</p>
    ) : null}
  </div>
);
