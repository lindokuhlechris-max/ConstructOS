import React, { useState } from 'react';
import { Plus, Check, X } from 'lucide-react';

export type SelectOption = string | { value: string; label: string };

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  required?: boolean;
  allowCustom?: boolean;
  customPlaceholder?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  className = '',
  required = false,
  allowCustom = true,
  customPlaceholder = 'Enter custom category...'
}: CustomSelectProps) {
  const [isEnteringCustom, setIsEnteringCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [extraOptions, setExtraOptions] = useState<string[]>([]);

  const normalizedOptions: { value: string; label: string }[] = options.map(opt =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  // Combine default options, extra custom options added by user, and current value if custom
  const allOptions = [
    ...normalizedOptions,
    ...extraOptions.map(e => ({ value: e, label: e })),
    ...(value && !normalizedOptions.some(o => o.value === value) && !extraOptions.includes(value) ? [{ value, label: value }] : [])
  ];

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === '__CUSTOM_NEW__') {
      setIsEnteringCustom(true);
      setCustomValue('');
    } else {
      setIsEnteringCustom(false);
      onChange(selected);
    }
  };

  const handleCustomSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customValue.trim();
    if (trimmed) {
      if (!allOptions.some(o => o.value === trimmed)) {
        setExtraOptions(prev => [...prev, trimmed]);
      }
      onChange(trimmed);
      setIsEnteringCustom(false);
      setCustomValue('');
    }
  };

  const handleCancelCustom = () => {
    setIsEnteringCustom(false);
    setCustomValue('');
  };

  if (isEnteringCustom) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <input
          type="text"
          autoFocus
          required={required}
          placeholder={customPlaceholder}
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCustomSubmit(e);
            if (e.key === 'Escape') handleCancelCustom();
          }}
          className="flex-1 px-3 py-1.5 rounded-xl border border-[#0B5FFF] dark:border-blue-500 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5FFF]/20"
        />
        <button
          type="button"
          onClick={() => handleCustomSubmit()}
          className="p-2 rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-sm transition-colors shrink-0"
          title="Save Custom Option"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleCancelCustom}
          className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors shrink-0"
          title="Cancel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={handleSelectChange}
      required={required}
      className={className}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {allOptions.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
      {allowCustom && (
        <option value="__CUSTOM_NEW__" className="font-bold text-[#0B5FFF]">
          + Add Custom Option...
        </option>
      )}
    </select>
  );
}
