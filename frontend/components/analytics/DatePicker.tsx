import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format, subDays, startOfDay } from 'date-fns';

interface DatePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  maxDate?: Date;
  minDate?: Date;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  selectedDate,
  onDateChange,
  maxDate = new Date(),
  minDate,
}) => {
  const { t } = useTranslation('admin');
  const [isOpen, setIsOpen] = useState(false);
  
  // Quick select options
  const quickSelectOptions = [
    { label: t('analytics.today'), days: 0 },
    { label: t('analytics.yesterday'), days: 1 },
    { label: t('analytics.lastWeek'), days: 7 },
    { label: t('analytics.daysAgo', { count: 30 }), days: 30 },
  ];
  
  const handleQuickSelect = (days: number) => {
    const date = subDays(new Date(), days);
    onDateChange(startOfDay(date));
    setIsOpen(false);
  };
  
  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value + 'T00:00:00');
    if (!isNaN(date.getTime())) {
      onDateChange(date);
    }
  };
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-md text-white transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>{format(selectedDate, 'MMM d, yyyy')}</span>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 p-4 min-w-[280px]">
          {/* Quick select buttons */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {quickSelectOptions.map((option) => (
              <button
                key={option.days}
                onClick={() => handleQuickSelect(option.days)}
                className="px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 rounded transition text-white"
              >
                {option.label}
              </button>
            ))}
          </div>
          
          {/* Native date input for precise selection */}
          <div className="border-t border-slate-600 pt-4">
            <label className="block text-sm text-slate-400 mb-2">
              {t('analytics.selectDate')}
            </label>
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={handleDateInput}
              max={format(maxDate, 'yyyy-MM-dd')}
              min={minDate ? format(minDate, 'yyyy-MM-dd') : undefined}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};
