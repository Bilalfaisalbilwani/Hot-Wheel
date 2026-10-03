import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X, 
  Sparkles,
  Clock,
  History,
  CalendarDays
} from 'lucide-react';

export interface ProfessionalDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  minDate?: string; // YYYY-MM-DD (e.g. today or 1920-01-01)
  maxDate?: string; // YYYY-MM-DD
  disabled?: boolean;
  error?: string;
  className?: string;
  id?: string;
  name?: string;
  isBirthDate?: boolean;
  mode?: 'birthdate' | 'travel' | 'general';
  startYear?: number;
  endYear?: number;
  showPresets?: boolean;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const ProfessionalDatePicker: React.FC<ProfessionalDatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Select Date',
  required = false,
  minDate,
  maxDate,
  disabled = false,
  error,
  className = '',
  id,
  name,
  isBirthDate,
  mode = 'general',
  startYear,
  endYear,
  showPresets = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Today reference
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();
  const todayStr = `${currentYear}-${String(todayMonth + 1).padStart(2, '0')}-${String(todayDate).padStart(2, '0')}`;

  // Smart detection if this picker is used for Date of Birth
  const isBirthDatePicker = 
    isBirthDate === true || 
    mode === 'birthdate' ||
    Boolean(id?.toLowerCase().includes('dob') || id?.toLowerCase().includes('birth')) ||
    Boolean(label?.toLowerCase().includes('birth') || label?.toLowerCase().includes('dob')) ||
    (Boolean(maxDate) && !minDate && maxDate <= todayStr);

  // Parse YYYY-MM-DD string safely into Date object
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.trim().split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month, day);
      }
    }
    return null;
  };

  const selectedDateObj = parseDate(value);

  // Determine allowed min and max years
  const computedMinYear = (() => {
    if (startYear !== undefined) return startYear;
    if (minDate) {
      const p = parseDate(minDate);
      if (p) return p.getFullYear();
    }
    if (isBirthDatePicker) {
      // Allow previous 110 years for birth dates (e.g. 1916 for 2026)
      return currentYear - 110;
    }
    return currentYear - 1;
  })();

  const computedMaxYear = (() => {
    if (endYear !== undefined) return endYear;
    if (maxDate) {
      const p = parseDate(maxDate);
      if (p) return p.getFullYear();
    }
    if (isBirthDatePicker) {
      // NEVER open upcoming years for a date of birth
      return currentYear;
    }
    return currentYear + 6;
  })();

  // Initial view year / month
  const getInitialYear = () => {
    if (selectedDateObj) return selectedDateObj.getFullYear();
    if (isBirthDatePicker) {
      // Adult default: ~25 years ago (e.g. 2001) for swift visa applicant selection
      const adultYear = currentYear - 25;
      return Math.min(Math.max(adultYear, computedMinYear), computedMaxYear);
    }
    return currentYear;
  };

  const getInitialMonth = () => {
    if (selectedDateObj) return selectedDateObj.getMonth();
    if (isBirthDatePicker) return 0; // January
    return todayMonth;
  };

  const [viewYear, setViewYear] = useState<number>(getInitialYear);
  const [viewMonth, setViewMonth] = useState<number>(getInitialMonth);

  // When value changes from outside, sync view month/year and manual input
  useEffect(() => {
    if (value) {
      const d = parseDate(value);
      if (d) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
      setManualInput(value);
    } else {
      setManualInput('');
    }
    setManualError(null);
  }, [value]);

  // When opening modal, initialize view year if empty
  useEffect(() => {
    if (isOpen) {
      setManualError(null);
      if (value) {
        setManualInput(value);
        const d = parseDate(value);
        if (d) {
          setViewYear(d.getFullYear());
          setViewMonth(d.getMonth());
        }
      } else {
        setManualInput('');
        setViewYear(getInitialYear());
        setViewMonth(getInitialMonth());
      }
    }
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Navigation boundary checks
  const canGoPrevMonth = (() => {
    if (minDate) {
      const minD = parseDate(minDate);
      if (minD) {
        if (viewYear < minD.getFullYear()) return false;
        if (viewYear === minD.getFullYear() && viewMonth <= minD.getMonth()) return false;
      }
    }
    return viewYear > computedMinYear || (viewYear === computedMinYear && viewMonth > 0);
  })();

  const canGoNextMonth = (() => {
    if (maxDate) {
      const maxD = parseDate(maxDate);
      if (maxD) {
        if (viewYear > maxD.getFullYear()) return false;
        if (viewYear === maxD.getFullYear() && viewMonth >= maxD.getMonth()) return false;
      }
    }
    return viewYear < computedMaxYear || (viewYear === computedMaxYear && viewMonth < 11);
  })();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canGoPrevMonth) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => Math.max(prev - 1, computedMinYear));
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canGoNextMonth) return;
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => Math.min(prev + 1, computedMaxYear));
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newY = parseInt(e.target.value, 10);
    setViewYear(newY);

    // If new year exceeds maxDate year, cap viewMonth
    if (maxDate) {
      const maxD = parseDate(maxDate);
      if (maxD && newY === maxD.getFullYear() && viewMonth > maxD.getMonth()) {
        setViewMonth(maxD.getMonth());
      }
    }
    // If new year is minDate year, ensure viewMonth >= minDate month
    if (minDate) {
      const minD = parseDate(minDate);
      if (minD && newY === minD.getFullYear() && viewMonth < minD.getMonth()) {
        setViewMonth(minD.getMonth());
      }
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setViewMonth(parseInt(e.target.value, 10));
  };

  // Generate calendar days
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInCurrentMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  // Helper to format YYYY-MM-DD
  const formatDateString = (year: number, month: number, day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const isDateDisabled = (year: number, month: number, day: number) => {
    const dateStr = formatDateString(year, month, day);
    if (minDate && dateStr < minDate) return true;
    if (maxDate && dateStr > maxDate) return true;
    return false;
  };

  const isToday = (year: number, month: number, day: number) => {
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  };

  const isSelected = (year: number, month: number, day: number) => {
    if (!selectedDateObj) return false;
    return (
      selectedDateObj.getFullYear() === year &&
      selectedDateObj.getMonth() === month &&
      selectedDateObj.getDate() === day
    );
  };

  const handleSelectDay = (day: number) => {
    if (isDateDisabled(viewYear, viewMonth, day)) return;
    const formatted = formatDateString(viewYear, viewMonth, day);
    onChange(formatted);
    setManualInput(formatted);
    setManualError(null);
    setIsOpen(false);
  };

  // Preset quick selections for travel dates
  const setQuickDate = (daysFromToday: number) => {
    const target = new Date(today);
    target.setDate(today.getDate() + daysFromToday);
    const y = target.getFullYear();
    const m = target.getMonth();
    const d = target.getDate();
    const formatted = formatDateString(y, m, d);
    
    if (minDate && formatted < minDate) return;
    if (maxDate && formatted > maxDate) return;

    setViewYear(y);
    setViewMonth(m);
    onChange(formatted);
    setManualInput(formatted);
    setManualError(null);
    setIsOpen(false);
  };

  // Quick decade jump for Date of Birth
  const handleDecadeJump = (decadeStartYear: number) => {
    const targetYear = Math.min(decadeStartYear + 5, computedMaxYear);
    setViewYear(targetYear);
    // Ensure month doesn't exceed maxDate
    if (maxDate) {
      const maxD = parseDate(maxDate);
      if (maxD && targetYear === maxD.getFullYear() && viewMonth > maxD.getMonth()) {
        setViewMonth(maxD.getMonth());
      }
    }
  };

  // Manual Date Input handler
  const handleApplyManualDate = () => {
    setManualError(null);
    const clean = manualInput.trim();
    if (!clean) return;

    let y = 0, m = 0, d = 0;
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(clean)) {
      // YYYY-MM-DD
      const parts = clean.split('-');
      y = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
      d = parseInt(parts[2], 10);
    } else if (/^\d{1,2}[\/-]\d{1,2}[\/-]\d{4}$/.test(clean)) {
      // DD/MM/YYYY or DD-MM-YYYY
      const parts = clean.split(/[\/-]/);
      d = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10);
      y = parseInt(parts[2], 10);
    } else {
      setManualError('Please enter YYYY-MM-DD or DD/MM/YYYY');
      return;
    }

    if (m < 1 || m > 12 || d < 1 || d > 31) {
      setManualError('Invalid month or day');
      return;
    }

    const maxDays = new Date(y, m, 0).getDate();
    if (d > maxDays) {
      setManualError(`Month ${m}/${y} has only ${maxDays} days`);
      return;
    }

    const formatted = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    if (minDate && formatted < minDate) {
      setManualError(`Date cannot be before ${minDate}`);
      return;
    }
    if (maxDate && formatted > maxDate) {
      setManualError(`Date cannot be after ${maxDate}`);
      return;
    }

    setViewYear(y);
    setViewMonth(m - 1);
    onChange(formatted);
    setManualInput(formatted);
    setIsOpen(false);
  };

  // Human readable display string
  const formatDisplayString = (dateStr: string) => {
    if (!dateStr) return '';
    const d = parseDate(dateStr);
    if (!d) return dateStr;
    
    const dayName = DAYS_OF_WEEK[d.getDay()];
    const monthName = SHORT_MONTH_NAMES[d.getMonth()];
    const day = d.getDate();
    const year = d.getFullYear();

    return `${dayName}, ${day} ${monthName} ${year}`;
  };

  // Generate Year options:
  // For birthdates: descending order (e.g. 2026, 2025, 2024 ... 1920) so adult applicants can pick quickly!
  // For travel: ascending order (e.g. 2026, 2027 ... 2032)
  const yearOptions: number[] = [];
  if (isBirthDatePicker) {
    for (let y = computedMaxYear; y >= computedMinYear; y--) {
      yearOptions.push(y);
    }
  } else {
    for (let y = computedMinYear; y <= computedMaxYear; y++) {
      yearOptions.push(y);
    }
  }

  // Min and Max month boundaries for current view year
  const minAllowedMonth = (() => {
    if (minDate && viewYear === computedMinYear) {
      const minD = parseDate(minDate);
      return minD ? minD.getMonth() : 0;
    }
    return 0;
  })();

  const maxAllowedMonth = (() => {
    if (maxDate && viewYear === computedMaxYear) {
      const maxD = parseDate(maxDate);
      return maxD ? maxD.getMonth() : 11;
    }
    return 11;
  })();

  // Decade jump list for birthdates
  const birthDecades = [2010, 2000, 1990, 1980, 1970, 1960].filter(dec => dec <= computedMaxYear && dec >= computedMinYear);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
          <span>
            {label} {required && <span className="text-rose-500">*</span>}
          </span>
          {value && (
            <span className="text-[11px] font-semibold text-[#0B4DA2] normal-case">
              {formatDisplayString(value)}
            </span>
          )}
        </label>
      )}

      {/* Trigger Button / Input lookalike */}
      <div className="relative group">
        <button
          type="button"
          id={id}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between pl-10 pr-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all text-left cursor-pointer min-h-[44px] ${
            isOpen 
              ? 'border-[#0B4DA2] ring-2 ring-[#0B4DA2]/20 bg-white shadow-xs' 
              : error 
                ? 'border-rose-300 bg-rose-50/20' 
                : 'border-slate-300 bg-white hover:border-slate-400'
          } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''}`}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <span className={value ? 'text-slate-900 font-medium' : 'text-slate-400'}>
              {value ? formatDisplayString(value) : placeholder}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {value && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                  setManualInput('');
                }}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Clear date"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 group-hover:bg-[#0B4DA2]/10 group-hover:text-[#0B4DA2] transition-colors">
              {isBirthDatePicker ? 'DOB' : 'Date'}
            </span>
          </div>
        </button>

        {/* Calendar Icon on the left */}
        <div className="absolute left-3.5 top-3 pointer-events-none text-slate-400 group-hover:text-[#0B4DA2] transition-colors">
          <CalendarIcon className="w-4 h-4 text-[#0B4DA2]" />
        </div>
      </div>

      {/* Hidden input for HTML form submission compatibility */}
      {name && (
        <input 
          type="hidden" 
          name={name} 
          value={value} 
          required={required} 
        />
      )}

      {error && (
        <p className="mt-1 text-xs text-rose-500 font-medium">{error}</p>
      )}

      {/* Dropdown Calendar Popover */}
      {isOpen && (
        <div 
          className="absolute z-50 mt-2 left-0 right-0 sm:right-auto sm:w-[350px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-4 animate-in fade-in-0 zoom-in-95 duration-150"
          style={{ boxShadow: '0 20px 35px -10px rgba(11, 77, 162, 0.18), 0 10px 20px -5px rgba(0, 0, 0, 0.08)' }}
        >
          {/* Header with Month/Year Switcher & Prev/Next navigation */}
          <div className="flex items-center justify-between gap-1.5 pb-3 mb-3 border-b border-slate-100">
            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={!canGoPrevMonth}
              className={`p-1.5 rounded-lg border border-slate-200 text-slate-600 transition-all ${
                canGoPrevMonth 
                  ? 'hover:text-slate-900 hover:bg-slate-100 hover:border-slate-300 cursor-pointer' 
                  : 'opacity-30 cursor-not-allowed bg-slate-50'
              }`}
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 flex-1 justify-center">
              {/* Month Select */}
              <select
                value={viewMonth}
                onChange={handleMonthChange}
                className="text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200/80 rounded-lg px-2 py-1.5 border-none cursor-pointer focus:ring-2 focus:ring-[#0B4DA2]/30 outline-none"
              >
                {MONTH_NAMES.map((m, idx) => {
                  const isMonthDisabled = idx < minAllowedMonth || idx > maxAllowedMonth;
                  return (
                    <option key={m} value={idx} disabled={isMonthDisabled}>
                      {m}
                    </option>
                  );
                })}
              </select>

              {/* Year Select - Full previous years open for birthdate; next years blocked */}
              <select
                value={viewYear}
                onChange={handleYearChange}
                className="text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200/80 rounded-lg px-2 py-1.5 border-none cursor-pointer focus:ring-2 focus:ring-[#0B4DA2]/30 outline-none"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              disabled={!canGoNextMonth}
              className={`p-1.5 rounded-lg border border-slate-200 text-slate-600 transition-all ${
                canGoNextMonth 
                  ? 'hover:text-slate-900 hover:bg-slate-100 hover:border-slate-300 cursor-pointer' 
                  : 'opacity-30 cursor-not-allowed bg-slate-50'
              }`}
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Presets / Decade Jump */}
          {showPresets && (
            <div className="mb-3">
              {isBirthDatePicker ? (
                /* BIRTHDATE MODE: Quick Decade Jump (Instant jump to 2000s, 1990s, 1980s, etc.) */
                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    <span className="flex items-center gap-1">
                      <History className="w-3 h-3 text-[#0B4DA2]" />
                      <span>Quick Decade Jump</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Select Birth Decade</span>
                  </div>
                  <div className="grid grid-cols-6 gap-1">
                    {birthDecades.map((dec) => {
                      const isSelectedDecade = Math.floor(viewYear / 10) * 10 === dec;
                      return (
                        <button
                          key={dec}
                          type="button"
                          onClick={() => handleDecadeJump(dec)}
                          className={`py-1 text-[11px] font-bold rounded-lg transition-all text-center cursor-pointer ${
                            isSelectedDecade
                              ? 'bg-[#0B4DA2] text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {dec}s
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* TRAVEL / BOOKING MODE: Quick Booking Options (Today, Tomorrow, etc.) */
                <div>
                  <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Quick Travel Options</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    <button
                      type="button"
                      onClick={() => setQuickDate(0)}
                      disabled={isDateDisabled(today.getFullYear(), today.getMonth(), today.getDate())}
                      className="px-1.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-[#0B4DA2] hover:text-white disabled:opacity-40 disabled:pointer-events-none rounded-md transition-all text-center cursor-pointer truncate"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDate(1)}
                      disabled={isDateDisabled(today.getFullYear(), today.getMonth(), today.getDate() + 1)}
                      className="px-1.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-[#0B4DA2] hover:text-white disabled:opacity-40 disabled:pointer-events-none rounded-md transition-all text-center cursor-pointer truncate"
                    >
                      Tomorrow
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDate(7)}
                      className="px-1.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-[#0B4DA2] hover:text-white rounded-md transition-all text-center cursor-pointer truncate"
                    >
                      +1 Week
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDate(30)}
                      className="px-1.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-[#0B4DA2] hover:text-white rounded-md transition-all text-center cursor-pointer truncate"
                    >
                      +1 Month
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Direct Manual Entry Box */}
          <div className="mb-3 p-2 bg-slate-50/90 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder={isBirthDatePicker ? "Or type DOB: YYYY-MM-DD or DD/MM/YYYY" : "Or type date: YYYY-MM-DD"}
                value={manualInput}
                onChange={(e) => {
                  setManualInput(e.target.value);
                  if (manualError) setManualError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyManualDate();
                  }
                }}
                className="flex-1 min-w-0 px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0B4DA2]"
              />
              <button
                type="button"
                onClick={handleApplyManualDate}
                className="px-2.5 py-1 text-xs font-bold text-white bg-[#0B4DA2] hover:bg-[#083877] rounded-lg transition-colors cursor-pointer shrink-0"
              >
                Apply
              </button>
            </div>
            {manualError && (
              <p className="text-[10px] text-rose-500 font-semibold mt-1">{manualError}</p>
            )}
          </div>

          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 mb-1 text-center">
            {DAYS_OF_WEEK.map((day, idx) => (
              <div 
                key={day} 
                className={`text-[11px] font-bold py-1 ${
                  idx === 0 || idx === 6 ? 'text-amber-600/80' : 'text-slate-400'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty offset spaces before first day */}
            {Array.from({ length: firstDay }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-8" />
            ))}

            {/* Month Days */}
            {Array.from({ length: daysInCurrentMonth }).map((_, idx) => {
              const day = idx + 1;
              const disabledDay = isDateDisabled(viewYear, viewMonth, day);
              const selected = isSelected(viewYear, viewMonth, day);
              const currentDay = isToday(viewYear, viewMonth, day);

              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabledDay}
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 rounded-lg text-xs font-semibold flex items-center justify-center relative transition-all cursor-pointer ${
                    selected
                      ? 'bg-gradient-to-br from-[#0B4DA2] to-[#083877] text-white shadow-md shadow-blue-500/30 font-bold scale-105'
                      : currentDay
                        ? 'border border-[#0B4DA2] text-[#0B4DA2] bg-blue-50/50 hover:bg-blue-100/70 font-bold'
                        : disabledDay
                          ? 'text-slate-300 bg-slate-50/50 cursor-not-allowed line-through text-[11px]'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span>{day}</span>
                  {currentDay && !selected && (
                    <span className="w-1 h-1 rounded-full bg-[#0B4DA2] absolute bottom-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer with Selected Date & Done Confirmation */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 min-w-0">
              <Clock className="w-3.5 h-3.5 text-[#0B4DA2] shrink-0" />
              <span className="truncate max-w-[170px] font-medium text-slate-800">
                {value ? formatDisplayString(value) : 'No date chosen'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {value && (
                <button
                  type="button"
                  onClick={() => {
                    onChange('');
                    setManualInput('');
                  }}
                  className="px-2 py-1 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 text-xs font-bold text-white bg-[#0B4DA2] hover:bg-[#093d82] rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Done</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
